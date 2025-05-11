package config

import "os"

type MyEnvStruct struct {
	AzStorageAccTemp   string
	AzStorageAccPerma  string
	SrcBlobUrl         string
	DestContainerName  string
	MongodbUri         string
	VideoJobId         string
	SubscriptionId     string
	ResourceGroupName  string
	ContainerGroupName string
	RedisUri           string
}

func MustLoadEnvs() (*MyEnvStruct, error) {
	envs := MyEnvStruct{
		AzStorageAccTemp:   os.Getenv("AZURE_TEMP_STORAGE_ACC_NAME"),
		AzStorageAccPerma:  os.Getenv("AZURE_PERMA_STORAGE_ACC_NAME"),
		SrcBlobUrl:         os.Getenv("SOURCE_VIDEO_URL"),
		DestContainerName:  os.Getenv("DEST_CONTAINER_NAME"),
		MongodbUri:         os.Getenv("MONGODB_URI"),
		VideoJobId:         os.Getenv("VIDEO_JOB_ID"),
		SubscriptionId:     os.Getenv("CONTAINERINSTANCE_SUBSCRIPTION_ID"),
		ResourceGroupName:  os.Getenv("CONTAINERINSTANCE_RESOURCE_GROUP"),
		ContainerGroupName: os.Getenv("CONTAINERINSTANCE_CONTAINER_GROUP_NAME"),
		RedisUri:           os.Getenv("REDIS_URI"),
	}

	// check for ""s

	return &envs, nil
}
