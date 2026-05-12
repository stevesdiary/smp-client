export type VideoProvider = 'youtube' | 'vimeo' | 'mp4' | 'unknown'

export type DetectedVideoSource = {
  provider: VideoProvider
  embedUrl?: string
  directUrl?: string
}

export function detectVideoSource(url: string): DetectedVideoSource {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '')
    const pathname = parsed.pathname.toLowerCase()

    if (host === 'youtu.be') {
      const videoId = parsed.pathname.split('/').filter(Boolean)[0]
      return videoId
        ? { provider: 'youtube', embedUrl: `https://www.youtube.com/embed/${videoId}?enablejsapi=1` }
        : { provider: 'unknown' }
    }

    if (host.endsWith('youtube.com')) {
      const videoId = parsed.searchParams.get('v')
      return videoId
        ? { provider: 'youtube', embedUrl: `https://www.youtube.com/embed/${videoId}?enablejsapi=1` }
        : { provider: 'unknown' }
    }

    if (host === 'vimeo.com' || host.endsWith('.vimeo.com')) {
      const match = parsed.pathname.match(/\/(\d+)(?:$|\/)/)
      return match
        ? { provider: 'vimeo', embedUrl: `https://player.vimeo.com/video/${match[1]}` }
        : { provider: 'unknown' }
    }

    if (pathname.endsWith('.mp4')) {
      return {
        provider: 'mp4',
        directUrl: parsed.toString(),
      }
    }
  } catch {
    return { provider: 'unknown' }
  }

  return { provider: 'unknown' }
}
