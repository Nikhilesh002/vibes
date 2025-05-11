package db

type Db interface{
	AddTranscodedVideoUrl() error
}