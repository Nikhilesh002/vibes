import { useEffect, useRef, useState, useCallback } from "react"
import Hls from "hls.js"
import {
  Maximize,
  Minimize,
  Settings,
  Volume2,
  VolumeX,
  Gauge,
} from "lucide-react"

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

// ─── Client-aware config ─────────────────────────────────────────────────────
// Adapts buffer strategy based on device capability — low-end devices get
// smaller buffers to avoid memory pressure, high-end get bigger buffers
// for smoother playback.

function getClientConfig(): Partial<Hls["config"]> {
  const memory = (navigator as any).deviceMemory || 4
  const network = (navigator as any).connection?.effectiveType || "4g"
  const isWeak = memory <= 2 || network === "2g" || network === "slow-2g"

  console.log({ memory, network, isWeak })

  if (isWeak) {
    return {
      maxBufferLength: 10,
      maxMaxBufferLength: 20,
      maxBufferSize: 20 * 1000 * 1000,
      backBufferLength: 5,
      capLevelToPlayerSize: true,
    }
  }

  return {
    maxBufferLength: 30,
    maxMaxBufferLength: 60, 
    maxBufferSize: 60 * 1000 * 1000,
    backBufferLength: 15,
    capLevelToPlayerSize: true,
  }
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
  const [isMuted, setIsMuted] = useState(false)
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
        ...getClientConfig(),

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
            setIsMuted(false)
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
          setIsMuted(video.muted)
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
        {/* Mute indicator */}
        <button
          onClick={() => {
            const video = videoRef.current
            if (!video) return
            video.muted = !video.muted
            setIsMuted(video.muted)
          }}
          className="rounded-md bg-black/60 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-black/80"
          title={isMuted ? "Unmute (M)" : "Mute (M)"}
        >
          {isMuted ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </button>

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
            <Minimize className="h-4 w-4" />
          ) : (
            <Maximize className="h-4 w-4" />
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
