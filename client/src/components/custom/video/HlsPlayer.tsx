import { useEffect, useRef } from "react"
import Hls from "hls.js"

function HlsPlayer({
  videoData,
}: {
  videoData: { thumbnailUrl: string; videoUrl: string }
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    let hls: Hls | null = null

    if (Hls.isSupported()) {
      hls = new Hls()

      hls.attachMedia(video)

      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        hls?.loadSource(videoData.videoUrl)
      })
    } else {
      // fallback (very rare if you reached here)
      video.src = videoData.videoUrl
    }

    return () => {
      if (hls) {
        hls.destroy()
      }
    }
  }, [videoData.videoUrl]) // ✅ stable dependency

  return (
    <video
      ref={videoRef}
      controls
      className="w-full"
      poster={videoData.thumbnailUrl}
    />
  )
}

export default HlsPlayer