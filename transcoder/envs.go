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
	envs := MyEnvStruct{
		azStorageAccTemp:   os.Getenv("AZURE_TEMP_STORAGE_ACC_NAME"),
		azStorageAccPerma:  os.Getenv("AZURE_PERMA_STORAGE_ACC_NAME"),
		srcBlobUrl:         os.Getenv("SOURCE_VIDEO_URL"),
		destContainerName:  os.Getenv("DEST_CONTAINER_NAME"),
		mongodbUri:         os.Getenv("MONGODB_URI"),
		videoId:            os.Getenv("VIDEO_ID"),
		subscriptionId:     os.Getenv("CONTAINERINSTANCE_SUBSCRIPTION_ID"),
		resourceGroupName:  os.Getenv("CONTAINERINSTANCE_RESOURCE_GROUP"),
		containerGroupName: os.Getenv("CONTAINERINSTANCE_CONTAINER_GROUP_NAME"),
	}

	// check for ""s

	return envs, nil
}
