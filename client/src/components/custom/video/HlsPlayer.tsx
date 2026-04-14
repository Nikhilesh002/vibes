import { useEffect, useRef, useState, useCallback } from "react"
import Hls from "hls.js"
import { Settings, Gauge } from "lucide-react"

// ─── Types ───────────────────────────────────────────────────────────────────

interface HlsPlayerProps {
  videoData: {
    thumbnailUrl: string
    videoUrl: string
    videoSasToken: string
  }
  onTheaterToggle?: (isTheater: boolean) => void
}

interface QualityLevel {
  index: number
  height: number
  bitrate: number
}

// ─── Speed steps ─────────────────────────────────────────────────────────────

const SPEED_STEPS = [
  0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 4,
]

function nextSpeed(current: number, direction: 1 | -1): number {
  const idx = SPEED_STEPS.indexOf(current)
  if (idx === -1) return 1
  const next = idx + direction
  if (next < 0 || next >= SPEED_STEPS.length) return current
  return SPEED_STEPS[next]
}

// ─── Component ───────────────────────────────────────────────────────────────

function HlsPlayer({ videoData, onTheaterToggle }: HlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const hlsRef = useRef<Hls | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const [levels, setLevels] = useState<QualityLevel[]>([])
  const [activeLevel, setActiveLevel] = useState<number>(-1) // -1 = auto
  const [showSettings, setShowSettings] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [isTheater, setIsTheater] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimeout = useRef<ReturnType<typeof setTimeout>>(undefined)

  // ── Transient toast overlay ──────────────────────────────────────────────

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    clearTimeout(toastTimeout.current)
    toastTimeout.current = setTimeout(() => setToast(null), 800)
  }, [])

  // ── HLS lifecycle ────────────────────────────────────────────────────────

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    let hls: Hls | null = null

    if (Hls.isSupported()) {
      const hlsConfig: Partial<Hls["config"]> = {
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        maxBufferSize: 60 * 1000 * 1000,
        backBufferLength: 15,
        capLevelToPlayerSize: true,

        // ABR tuning — YouTube-like EWMA smoothing
        abrEwmaFastLive: 3,
        abrEwmaSlowLive: 9,
        abrBandWidthFactor: 0.8,
        abrBandWidthUpFactor: 0.7,
        maxStarvationDelay: 4,
        maxLoadingDelay: 4,
      }

      // SAS token — append to every HLS sub-request (playlists + segments)
      if (videoData.videoSasToken) {
        hlsConfig.xhrSetup = (xhr, url) => {
          const sep = url.includes("?") ? "&" : "?"
          xhr.open("GET", `${url}${sep}${videoData.videoSasToken}`, true)
        }
      }

      hls = new Hls(hlsConfig)
      hlsRef.current = hls

      hls.attachMedia(video)

      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        hls!.loadSource(videoData.videoUrl)
      })

      // Expose available quality levels once manifest is parsed
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        const parsed =
          hls!.levels.map((l, i) => ({
            index: i,
            height: l.height,
            bitrate: l.bitrate,
          })) || []
        setLevels(parsed)
      })

      // Buffer-aware adaptive logic (YouTube-style)
      // Low buffer → emergency drop to lowest quality
      // High buffer + auto mode → let ABR upgrade freely
      hls.on(Hls.Events.FRAG_BUFFERED, () => {
        if (!video || !hls) return
        const buffered =
          video.buffered.length > 0
            ? video.buffered.end(video.buffered.length - 1) - video.currentTime
            : 0

        if (buffered < 5 && hls.currentLevel === -1) {
          hls.nextLevel = 0 // drop to lowest
        }
        if (buffered > 25 && hls.currentLevel === -1) {
          hls.nextLevel = -1 // let ABR decide
        }
      })

      // Error recovery
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (!data.fatal) return
        console.error("HLS fatal error:", data)
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            hls!.startLoad()
            break
          case Hls.ErrorTypes.MEDIA_ERROR:
            hls!.recoverMediaError()
            break
          default:
            hls!.destroy()
            break
        }
      })
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari native HLS — SAS token appended to source URL
      const sep = videoData.videoUrl.includes("?") ? "&" : "?"
      video.src = videoData.videoSasToken
        ? `${videoData.videoUrl}${sep}${videoData.videoSasToken}`
        : videoData.videoUrl
    }

    return () => {
      hls?.destroy()
      hlsRef.current = null
    }
  }, [videoData.videoUrl, videoData.videoSasToken])

  // ── Quality switch ───────────────────────────────────────────────────────

  const setQuality = useCallback(
    (level: number) => {
      const hls = hlsRef.current
      if (!hls) return
      hls.currentLevel = level
      if (level !== -1) hls.nextLevel = level
      setActiveLevel(level)
      setShowSettings(false)
      showToast(level === -1 ? "Auto" : `${levels[level]?.height}p`)
    },
    [levels, showToast]
  )

  // ── Keyboard shortcuts ───────────────────────────────────────────────────
  // Only active when the player container is focused (not when typing in
  // comment box or search). We use onKeyDown on the container div.

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const video = videoRef.current
      if (!video) return

      // Don't capture if user is typing in an input/textarea
      const tag = (e.target as HTMLElement).tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return

      switch (e.key.toLowerCase()) {
        // ── Seek ──
        case "arrowleft":
          e.preventDefault()
          video.currentTime = Math.max(0, video.currentTime - 5)
          showToast("-5s")
          break
        case "arrowright":
          e.preventDefault()
          video.currentTime = Math.min(video.duration, video.currentTime + 5)
          showToast("+5s")
          break

        // ── Volume ──
        case "arrowup":
          e.preventDefault()
          {
            const newVol = Math.min(1, video.volume + 0.1)
            video.volume = newVol
            // volume tracked on video element directly
            video.muted = false
            showToast(`${Math.round(newVol * 100)}%`)
          }
          break
        case "arrowdown":
          e.preventDefault()
          {
            const newVol = Math.max(0, video.volume - 0.1)
            video.volume = newVol
            // volume tracked on video element directly
            showToast(`${Math.round(newVol * 100)}%`)
          }
          break

        // ── Mute ──
        case "m":
          video.muted = !video.muted
          showToast(video.muted ? "Muted" : "Unmuted")
          break

        // ── Speed: S = slower, D = faster ──
        case "s":
          {
            const ns = nextSpeed(video.playbackRate, -1)
            video.playbackRate = ns
            setSpeed(ns)
            showToast(`${ns}x`)
          }
          break
        case "d":
          {
            const ns = nextSpeed(video.playbackRate, 1)
            video.playbackRate = ns
            setSpeed(ns)
            showToast(`${ns}x`)
          }
          break

        // ── Theater mode ──
        case "t":
          setIsTheater((prev) => {
            const next = !prev
            onTheaterToggle?.(next)
            showToast(next ? "Theater mode" : "Default view")
            return next
          })
          break

        // ── Space = play/pause (native, but ensure it works) ──
        case " ":
          e.preventDefault()
          if (video.paused) video.play()
          else video.pause()
          break

        // ── F = fullscreen ──
        case "f":
          if (document.fullscreenElement) {
            document.exitFullscreen()
          } else {
            containerRef.current?.requestFullscreen()
          }
          break
      }
    },
    [showToast, onTheaterToggle]
  )

  // ── Close settings on outside click ──────────────────────────────────────

  useEffect(() => {
    if (!showSettings) return
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setShowSettings(false)
      }
    }
    document.addEventListener("click", handler)
    return () => document.removeEventListener("click", handler)
  }, [showSettings])

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      ref={containerRef}
      className="group relative bg-black focus:outline-none"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <video
        ref={videoRef}
        controls
        autoPlay={true}
        className="w-full"
        poster={videoData.thumbnailUrl}
      />

      {/* ── Toast overlay ──────────────────────────────────────────────── */}
      {toast && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-lg bg-black/75 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
            {toast}
          </div>
        </div>
      )}

      {/* ── Custom controls bar ────────────────────────────────────────── */}
      <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
        {/* Speed indicator */}
        {speed !== 1 && (
          <div className="flex items-center gap-1 rounded-md bg-black/60 px-2 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
            <Gauge className="h-3.5 w-3.5" />
            {speed}x
          </div>
        )}

        {/* Theater toggle */}
        <button
          onClick={() =>
            setIsTheater((prev) => {
              const next = !prev
              onTheaterToggle?.(next)
              return next
            })
          }
          className="rounded-md bg-black/60 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-black/80"
          title="Theater mode (T)"
        >
          {isTheater ? (
            <svg height="16" viewBox="0 0 24 24" width="16">
              <path
                d="M21.20 3.01L21 3H3L2.79 3.01C2.30 3.06 1.84 3.29 1.51 3.65C1.18 4.02 .99 4.50 1 5V19L1.01 19.20C1.05 19.66 1.26 20.08 1.58 20.41C1.91 20.73 2.33 20.94 2.79 20.99L3 21H21L21.20 20.98C21.66 20.94 22.08 20.73 22.41 20.41C22.73 20.08 22.94 19.66 22.99 19.20L23 19V5C23.00 4.50 22.81 4.02 22.48 3.65C22.15 3.29 21.69 3.06 21.20 3.01ZM3 15V5H21V15H3ZM7.87 6.72L7.79 6.79L4.58 10L7.79 13.20C7.88 13.30 7.99 13.37 8.11 13.43C8.23 13.48 8.37 13.51 8.50 13.51C8.63 13.51 8.76 13.48 8.89 13.43C9.01 13.38 9.12 13.31 9.21 13.21C9.31 13.12 9.38 13.01 9.43 12.89C9.48 12.76 9.51 12.63 9.51 12.50C9.51 12.37 9.48 12.23 9.43 12.11C9.37 11.99 9.30 11.88 9.20 11.79L7.41 10L9.20 8.20L9.27 8.13C9.42 7.93 9.50 7.69 9.48 7.45C9.47 7.20 9.36 6.97 9.19 6.80C9.02 6.63 8.79 6.52 8.54 6.51C8.30 6.49 8.06 6.57 7.87 6.72ZM14.79 6.79C14.60 6.98 14.50 7.23 14.50 7.5C14.50 7.76 14.60 8.01 14.79 8.20L16.58 10L14.79 11.79L14.72 11.86C14.57 12.06 14.49 12.30 14.50 12.54C14.51 12.79 14.62 13.02 14.79 13.20C14.97 13.37 15.20 13.48 15.45 13.49C15.69 13.50 15.93 13.42 16.13 13.27L16.20 13.20L19.41 10L16.20 6.79C16.01 6.60 15.76 6.50 15.5 6.50C15.23 6.50 14.98 6.60 14.79 6.79ZM3 19V17H21V19H3Z"
                fill="white"
              ></path>
            </svg>
          ) : (
            <svg fill="none" height="16" viewBox="0 0 24 24" width="16">
              <path
                d="M21.20 3.01L21 3H3L2.79 3.01C2.30 3.06 1.84 3.29 1.51 3.65C1.18 4.02 .99 4.50 1 5V19L1.01 19.20C1.05 19.66 1.26 20.08 1.58 20.41C1.91 20.73 2.33 20.94 2.79 20.99L3 21H21L21.20 20.98C21.66 20.94 22.08 20.73 22.41 20.41C22.73 20.08 22.94 19.66 22.99 19.20L23 19V5C23.00 4.50 22.81 4.02 22.48 3.65C22.15 3.29 21.69 3.06 21.20 3.01ZM3 15V5H21V15H3ZM16.87 6.72H16.86L16.79 6.79L13.58 10L16.79 13.20C16.88 13.30 16.99 13.37 17.11 13.43C17.23 13.48 17.37 13.51 17.50 13.51C17.63 13.51 17.76 13.48 17.89 13.43C18.01 13.38 18.12 13.31 18.21 13.21C18.31 13.12 18.38 13.01 18.43 12.89C18.48 12.76 18.51 12.63 18.51 12.50C18.51 12.37 18.48 12.23 18.43 12.11C18.37 11.99 18.30 11.88 18.20 11.79L16.41 10L18.20 8.20L18.27 8.13C18.42 7.93 18.50 7.69 18.49 7.45C18.47 7.20 18.37 6.97 18.20 6.79C18.02 6.62 17.79 6.52 17.55 6.50C17.30 6.49 17.06 6.57 16.87 6.72ZM5.79 6.79C5.60 6.98 5.50 7.23 5.50 7.5C5.50 7.76 5.60 8.01 5.79 8.20L7.58 10L5.79 11.79L5.72 11.86C5.57 12.06 5.49 12.30 5.50 12.54C5.51 12.79 5.62 13.02 5.79 13.20C5.97 13.37 6.20 13.48 6.45 13.49C6.69 13.50 6.93 13.42 7.13 13.27L7.20 13.20L10.41 10L7.20 6.79C7.01 6.60 6.76 6.50 6.5 6.50C6.23 6.50 5.98 6.60 5.79 6.79ZM3 19V17H21V19H3Z"
                fill="white"
              ></path>
            </svg>
          )}
        </button>

        {/* Settings / quality selector */}
        <div className="relative">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="rounded-md bg-black/60 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-black/80"
            title="Quality"
          >
            <Settings className="h-4 w-4" />
          </button>

          {showSettings && levels.length > 0 && (
            <div className="absolute top-full right-0 mt-1.5 min-w-36 overflow-hidden rounded-lg border border-white/10 bg-black/90 py-1 text-sm text-white shadow-xl backdrop-blur-md">
              <button
                onClick={() => setQuality(-1)}
                className={`flex w-full items-center justify-between px-3 py-1.5 text-left transition-colors hover:bg-white/10 ${
                  activeLevel === -1 ? "text-blue-400" : ""
                }`}
              >
                Auto
                {activeLevel === -1 && (
                  <span className="text-xs">&#10003;</span>
                )}
              </button>
              {[...levels]
                .sort((a, b) => b.height - a.height)
                .map((level) => (
                  <button
                    key={level.index}
                    onClick={() => setQuality(level.index)}
                    className={`flex w-full items-center justify-between px-3 py-1.5 text-left transition-colors hover:bg-white/10 ${
                      activeLevel === level.index ? "text-blue-400" : ""
                    }`}
                  >
                    {level.height}p
                    {activeLevel === level.index && (
                      <span className="text-xs">&#10003;</span>
                    )}
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Keyboard hints (shown on focus) ────────────────────────────── */}
      <div className="absolute bottom-12 left-2 hidden text-[10px] text-white/40 group-focus:block">
        ← → seek &nbsp; ↑ ↓ volume &nbsp; M mute &nbsp; S/D speed &nbsp; T
        theater &nbsp; F fullscreen
      </div>
    </div>
  )
}

export default HlsPlayer
