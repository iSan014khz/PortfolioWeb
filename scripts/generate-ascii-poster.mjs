import { readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import { spawnSync } from 'node:child_process'
import ffmpeg from 'ffmpeg-static'

// Render the actual first baked frame with the dot shader's radii and edge smoothing.
const meta = JSON.parse(readFileSync(new URL('../src/data/ascii-video/meta.json', import.meta.url)))
const frames = gunzipSync(readFileSync(new URL('../src/data/ascii-video/frames.binz', import.meta.url)))
const cell = 4, width = meta.cols * cell, height = meta.rows * cell
const pixels = Buffer.alloc(width * height * 3)
const radii = [0, Math.max(1.1, cell * .14), Math.max(1.8, cell * .275), Math.max(2.6, cell * .45)]
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const glyph = frames[Math.floor(y / cell) * meta.cols + Math.floor(x / cell)]
    const distance = Math.hypot((x % cell) + .5 - cell / 2, (y % cell) + .5 - cell / 2)
    const t = Math.max(0, Math.min(1, (distance - radii[glyph] + .5)))
    const alpha = glyph ? 1 - t * t * (3 - 2 * t) : 0
    const value = Math.round(13 + (140 - 13) * alpha)
    pixels.fill(value, (y * width + x) * 3, (y * width + x) * 3 + 3)
  }
}
const result = spawnSync(ffmpeg, ['-y', '-f', 'image2pipe', '-vcodec', 'ppm', '-i', 'pipe:0', '-frames:v', '1', '-c:v', 'libwebp', '-quality', '85', 'public/hero-ascii-poster.webp'], {
  input: Buffer.concat([Buffer.from(`P6\n${width} ${height}\n255\n`), pixels]),
  maxBuffer: 4 * 1024 * 1024,
})
if (result.status !== 0) throw new Error(result.stderr.toString())
console.log(`Generated ${width}×${height} poster from frame 0`)
