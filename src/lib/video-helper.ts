export function getEmbedUrl(url: string): { url: string; converted: boolean } {
  if (!url) return { url: '', converted: false }
  let newUrl = url
  let converted = false

  try {
    const parsed = new URL(url)

    if (parsed.hostname.includes('youtube.com') || parsed.hostname.includes('youtu.be')) {
      if (parsed.pathname.includes('/watch')) {
        const v = parsed.searchParams.get('v')
        if (v) {
          newUrl = `https://www.youtube.com/embed/${v}`
          converted = true
        }
      } else if (parsed.pathname.startsWith('/shorts/')) {
        const id = parsed.pathname.split('/')[2]
        if (id) {
          newUrl = `https://www.youtube.com/embed/${id}`
          converted = true
        }
      } else if (parsed.hostname === 'youtu.be') {
        const id = parsed.pathname.split('/')[1]
        if (id) {
          newUrl = `https://www.youtube.com/embed/${id}`
          converted = true
        }
      }
    } else if (parsed.hostname.includes('vimeo.com') && !parsed.pathname.includes('/video/')) {
      const id = parsed.pathname.split('/').pop()
      if (id && !isNaN(Number(id))) {
        newUrl = `https://player.vimeo.com/video/${id}`
        converted = true
      }
    } else if (parsed.hostname.includes('loom.com') && parsed.pathname.includes('/share/')) {
      const id = parsed.pathname.split('/').pop()
      if (id) {
        newUrl = `https://www.loom.com/embed/${id}`
        converted = true
      }
    } else if (
      parsed.hostname.includes('cloudflarestream.com') ||
      parsed.hostname.includes('videodelivery.net')
    ) {
      if (!parsed.pathname.includes('/iframe')) {
        const id = parsed.pathname.split('/')[1]
        if (id) {
          newUrl = `https://iframe.videodelivery.net/${id}`
          converted = true
        }
      }
    }
  } catch (e) {
    // Ignore invalid URLs
  }

  return { url: newUrl, converted }
}
