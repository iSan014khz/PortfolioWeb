import { spawn } from 'node:child_process'
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ffmpegPath from 'ffmpeg-static'

const CHARSETS = {
  dots: ' ·•●',
  braille: ' ⠁⠃⠇⠏⠟⠿⡿⣿',
  blocks: ' ░▒▓█',
  standard: ' .,:;i1tfLCG08@',
  binary: ' 01',
}

const getArg = (name, fallback) => {
  const index = process.argv.indexOf(`--${name}`)
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const videoPath = path.resolve(root, getArg('video', 'src/assets/hero-video.mp4'))
const outDir = path.resolve(root, getArg('out', 'src/data/ascii-video'))
const COLS = Number(getArg('cols', '180'))
const FPS = Number(getArg('fps', '24'))
const charsetArg = getArg('charset', 'dots')
const CHARSET = CHARSETS[charsetArg] ?? charsetArg
const rawPath = path.join(outDir, 'frames.rgb')

const run = (args) =>
  new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath, args, { stdio: ['ignore', 'ignore', 'pipe'] })
    const stderr = []
    child.stderr.on('data', (chunk) => stderr.push(chunk))
    child.on('error', reject)
    child.on('close', (code) => {
      resolve({ code, stderr: Buffer.concat(stderr).toString() })
    })
  })

const probe = await run(['-hide_banner', '-i', videoPath])
const sizeMatch = probe.stderr.match(/(\d{2,5})x(\d{2,5})/)
if (!sizeMatch) {
  throw new Error(`No pude leer el tamaño del video.\n${probe.stderr}`)
}

const videoWidth = Number(sizeMatch[1])
const videoHeight = Number(sizeMatch[2])
const rows = Math.max(2, Math.round(COLS * (videoHeight / videoWidth)))
const evenRows = rows % 2 === 0 ? rows : rows + 1

await mkdir(outDir, { recursive: true })

const extract = await run([
  '-y',
  '-i',
  videoPath,
  '-vf',
  `fps=${FPS},scale=${COLS}:${evenRows}:flags=area`,
  '-f',
  'rawvideo',
  '-pix_fmt',
  'rgb24',
  rawPath,
])

if (extract.code !== 0) {
  throw new Error(`ffmpeg falló al extraer frames.\n${extract.stderr}`)
}

const raw = await readFile(rawPath)
const frameBytes = COLS * evenRows * 3
const frameCount = Math.floor(raw.length / frameBytes)
const cellCount = COLS * evenRows
const baked = Buffer.alloc(frameCount * cellCount)
const colors = Buffer.alloc(frameCount * cellCount * 2)

for (let frame = 0; frame < frameCount; frame += 1) {
  const srcOffset = frame * frameBytes
  const dstOffset = frame * cellCount
  for (let i = 0; i < cellCount; i += 1) {
    const p = srcOffset + i * 3
    const r = raw[p]
    const g = raw[p + 1]
    const b = raw[p + 2]
    const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    baked[dstOffset + i] = Math.min(CHARSET.length - 1, Math.floor(brightness * (CHARSET.length - 1)))
    const packed = ((r & 0xf8) << 8) | ((g & 0xfc) << 3) | (b >> 3)
    colors.writeUInt16LE(packed, (dstOffset + i) * 2)
  }
}

await writeFile(path.join(outDir, 'frames.bin'), baked)
await writeFile(path.join(outDir, 'colors.bin'), colors)
await writeFile(
  path.join(outDir, 'meta.json'),
  `${JSON.stringify(
    {
      cols: COLS,
      rows: evenRows,
      fps: FPS,
      frameCount,
      charset: CHARSET,
      hasColors: true,
      video: path.relative(root, videoPath).replaceAll('\\', '/'),
    },
    null,
    2,
  )}\n`,
)
await unlink(rawPath)

console.log(`ASCII horneado: ${frameCount} frames, ${COLS}x${evenRows}, ${FPS} fps`)
console.log(`charset: ${CHARSET}`)
console.log(`out: ${path.relative(root, outDir)}`)
