package main

import (
	"log"
	"time"
)

func addLog(str string, allLogs *string) {
	log.Println(str)
	*allLogs += "[" + time.Now().Format("2006-01-02 15:04:05") + "] " + str + "\n\n"

	// stream if possible
}
