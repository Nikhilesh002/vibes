package main

import "os"

type MyEnvStruct struct {
	azStorageAccTemp   string
	azStorageAccPerma  string
	srcBlobUrl         string
	destContainerName  string
	mongodbUri         string
	videoId            string
	subscriptionId     string
	resourceGroupName  string
	containerGroupName string
}

func loadEnvs() (MyEnvStruct, error) {
	// envs := MyEnvStruct{
	// 	azStorageAccTemp:   os.Getenv("AZURE_TEMP_STORAGE_ACC_NAME"),
	// 	azStorageAccPerma:  os.Getenv("AZURE_PERMA_STORAGE_ACC_NAME"),
	// 	srcBlobUrl:         os.Getenv("SOURCE_VIDEO_URL"),
	// 	destContainerName:  os.Getenv("DEST_CONTAINER_NAME"),
	// 	mongodbUri:         os.Getenv("MONGODB_URI"),
	// 	videoId:            os.Getenv("VIDEO_ID"),
	// 	subscriptionId:     os.Getenv("CONTAINERINSTANCE_SUBSCRIPTION_ID"),
	// 	resourceGroupName:  os.Getenv("CONTAINERINSTANCE_RESOURCE_GROUP"),
	// 	containerGroupName: os.Getenv("CONTAINERINSTANCE_CONTAINER_GROUP_NAME"),
	// }

	envs := MyEnvStruct{
		azStorageAccTemp:   "vidmuxtemp",
		azStorageAccPerma:  "vidmuxperma",
		srcBlobUrl:         "https://vidmuxtemp.blob.core.windows.net/tempbucket/iphone16_b87da80f79de88.mp4",
		destContainerName:  "permabucket",
		mongodbUri:         "mongodb+srv://nikhileshg02:vEUSjjTap1BB28R7@cluster0.ri3df.mongodb.net/vidmux",
		videoId:            "68c046b76f6f7d71e65e0128",
		subscriptionId:     "04a087ea-8ca3-49d9-862a-6bbbc51f5324",
		resourceGroupName:  "vidmux",
		containerGroupName: "nikkiwegrd",
	}

	os.Setenv("AZURE_CLIENT_ID", "9cb70bc4-0a75-46d0-b24c-d34d8ca79907")
	os.Setenv("AZURE_TENANT_ID", "6114ef22-3c9b-48f6-9e31-89979d59bb86")
	os.Setenv("AZURE_CLIENT_SECRET", "kSk8Q~7kf6ubK6Mm14TQdH2S1yZ4aRq12PyI_a82")

	// check for ""s

	return envs, nil
}
