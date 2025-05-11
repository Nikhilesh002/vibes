package mongodb

import (
	"context"
	"fmt"
	"time"

	"github.com/nikhilesh002/mooz/transcoder/config"
	"github.com/nikhilesh002/mooz/transcoder/utils/logger"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type SMongodb struct {
	Client *mongo.Client
}

func New(myEnvs *config.MyEnvStruct, AllLogs *string) (*SMongodb, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	mongoClient, err := mongo.Connect(ctx, options.Client().ApplyURI(myEnvs.MongodbUri))
	if err != nil {
		logger.Println("Failed to connect DB", AllLogs)
		return nil, err
	}

	return &SMongodb{Client: mongoClient}, err
}

func (m *SMongodb) Close() error {
	return m.Client.Disconnect(context.TODO())
}

func (m *SMongodb) AddTranscodedVideoUrl(transcodedVideoUrl string, myEnvs *config.MyEnvStruct, AllLogs *string) error {
	mdb := m.Client.Database("mooz")

	// convert to ObjectId
	videoJobObjId, err := primitive.ObjectIDFromHex(myEnvs.VideoJobId)
	if err != nil {
		logger.Println("Failed to convert to objectID", AllLogs)
		return err
	}

	// 4. save info in mdb
	logger.Println("Link of transcoded video: "+transcodedVideoUrl, AllLogs)

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
				"logs":               *AllLogs,
			},
		},
	)
	if err != nil {
		logger.Println("Failed to insert final transcoded urls", AllLogs)
		return err
	}

	logger.Println(fmt.Sprint(mdbRes), AllLogs)

	return nil
}
