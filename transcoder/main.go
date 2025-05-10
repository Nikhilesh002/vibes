package main

import (
	"context"
	"log"
	"os"
	"sync"
	"time"

	"github.com/Azure/azure-sdk-for-go/sdk/azidentity"
	"github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/containerinstance/armcontainerinstance"
	"github.com/Azure/azure-sdk-for-go/sdk/storage/azblob"
	"github.com/redis/go-redis/v9"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.mongodb.org/mongo-driver/v2/bson"
)

// TODO context kya hi bhai??? in depth

func main() {
	allLogs := ""

	defer func() {
		if r := recover(); r != nil {
			addLog("panic called", &allLogs)
		}
		os.Exit(1)
	}()

	// load envs
	myEnvs, err := loadEnvs()
	if err != nil {
		addLog("Failed to load env vars", &allLogs)
		panic(err)
	}

	// extract req fields
	srcContainerName := getSrcContainerName(myEnvs.srcBlobUrl)
	blobName := getBlobName(myEnvs.srcBlobUrl, srcContainerName)

	// redis client
	opts, err := redis.ParseURL(myEnvs.redisUri)
	if err != nil {
		panic(err)
	}
	rdb := redis.NewClient(opts)

	// az auth
	azCredential, err := azidentity.NewDefaultAzureCredential(nil)

	// 5. execute at last
	defer func() {
		// add job done in redis q
		addLog("Added to queue: VIDEO_TRANSCODING_DONE: DONE", &allLogs)
		rdb.LPush(context.Background(), "VIDEO_TRANSCODING_DONE", "DONE")

		// no-race decr count
		rdb.Decr(context.Background(), "VIDEO_TRANSCODING_JOBS_COUNT")
		luaScript := `
			local current = tonumber(redis.call("GET", KEYS[1]) or "0")
			if current > 0 then
				redis.call("DECR", KEYS[1])
				return 1
			else
				return 0
			end
		`
		rdb.Eval(context.Background(), luaScript, []string{"VIDEO_TRANSCODING_JOBS_COUNT"})

		// kill container grp
		ctx := context.Background()
		azContainerClient, err := armcontainerinstance.NewContainerGroupsClient(myEnvs.subscriptionId, azCredential, nil)
		poller, err := azContainerClient.BeginDelete(ctx, myEnvs.resourceGroupName, myEnvs.containerGroupName, nil)
		res2, err := poller.PollUntilDone(ctx, nil)
		if err != nil {
			log.Fatalf("failed to pull the result: %v", err)
		}

		addLog("Successfully saved video urls", &allLogs)
		addLog("Exiting the container......", &allLogs)

		log.Println("Deleted container: ", res2)
		addLog("Deleted container:-- ", &allLogs)
	}()

	// create a azClient with the azCreddentials
	azTempStorageAccUrl := "https://" + myEnvs.azStorageAccTemp + ".blob.core.windows.net/"
	azTempBlobClient, err := azblob.NewClient(azTempStorageAccUrl, azCredential, nil)
	if err != nil {
		addLog("Failed to create client", &allLogs)
		panic(err)
	}

	addLog("Video source: "+myEnvs.srcBlobUrl, &allLogs)
	addLog("Downloading "+blobName+" from "+srcContainerName, &allLogs)

	// 1. get from blob storage via Azure SDK
	// create temp dir to store raw video
	err = os.MkdirAll("temp/", os.ModePerm)
	if err != nil {
		addLog("Failed to create folder", &allLogs)
		panic(err)
	}

	// create empty file
	fp, err := os.Create("temp/" + blobName)
	if err != nil {
		addLog("Failed to create file", &allLogs)
		panic(err)
	}

	// write downloaded content into file
	len, err := azTempBlobClient.DownloadFile(context.TODO(), srcContainerName, blobName, fp, nil)
	if err != nil {
		log.Fatalln("Failed to download blob:\n", err)
		addLog("Failed to download blob", &allLogs)
		panic(err)
	}

	log.Println("Downloaded blob of ", (len / 1024), "KB size")
	addLog("Downloaded blob", &allLogs)

	// delete blob at azure
	var deleteWg sync.WaitGroup
	deleteWg.Add(1)
	defer deleteWg.Wait()
	go func() {
		res, err := azTempBlobClient.DeleteBlob(context.TODO(), srcContainerName, blobName, nil)
		if err != nil {
			log.Fatalln("Failed to delete blob:\n", err)
			addLog("Failed to delete blob", &allLogs)
			panic(err)
		}
		log.Println("Deleted temp blob: ", res)
		addLog("Deleted temp blob", &allLogs)
		deleteWg.Done()
	}()

	// 2. transcode temp/blobname video into multiple formats using ffmpeg
	inpFileNameWithoutExt := getFilenameWithoutExt(blobName)

	// create final url
	transcodedVideoUrl := "https://" + myEnvs.azStorageAccPerma + ".blob.core.windows.net/" + myEnvs.destContainerName + "/" + inpFileNameWithoutExt + "/master.m3u8"

	// create transcoded dir
	err = os.MkdirAll(inpFileNameWithoutExt+"/", os.ModePerm)
	if err != nil {
		addLog("Failed to create folder", &allLogs)
		panic(err)
	}

	// transcode videos
	addLog("Started processing "+blobName+".....", &allLogs)
	transcode(blobName, inpFileNameWithoutExt, &allLogs)
	addLog("Finished processing "+blobName+".....", &allLogs)

	// 3. upload to dest container
	addLog("Uploading to "+myEnvs.destContainerName+"......", &allLogs)

	// upload contents of ./inpFileNameWithoutExt
	contents, err := os.ReadDir(inpFileNameWithoutExt)
	if err != nil {
		addLog("Failed to read dir contents", &allLogs)
		panic(err)
	}

	// create client for permanent container
	azPermaStorageAccUrl := "https://" + myEnvs.azStorageAccPerma + ".blob.core.windows.net/"
	azPermaBlobClient, err := azblob.NewClient(azPermaStorageAccUrl, azCredential, nil)
	if err != nil {
		addLog("Failed to create client", &allLogs)
		panic(err)
	}

	uploadFolder(azPermaBlobClient, myEnvs.destContainerName, contents, inpFileNameWithoutExt, &allLogs)
	addLog("Uploading done", &allLogs)

	// upload m3u8 files to mongodb
	// mongoClient
	mongoClient, err := mongo.Connect(context.TODO(), options.Client().ApplyURI(myEnvs.mongodbUri))
	if err != nil {
		addLog("Failed to connect DB", &allLogs)
		panic(err)
	}
	defer func() {
		if err := mongoClient.Disconnect(context.TODO()); err != nil {
			panic(err)
		}
	}()
	mdb := mongoClient.Database("vidmux")

	// convert to ObjectId
	videoJobObjId, err := primitive.ObjectIDFromHex(myEnvs.videoJobId)
	if err != nil {
		panic(err)
	}

	// 4. save info in mdb
	addLog("Link of transcoded video: "+transcodedVideoUrl, &allLogs)

	mdbRes, err := mdb.Collection("videojobs").UpdateOne(
		context.TODO(),
		bson.M{
			"_id": videoJobObjId,
		},
		bson.M{
			"$set": bson.M{
				"transcodedVideoUrl": transcodedVideoUrl,
				"completedAt":        time.Now(),
				"updatedAt":          time.Now(),
				"status":             "DONE",
				"logs":               allLogs,
			},
		},
	)

	if err != nil {
		addLog("Failed to insert final transcoded urls", &allLogs)
		panic(err)
	}
	log.Println("Resp from DB: ", mdbRes)
	addLog("Resp from DB: ", &allLogs)
}
