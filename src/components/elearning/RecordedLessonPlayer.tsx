import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import type { Lesson } from '@/types'
import { detectVideoSource } from '@/lib/video'

type VimeoPlayer = {
  destroy?: () => Promise<void>
  on: (event: string, callback: (payload?: any) => void) => void
  off?: (event: string, callback?: (payload?: any) => void) => void
  setCurrentTime?: (seconds: number) => Promise<void>
}

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void
    YT?: {
      Player: new (
        element: HTMLElement,
        config: {
          videoId: string
          playerVars?: Record<string, unknown>
          events?: {
            onReady?: (event: { target: { seekTo: (seconds: number, allowSeekAhead: boolean) => void } }) => void
            onStateChange?: (event: { data: number }) => void
          }
        }
      ) => {
        destroy: () => void
        getCurrentTime: () => number
      }
      PlayerState?: {
        PLAYING: number
        PAUSED: number
        ENDED: number
      }
    }
    Vimeo?: {
      Player: new (
        element: HTMLElement,
        config: { url: string; responsive?: boolean }
      ) => VimeoPlayer
    }
  }
}

let youtubeScriptPromise: Promise<void> | null = null
let vimeoScriptPromise: Promise<void> | null = null

function loadYouTubeApi() {
  if (window.YT?.Player) {
    return Promise.resolve()
  }

  if (youtubeScriptPromise) {
    return youtubeScriptPromise
  }

  youtubeScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-youtube-api="true"]')
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Failed to load YouTube API')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://www.youtube.com/iframe_api'
    script.async = true
    script.dataset.youtubeApi = 'true'
    script.onerror = () => reject(new Error('Failed to load YouTube API'))
    window.onYouTubeIframeAPIReady = () => resolve()
    document.head.appendChild(script)
  })

  return youtubeScriptPromise
}

function loadVimeoApi() {
  if (window.Vimeo?.Player) {
    return Promise.resolve()
  }

  if (vimeoScriptPromise) {
    return vimeoScriptPromise
  }

  vimeoScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-vimeo-api="true"]')
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Failed to load Vimeo API')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://player.vimeo.com/api/player.js'
    script.async = true
    script.dataset.vimeoApi = 'true'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Vimeo API'))
    document.head.appendChild(script)
  })

  return vimeoScriptPromise
}

function extractYouTubeId(embedUrl?: string) {
  if (!embedUrl) return null

  try {
    const parsed = new URL(embedUrl)
    return parsed.pathname.split('/').filter(Boolean).pop() ?? null
  } catch {
    return null
  }
}

export function RecordedLessonPlayer({
  lesson,
  onSync,
}: {
  lesson: Lesson
  onSync: (watchedSeconds: number) => Promise<void>
}) {
  const source = useMemo(() => detectVideoSource(lesson.videoUrl || ''), [lesson.videoUrl])
  const youtubeContainerRef = useRef<HTMLDivElement | null>(null)
  const vimeoContainerRef = useRef<HTMLDivElement | null>(null)
  const htmlVideoRef = useRef<HTMLVideoElement | null>(null)
  const youtubePlayerRef = useRef<{ destroy: () => void; getCurrentTime: () => number } | null>(null)
  const vimeoPlayerRef = useRef<VimeoPlayer | null>(null)
  const previousLessonIdRef = useRef(lesson.id)
  const watchedSecondsRef = useRef((lesson.progress?.timeSpent ?? 0) * 60)
  const lastSyncedRef = useRef((lesson.progress?.timeSpent ?? 0) * 60)
  const syncCallbackRef = useRef(onSync)
  const [isPlaying, setIsPlaying] = useState(false)
  const [providerError, setProviderError] = useState<string | null>(null)

  useEffect(() => {
    syncCallbackRef.current = onSync
  }, [onSync])

  useEffect(() => {
    const initialSeconds = (lesson.progress?.timeSpent ?? 0) * 60
    watchedSecondsRef.current = initialSeconds
    lastSyncedRef.current = initialSeconds
    setIsPlaying(false)
    setProviderError(null)
  }, [lesson.id, lesson.progress?.timeSpent])

  const syncProgress = useCallback(async () => {
    const watchedSeconds = Math.max(lastSyncedRef.current, Math.floor(watchedSecondsRef.current))
    if (watchedSeconds <= lastSyncedRef.current) {
      return
    }

    lastSyncedRef.current = watchedSeconds
    await syncCallbackRef.current(watchedSeconds)
  }, [])

  useEffect(() => {
    if (previousLessonIdRef.current !== lesson.id) {
      void syncProgress()
      previousLessonIdRef.current = lesson.id
    }
  }, [lesson.id, syncProgress])

  useEffect(() => {
    if (!isPlaying) {
      return
    }

    const timer = window.setInterval(() => {
      void syncProgress()
    }, 15000)

    return () => {
      window.clearInterval(timer)
    }
  }, [isPlaying, syncProgress])

  useEffect(() => {
    return () => {
      void syncProgress()
    }
  }, [syncProgress])

  useEffect(() => {
    if (source.provider !== 'youtube' || !youtubeContainerRef.current) {
      return
    }

    let cancelled = false
    let timer: number | undefined

    void loadYouTubeApi()
      .then(() => {
        if (cancelled || !youtubeContainerRef.current || !window.YT?.Player) {
          return
        }

        const videoId = extractYouTubeId(source.embedUrl)
        if (!videoId) {
          setProviderError('Could not load this YouTube video.')
          return
        }

        youtubePlayerRef.current = new window.YT.Player(youtubeContainerRef.current, {
          videoId,
          playerVars: {
            rel: 0,
          },
          events: {
            onReady: (event) => {
              if (watchedSecondsRef.current > 0) {
                event.target.seekTo(watchedSecondsRef.current, true)
              }
            },
            onStateChange: (event) => {
              const playerState = window.YT?.PlayerState
              const isNowPlaying = event.data === playerState?.PLAYING
              setIsPlaying(isNowPlaying)

              if (isNowPlaying) {
                timer = window.setInterval(() => {
                  const seconds = youtubePlayerRef.current?.getCurrentTime() ?? 0
                  watchedSecondsRef.current = Math.max(watchedSecondsRef.current, seconds)
                }, 1000)
              } else {
                if (timer) {
                  window.clearInterval(timer)
                }
                void syncProgress()
              }
            },
          },
        })
      })
      .catch(() => setProviderError('Could not load the YouTube player.'))

    return () => {
      cancelled = true
      if (timer) {
        window.clearInterval(timer)
      }
      youtubePlayerRef.current?.destroy()
      youtubePlayerRef.current = null
    }
  }, [lesson.id, source.embedUrl, source.provider, syncProgress])

  useEffect(() => {
    if (source.provider !== 'vimeo' || !vimeoContainerRef.current) {
      return
    }

    let cancelled = false
    let player: VimeoPlayer | null = null

    void loadVimeoApi()
      .then(() => {
        if (cancelled || !vimeoContainerRef.current || !window.Vimeo?.Player || !lesson.videoUrl) {
          return
        }

        player = new window.Vimeo.Player(vimeoContainerRef.current, {
          url: lesson.videoUrl,
          responsive: true,
        })
        vimeoPlayerRef.current = player

        player.on('loaded', () => {
          if (watchedSecondsRef.current > 0) {
            void player?.setCurrentTime?.(watchedSecondsRef.current)
          }
        })
        player.on('play', () => setIsPlaying(true))
        player.on('pause', () => {
          setIsPlaying(false)
          void syncProgress()
        })
        player.on('ended', () => {
          setIsPlaying(false)
          void syncProgress()
        })
        player.on('timeupdate', (payload?: { seconds?: number }) => {
          watchedSecondsRef.current = Math.max(watchedSecondsRef.current, payload?.seconds ?? 0)
        })
      })
      .catch(() => setProviderError('Could not load the Vimeo player.'))

    return () => {
      cancelled = true
      void player?.destroy?.()
      vimeoPlayerRef.current = null
    }
  }, [lesson.id, lesson.videoUrl, source.provider, syncProgress])

  if (source.provider === 'unknown') {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-[28px] border border-amber-200 bg-amber-50 p-8 text-center">
        <div className="space-y-3">
          <AlertTriangle className="mx-auto h-8 w-8 text-amber-600" />
          <p className="text-sm font-medium text-amber-900">Unsupported video source</p>
          <p className="text-sm text-amber-700">Use a YouTube, Vimeo, or direct MP4 URL for recorded lessons.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-[28px] border border-border/70 bg-black">
      {providerError ? (
        <div className="flex min-h-[320px] items-center justify-center p-8 text-center text-white">
          <div className="space-y-3">
            <AlertTriangle className="mx-auto h-8 w-8 text-amber-400" />
            <p className="text-sm font-medium">{providerError}</p>
          </div>
        </div>
      ) : null}

      {!providerError && source.provider === 'mp4' ? (
        <video
          ref={htmlVideoRef}
          className="aspect-video h-full w-full"
          controls
          src={source.directUrl}
          onLoadedMetadata={(event) => {
            if (watchedSecondsRef.current > 0) {
              event.currentTarget.currentTime = watchedSecondsRef.current
            }
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => {
            setIsPlaying(false)
            void syncProgress()
          }}
          onEnded={() => {
            setIsPlaying(false)
            void syncProgress()
          }}
          onTimeUpdate={(event) => {
            watchedSecondsRef.current = Math.max(
              watchedSecondsRef.current,
              event.currentTarget.currentTime,
            )
          }}
        />
      ) : null}

      {!providerError && source.provider === 'youtube' ? (
        <div ref={youtubeContainerRef} className="aspect-video w-full" />
      ) : null}

      {!providerError && source.provider === 'vimeo' ? (
        <div ref={vimeoContainerRef} className="aspect-video w-full" />
      ) : null}
    </div>
  )
}
