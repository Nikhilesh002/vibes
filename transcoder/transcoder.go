package main

import (
	"bytes"
	"fmt"
	"os"
	"os/exec"
	"strconv"
	"strings"
)

type probeResult struct {
	width           int
	height          int
	bitrateKbps     float64
	hasAudio        bool
	durationSeconds float64
}

func probe(inputPath string, allLogs *string) probeResult {
	// ── Video stream: width, height, bitrate ──
	cmdVideo := exec.Command("ffprobe",
		"-v", "error",
		"-select_streams", "v:0",
		"-show_entries", "stream=width,height,bit_rate",
		"-of", "default=noprint_wrappers=1:nokey=1",
		inputPath,
	)
	videoOut, err := cmdVideo.Output()
	if err != nil {
		addLog(fmt.Sprintf("ffprobe (video) failed: %v", err), allLogs)
		return probeResult{}
	}

	lines := strings.Split(strings.TrimSpace(string(videoOut)), "\n")
	var r probeResult

	if len(lines) >= 1 {
		if w, e := strconv.Atoi(strings.TrimSpace(lines[0])); e == nil {
			r.width = w
		}
	}
	if len(lines) >= 2 {
		if h, e := strconv.Atoi(strings.TrimSpace(lines[1])); e == nil {
			r.height = h
		}
	}
	if len(lines) >= 3 {
		if bps, e := strconv.ParseFloat(strings.TrimSpace(lines[2]), 64); e == nil && bps > 0 {
			r.bitrateKbps = bps / 1000.0
		}
	}

	// ── Container-level bitrate fallback (when stream bit_rate is N/A) ──
	if r.bitrateKbps <= 0 {
		cmdFormat := exec.Command("ffprobe",
			"-v", "error",
			"-show_entries", "format=bit_rate",
			"-of", "default=noprint_wrappers=1:nokey=1",
			inputPath,
		)
		if fmtOut, e := cmdFormat.Output(); e == nil {
			if bps, e := strconv.ParseFloat(strings.TrimSpace(string(fmtOut)), 64); e == nil && bps > 0 {
				r.bitrateKbps = bps / 1000.0
			}
		}
	}

	// ── Duration (for file-size guard) ──
	cmdDur := exec.Command("ffprobe",
		"-v", "error",
		"-show_entries", "format=duration",
		"-of", "default=noprint_wrappers=1:nokey=1",
		inputPath,
	)
	if durOut, e := cmdDur.Output(); e == nil {
		if d, e := strconv.ParseFloat(strings.TrimSpace(string(durOut)), 64); e == nil && d > 0 {
			r.durationSeconds = d
		}
	}

	// ── Audio presence ──
	cmdAudio := exec.Command("ffprobe",
		"-v", "error",
		"-select_streams", "a",
		"-show_entries", "stream=index",
		"-of", "csv=p=0",
		inputPath,
	)
	audioOut, _ := cmdAudio.Output()
	r.hasAudio = strings.TrimSpace(string(audioOut)) != ""

	addLog(fmt.Sprintf("Probe: %dx%d, bitrate=%.0f kbps, duration=%.1fs, audio=%v",
		r.width, r.height, r.bitrateKbps, r.durationSeconds, r.hasAudio), allLogs)

	return r
}

// ─────────────────────────────────────────────────────────────────────────────
// Bitrate ladder
//
// Each rung defines: label, short side (height for landscape, width for
// portrait), video bitrate cap, audio bitrate, and the CRF value.
//
// We use CRF (constant quality) with a maxrate ceiling so that:
//   - Simple scenes  → smaller than the cap  (saves storage + bandwidth)
//   - Complex scenes  → never exceeds the cap (predictable peak bitrate)
//   - Output is NEVER larger than input       (capped to input bitrate)
// ─────────────────────────────────────────────────────────────────────────────
type rung struct {
	label      string
	shortSide  int     // height for landscape, width for portrait
	maxBitrate int     // kbps — video ceiling
	audioBR    string  // e.g. "128k"
	crf        int
}

var defaultLadder = []rung{
	{"1080p", 1080, 4500, "128k", 23},
	{"720p", 720, 2500, "128k", 24},
	{"480p", 480, 1000, "96k", 26},
}

func transcode(inputFileName string, inpFileNameWithoutExt string, allLogs *string) bool {
	inputPath := "temp/" + inputFileName
	p := probe(inputPath, allLogs)
	if p.width == 0 || p.height == 0 {
		addLog("Cannot determine input dimensions — aborting", allLogs)
		return false
	}

	isPortrait := p.height > p.width
	// "short side" = the smaller dimension of the input
	inputShortSide := p.height
	if isPortrait {
		inputShortSide = p.width
	}

	// ── Build the ladder: skip rungs bigger than the source ──
	var ladder []rung
	for _, r := range defaultLadder {
		if r.shortSide <= inputShortSide {
			ladder = append(ladder, r)
		}
	}
	if len(ladder) == 0 {
		// Source is very small — just use the lowest rung
		ladder = append(ladder, defaultLadder[len(defaultLadder)-1])
	}

	// ── Cap each rung's bitrate to the input bitrate ──
	// This is the key fix: if the input is 1200 kbps, we never target 4500 kbps
	// for 1080p — that would make the output LARGER than the input.
	if p.bitrateKbps > 0 {
		inputBR := int(p.bitrateKbps)
		for i := range ladder {
			if ladder[i].maxBitrate > inputBR {
				ladder[i].maxBitrate = inputBR
			}
		}
	}

	addLog(fmt.Sprintf("Ladder (%d rungs, portrait=%v):", len(ladder), isPortrait), allLogs)
	for _, r := range ladder {
		addLog(fmt.Sprintf("  %s: shortSide=%d, maxBR=%d kbps, CRF=%d, audio=%s",
			r.label, r.shortSide, r.maxBitrate, r.crf, r.audioBR), allLogs)
	}

	// ── Ensure output directories ──
	for i := range ladder {
		dir := fmt.Sprintf("%s/output_%d", inpFileNameWithoutExt, i)
		if err := os.MkdirAll(dir, 0755); err != nil {
			addLog(fmt.Sprintf("Failed to create dir %s: %v", dir, err), allLogs)
			return false
		}
	}

	// ── Build ffmpeg args ──
	//
	// Scale filter: uses force_original_aspect_ratio=decrease so non-standard
	// aspect ratios scale down to fit WITHIN the target box without stretching.
	// No padding — the player handles letterboxing, and we save storage.
	//
	// We use -2 for the computed dimension so FFmpeg rounds to an even number
	// (required by libx264).
	//
	// Preset "fast" (not "veryfast") — on 1 CPU / 1 GB RAM, "fast" gives ~20%
	// better compression than "veryfast" without blowing up memory. "medium" or
	// slower would exceed the 1 GB RAM limit on complex scenes.

	n := len(ladder)

	// filter_complex: split → per-rung scale
	var fc strings.Builder
	fc.WriteString(fmt.Sprintf("[0:v]split=%d", n))
	for i := range ladder {
		fc.WriteString(fmt.Sprintf("[v%d]", i))
	}
	fc.WriteString("; ")
	for i, r := range ladder {
		// scale keeping aspect ratio, fit inside the target box
		// landscape: height=shortSide, width=-2
		// portrait:  width=shortSide, height=-2
		if isPortrait {
			fc.WriteString(fmt.Sprintf("[v%d]scale=w=%d:h=-2:force_original_aspect_ratio=decrease[v%dout]",
				i, r.shortSide, i))
		} else {
			fc.WriteString(fmt.Sprintf("[v%d]scale=w=-2:h=%d:force_original_aspect_ratio=decrease[v%dout]",
				i, r.shortSide, i))
		}
		if i < n-1 {
			fc.WriteString("; ")
		}
	}

	args := []string{"-y", "-i", inputPath, "-filter_complex", fc.String()}

	// Per-rung output mapping
	for i, r := range ladder {
		args = append(args,
			"-map", fmt.Sprintf("[v%dout]", i),
		)
		if p.hasAudio {
			args = append(args, "-map", "0:a")
		}
		args = append(args,
			// Video codec
			fmt.Sprintf("-c:v:%d", i), "libx264",
			fmt.Sprintf("-crf:v:%d", i), fmt.Sprintf("%d", r.crf),
			fmt.Sprintf("-maxrate:v:%d", i), fmt.Sprintf("%dk", r.maxBitrate),
			fmt.Sprintf("-bufsize:v:%d", i), fmt.Sprintf("%dk", r.maxBitrate*2),
			"-preset", "fast",
			fmt.Sprintf("-profile:v:%d", i), "high",
			fmt.Sprintf("-level:v:%d", i), "4.0",
			"-movflags", "+faststart",
		)
		if p.hasAudio {
			args = append(args,
				fmt.Sprintf("-c:a:%d", i), "aac",
				fmt.Sprintf("-b:a:%d", i), r.audioBR,
				fmt.Sprintf("-ac:%d", i), "2",
			)
		}
	}

	// var_stream_map
	var vsm strings.Builder
	for i := range ladder {
		if i > 0 {
			vsm.WriteString(" ")
		}
		if p.hasAudio {
			vsm.WriteString(fmt.Sprintf("v:%d,a:%d", i, i))
		} else {
			vsm.WriteString(fmt.Sprintf("v:%d", i))
		}
	}

	args = append(args,
		"-sc_threshold", "0",
		"-hls_flags", "independent_segments",
		"-f", "hls",
		"-hls_time", "6",
		"-hls_playlist_type", "vod",
		"-hls_segment_filename", inpFileNameWithoutExt+"/output_%v/seg_%03d.ts",
		"-master_pl_name", "master.m3u8",
		"-var_stream_map", vsm.String(),
		inpFileNameWithoutExt+"/output_%v/prog.m3u8",
	)

	// Log command for debugging
	addLog("Running ffmpeg:", allLogs)
	var cmdTrace strings.Builder
	cmdTrace.WriteString("ffmpeg")
	for _, a := range args {
		cmdTrace.WriteString(" ")
		cmdTrace.WriteString(fmt.Sprintf("%q", a))
	}
	addLog(cmdTrace.String(), allLogs)

	cmd := exec.Command("ffmpeg", args...)
	var combined bytes.Buffer
	cmd.Stdout = &combined
	cmd.Stderr = &combined

	if err := cmd.Run(); err != nil {
		addLog("ffmpeg failed: "+err.Error()+"\n"+combined.String(), allLogs)
		return false
	}

	addLog("ffmpeg output:\n"+combined.String(), allLogs)
	addLog("Transcoding completed successfully.", allLogs)
	return true
}
