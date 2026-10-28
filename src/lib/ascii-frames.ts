import framesUrl from '@/data/ascii-video/frames.binz?url'

const requests = new Map<string, Promise<ArrayBuffer>>()

// Share the request between preloading and the renderer, including React Strict Mode mounts.
export function fetchAsciiFrames(url = framesUrl): Promise<ArrayBuffer> {
  const existing = requests.get(url)
  if (existing) return existing
  const request = (async () => {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    if (typeof DecompressionStream === 'undefined' || !response.body) {
      throw new Error('DecompressionStream no disponible')
    }
    return new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer()
  })()
  requests.set(url, request)
  void request.catch(() => { requests.delete(url) })
  return request
}
