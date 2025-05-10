package main

import (
	"strings"
)

func getBlobName(srcBlobUrl string, srcContainerName string) string {
	return strings.Split(srcBlobUrl, "blob.core.windows.net/"+srcContainerName+"/")[1]
}

func getSrcContainerName(srcBlobUrl string) string {
	blobLoc := strings.Split(srcBlobUrl, "blob.core.windows.net/")[1]
	return strings.Split(blobLoc, "/")[0]
}

func getFilenameWithoutExt(fileName string) string {
	i := len(fileName) - 1

	for i >= 0 {
		if fileName[i] == '.' {
			break
		}
		i--
	}

	return strings.ReplaceAll(string(fileName[0:i]), " ", "_")
}
