package main

import (
	"os/exec"
)

func transcode(inputFileName string, inpFileNameWithoutExt string, allLogs *string) {

	cmd := exec.Command("ffmpeg",
		"-i", "temp/"+inputFileName,
		"-filter_complex", `[0:v]split=3[v1][v2][v3];[v1]scale=w=1920:h=1080[v1out];[v2]scale=w=1280:h=720[v2out];[v3]scale=w=854:h=480[v3out]`,
		"-map", "[v1out]",
		"-c:v:0", "libx264", "-b:v:0", "5000k", "-maxrate:v:0", "5350k", "-bufsize:v:0", "7500k", "-preset", "veryfast",
		"-map", "[v2out]",
		"-c:v:1", "libx264", "-b:v:1", "3000k", "-maxrate:v:1", "3210k", "-bufsize:v:1", "4200k", "-preset", "veryfast",
		"-map", "[v3out]",
		"-c:v:2", "libx264", "-b:v:2", "1000k", "-maxrate:v:2", "1070k", "-bufsize:v:2", "1400k", "-preset", "veryfast",
		"-f", "hls",
		"-hls_time", "6",
		"-hls_playlist_type", "vod",
		"-hls_segment_filename", inpFileNameWithoutExt+"/output_%v/seg_%03d.ts",
		"-master_pl_name", "master.m3u8",
		"-var_stream_map", "v:0 v:1 v:2",
		inpFileNameWithoutExt+"/output_%v/prog.m3u8",
	)

	stdout, err := cmd.CombinedOutput()

	if err != nil {
		addLog("ffmpeg Err: "+err.Error()+string(stdout), allLogs)
		return
	}

	// Print the output
	addLog("ffmpeg output: "+string(stdout), allLogs)
}
