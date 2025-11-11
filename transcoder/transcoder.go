package main

import (
	"bytes"
	"fmt"
	"os"
	"os/exec"
	"strconv"
	"strings"
)

func transcode(inputFileName string, inpFileNameWithoutExt string, allLogs *string) {
	// 1) probe input file using ffprobe (temp/ + inputFileName)
	inputPath := "temp/" + inputFileName

	cmdProbe := exec.Command("ffprobe",
		"-v", "error",
		"-select_streams", "v:0",
		"-show_entries", "stream=width,height,bit_rate",
		"-of", "default=noprint_wrappers=1:nokey=1",
		inputPath,
	)

	probeOutBytes, err := cmdProbe.Output()
	if err != nil {
		addLog(fmt.Sprintf("ffprobe failed: %v", err), allLogs)
		return
	}
	probeOut := strings.TrimSpace(string(probeOutBytes))
	if probeOut == "" {
		addLog("ffprobe returned empty output (file missing or not a video)", allLogs)
		return
	}
	addLog("ffprobe raw output:\n"+probeOut, allLogs)

	// parse ffprobe output: width\nheight\nbit_rate
	lines := strings.Split(probeOut, "\n")
	var width, height int
	var inputBitrateKbps float64

	if len(lines) >= 1 {
		if w, err := strconv.Atoi(strings.TrimSpace(lines[0])); err == nil {
			width = w
		}
	}
	if len(lines) >= 2 {
		if h, err := strconv.Atoi(strings.TrimSpace(lines[1])); err == nil {
			height = h
		}
	}
	if len(lines) >= 3 {
		bs := strings.TrimSpace(lines[2])
		if bs != "" {
			// bit_rate is in bits/sec
			if bps, err := strconv.ParseFloat(bs, 64); err == nil && bps > 0 {
				inputBitrateKbps = bps / 1000.0
			}
		}
	}

	// fallback if no bitrate reported
	if inputBitrateKbps <= 0 {
		// conservative fallback (tune as needed)
		inputBitrateKbps = 1500.0 // since your typical input was ~1.5 Mbps for 720p
		addLog(fmt.Sprintf("ffprobe didn't return bitrate — falling back to %.0f kbps", inputBitrateKbps), allLogs)
	}

	addLog(fmt.Sprintf("Detected: width=%d height=%d inputBitrate≈%.0f kbps", width, height, inputBitrateKbps), allLogs)

	// Derive target bitrates for ladder relative to input (720p baseline)
	// 1080p ~ 1.5x, 720p ~ 1.0x, 480p ~ 0.6x of input
	b1080 := int(inputBitrateKbps * 1.5)
	b720 := int(inputBitrateKbps * 1.0)
	b480 := int(inputBitrateKbps * 0.6)

	// Clamp to reasonable ranges (kbps)
	clamp := func(v, lo, hi int) int {
		if v < lo {
			return lo
		}
		if v > hi {
			return hi
		}
		return v
	}
	b1080 = clamp(b1080, 800, 8000)
	b720 = clamp(b720, 400, 5000)
	b480 = clamp(b480, 200, 2000)

	addLog(fmt.Sprintf("Derived target bitrates (kbps): 1080=%d 720=%d 480=%d", b1080, b720, b480), allLogs)

	// Ensure output directories exist
	for i := 0; i < 3; i++ {
		dir := fmt.Sprintf("%s/output_%d", inpFileNameWithoutExt, i)
		if err := os.MkdirAll(dir, 0755); err != nil {
			addLog(fmt.Sprintf("failed to create output dir %s: %v", dir, err), allLogs)
			return
		}
	}

	// Check if input has audio stream
	cmdAudioProbe := exec.Command("ffprobe",
		"-v", "error",
		"-select_streams", "a",
		"-show_entries", "stream=index",
		"-of", "csv=p=0",
		inputPath,
	)
	audioProbeOut, _ := cmdAudioProbe.Output()
	hasAudio := strings.TrimSpace(string(audioProbeOut)) != ""

	var varStreamMap string
	if hasAudio {
		varStreamMap = "v:0,a:0 v:1,a:1 v:2,a:2"
	} else {
		varStreamMap = "v:0 v:1 v:2"
	}

	// Build ffmpeg command (bitrate-constrained, not CRF)
	// Using 0:a? so missing audio won't fail
	filterComplex := `[0:v]split=3[v1][v2][v3];` +
		`[v1]scale=w=1920:h=1080[v1out];` +
		`[v2]scale=w=1280:h=720[v2out];` +
		`[v3]scale=w=854:h=480[v3out]`

	args := []string{
		"-y",
		"-i", inputPath,
		"-filter_complex", filterComplex,

		// 1080p
		"-map", "[v1out]", "-map", "0:a?",
		"-c:v:0", "libx264",
		"-b:v:0", fmt.Sprintf("%dk", b1080),
		"-maxrate:v:0", fmt.Sprintf("%dk", int(float64(b1080)*1.15)),
		"-bufsize:v:0", fmt.Sprintf("%dk", int(float64(b1080)*2)),
		"-preset", "veryfast",
		"-profile:v:0", "high", "-level:v:0", "4.0",
		"-c:a:0", "aac", "-b:a:0", "192k",

		// 720p
		"-map", "[v2out]", "-map", "0:a?",
		"-c:v:1", "libx264",
		"-b:v:1", fmt.Sprintf("%dk", b720),
		"-maxrate:v:1", fmt.Sprintf("%dk", int(float64(b720)*1.1)),
		"-bufsize:v:1", fmt.Sprintf("%dk", int(float64(b720)*2)),
		"-preset", "veryfast",
		"-profile:v:1", "high", "-level:v:1", "4.0",
		"-c:a:1", "aac", "-b:a:1", "128k",

		// 480p
		"-map", "[v3out]", "-map", "0:a?",
		"-c:v:2", "libx264",
		"-b:v:2", fmt.Sprintf("%dk", b480),
		"-maxrate:v:2", fmt.Sprintf("%dk", int(float64(b480)*1.1)),
		"-bufsize:v:2", fmt.Sprintf("%dk", int(float64(b480)*2)),
		"-preset", "veryfast",
		"-profile:v:2", "high", "-level:v:2", "4.0",
		"-c:a:2", "aac", "-b:a:2", "96k",

		// HLS options
		"-sc_threshold", "0",
		"-hls_flags", "independent_segments",
		"-f", "hls",
		"-hls_time", "6",
		"-hls_playlist_type", "vod",
		"-hls_segment_filename", inpFileNameWithoutExt + "/output_%v/seg_%03d.ts",
		"-master_pl_name", "master.m3u8",
		"-var_stream_map", varStreamMap,

		inpFileNameWithoutExt + "/output_%v/prog.m3u8",
	}

	// Log the command safely (for debugging)
	addLog("Running ffmpeg with arguments:", allLogs)
	var cmdTrace strings.Builder
	cmdTrace.WriteString("ffmpeg")
	for _, a := range args {
		cmdTrace.WriteString(" ")
		// quote only for display
		cmdTrace.WriteString(fmt.Sprintf("%q", a))
	}
	addLog(cmdTrace.String(), allLogs)

	// Execute ffmpeg and capture combined output
	cmd := exec.Command("ffmpeg", args...)
	var combined bytes.Buffer
	cmd.Stdout = &combined
	cmd.Stderr = &combined

	if err := cmd.Run(); err != nil {
		addLog("ffmpeg failed: "+err.Error()+"\n"+combined.String(), allLogs)
		return
	}

	addLog("ffmpeg output:\n"+combined.String(), allLogs)
	addLog("Transcoding completed successfully.", allLogs)
}
