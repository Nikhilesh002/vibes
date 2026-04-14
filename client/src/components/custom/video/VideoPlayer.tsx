import React, { Suspense, useMemo } from "react"

const HlsPlayer = React.lazy(() => import("./HlsPlayer"))

function canPlayNativeHls(): boolean {
  if (typeof document === "undefined") return false

  const video = document.createElement("video")

  const types = [
    "application/vnd.apple.mpegurl",
    "application/x-mpegURL",
    "audio/mpegurl",
  ]

  return types.some((type) => video.canPlayType(type) !== "")
}

function canUseHlsJs(): boolean {
  return typeof window !== "undefined" && "MediaSource" in window
}

function VideoPlayer({
  videoData,
}: {
  videoData: { thumbnailUrl: string; videoUrl: string }
}) {
  const mode =
    sessionStorage.getItem("vibes-video-mode") ||
    useMemo(() => {
      let mode: "native" | "hls.js" | "unsupported" = "unsupported"
      if (canPlayNativeHls()) {
        mode = "native"
      } else if (canUseHlsJs()) {
        mode = "hls.js"
      }

      sessionStorage.setItem("vibes-video-mode", mode)
      return mode
    }, [])

  if (mode === "native") {
    return (
      <video
        className="w-full"
        src={videoData.videoUrl}
        poster={videoData.thumbnailUrl}
        controls
      />
    )
  }

  if (mode === "hls.js") {
    return (
      <Suspense fallback={<div>Loading player...</div>}>
        <HlsPlayer videoData={videoData} />
      </Suspense>
    )
  }

  return <div>Video not supported</div>
}

export default VideoPlayer
