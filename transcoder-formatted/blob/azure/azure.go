package azure

import (
	"github.com/Azure/azure-sdk-for-go/sdk/azidentity"
	"github.com/Azure/azure-sdk-for-go/sdk/storage/azblob"
	"github.com/nikhilesh002/mooz/transcoder/config"
	"github.com/nikhilesh002/mooz/transcoder/utils/logger"
)

func New(myEnvs *config.MyEnvStruct, clientType string, AllLogs *string) (*azblob.Client, error) {
	azCredential, err := azidentity.NewDefaultAzureCredential(nil)
	if err != nil {
		logger.Println("Failed to login to azure", AllLogs)
		return nil, err
	}

	var client *azblob.Client

	if clientType == "TEMP" {
		azTempStorageAccUrl := "https://" + myEnvs.AzStorageAccTemp + ".blob.core.windows.net/"
		client, err = azblob.NewClient(azTempStorageAccUrl, azCredential, nil)

	} else {
		azPermaStorageAccUrl := "https://" + myEnvs.AzStorageAccPerma + ".blob.core.windows.net/"
		client, err = azblob.NewClient(azPermaStorageAccUrl, azCredential, nil)
	}

	if err != nil {
		logger.Println("Failed to create client", AllLogs)
		return nil, err
	}

	return client, err

}
