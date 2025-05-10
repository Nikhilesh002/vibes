package main

import (
	"context"
	"log"
	"os"
	"sync"

	"github.com/Azure/azure-sdk-for-go/sdk/storage/azblob"
)

func uploadFolder(azPermaBlobClient *azblob.Client, destContainerName string, dirContents []os.DirEntry, foldername string, allLogs *string) {
	var uploadWg sync.WaitGroup
	for i, content := range dirContents {
		uploadWg.Add(1)
		go func() {
			defer uploadWg.Done()

			if content.Type().IsDir() == true {
				log.Println("sub dir: ", foldername+"/"+content.Name())
				subDirContents, err := os.ReadDir(foldername + "/" + content.Name())
				if err != nil {
					addLog("Cant read sub dir: "+content.Name()+"/*", allLogs)
				}
				uploadFolder(azPermaBlobClient, destContainerName, subDirContents, foldername+"/"+content.Name(), allLogs)
			} else {
				log.Println("Uploading: ", foldername+"/"+content.Name())

				file, err := os.OpenFile(foldername+"/"+content.Name(), os.O_RDONLY, 0)
				defer file.Close()

				_, err = azPermaBlobClient.UploadFile(context.TODO(), destContainerName, foldername+"/"+content.Name(), file, nil)
				if err != nil {
					addLog("Failed to upload blob", allLogs)
					panic(err)
				}
			}
		}()
		if i%5 == 0 {
			uploadWg.Wait()
		}
	}
	uploadWg.Wait()
}
