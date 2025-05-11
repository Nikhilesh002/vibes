package logger

import (
	"log"
	"time"
)

func Println(str string, AllLogs *string) {
	log.Println(str)
	*AllLogs += "[" + time.Now().Format("2006-01-02 15:04:05") + "] " + str + "\n\n"

	// TODO stream
}
