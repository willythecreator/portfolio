import figlet from 'figlet'
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

const args = process.argv.slice(2)
const mode = args[0]

if (!mode || !['text', 'image', 'video'].includes(mode)) {
  console.error('Usage:')
  console.error('  node scripts/ascii-gen.mjs text  <word> <font> [output-name]')
  console.error('  node scripts/ascii-gen.mjs image <path> [cols] [rows] [invert] [output-name]')
  console.error('  node scripts/ascii-gen.mjs video <path> [cols] [rows] [fps] [output-name]')
  console.error()
  console.error('Text mode:')
  console.error('  Converts text to ASCII art using figlet.')
  console.error('  Example: node scripts/ascii-gen.mjs text ARCBYTE ANSI Shadow arcbyte')
  console.error()
  console.error('Image mode:')
  console.error('  Converts an image to ASCII art using sharp.')
  console.error('  Example: node scripts/ascii-gen.mjs image source-images/skull.jpg 60 34 invert skull')
  console.error()
  console.error('Video mode:')
  console.error('  Extracts frames from a video and converts to ASCII art.')
  console.error('  Example: node scripts/ascii-gen.mjs video source-images/clip.mp4 80 44 10 clip')
  console.error()
  console.error('Available figlet fonts: run with --fonts to list')
  process.exit(1)
}

if (args.includes('--fonts')) {
  console.log(figlet.fontsSync().join('\n'))
  process.exit(0)
}

const OUT_DIR = path.resolve('lib/ascii-art')
fs.mkdirSync(OUT_DIR, { recursive: true })

// ── Text mode ────────────────────────────────────────────────────────────────
async function textMode() {
  const [, word, font = 'Doom', outName = word.toLowerCase()] = args
  if (!word) { console.error('Error: provide text to convert'); process.exit(1) }

  const available = figlet.fontsSync()
  if (!available.includes(font)) {
    console.error(`Error: font "${font}" not found. Use --fonts to list available fonts.`)
    process.exit(1)
  }

  const raw = figlet.textSync(word, { font })
  const lines = raw.split('\n').map(l => rtrim(l))
  while (lines.length && lines[lines.length - 1] === '') lines.pop()

  writeOutput(lines, outName, `text "${word}" (font: ${font})`, 'text-')
}

function rtrim(s) {
  let end = s.length
  while (end > 0 && s[end - 1] === ' ') end--
  return s.slice(0, end)
}

// ── Image mode ───────────────────────────────────────────────────────────────
async function imageMode() {
  const [, inputPath, colsArg = '60', rowsArg = '34', invertArg, outNameArg] = args
  if (!inputPath) { console.error('Error: provide an image path'); process.exit(1) }

  const COLS = parseInt(colsArg, 10)
  const ROWS = parseInt(rowsArg, 10)
  const INVERT = invertArg === 'invert'
  const outName = outNameArg || path.basename(inputPath, path.extname(inputPath))
  const RAMP = ' .,:;i1tfLCG08@'

  const { data, info } = await sharp(inputPath)
    .flatten({ background: '#000' })
    .resize(COLS, ROWS, { fit: 'fill' })
    .grayscale()
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const lines = []
  for (let y = 0; y < ROWS; y++) {
    let line = ''
    for (let x = 0; x < COLS; x++) {
      const idx = (y * info.width + x) * info.channels
      let v = data[idx] / 255
      if (INVERT) v = 1 - v
      const charIndex = Math.round(v * (RAMP.length - 1))
      line += RAMP[charIndex]
    }
    lines.push(line)
  }

  writeOutput(lines, outName, `image ${path.basename(inputPath)} (${COLS}x${ROWS}${INVERT ? ', inverted' : ''})`)
}

// ── Video mode ───────────────────────────────────────────────────────────────
async function videoMode() {
  const [, inputPath, colsArg = '80', rowsArg = '44', fpsArg = '10', outNameArg] = args
  if (!inputPath) { console.error('Error: provide a video path'); process.exit(1) }

  const COLS = parseInt(colsArg, 10)
  const ROWS = parseInt(rowsArg, 10)
  const FPS = parseInt(fpsArg, 10)
  const outName = outNameArg || path.basename(inputPath, path.extname(inputPath))
  const RAMP = ' .,:;i1tfLCG08@'

  const tmpDir = path.resolve('scripts/.tmp-frames')
  fs.mkdirSync(tmpDir, { recursive: true })

  try {
    const { execSync } = await import('child_process')
    execSync(
      `ffmpeg -i "${inputPath}" -vf fps=${FPS} -vf "scale=${COLS}:${ROWS}" "${tmpDir}/frame-%04d.png" -y`,
      { stdio: 'inherit' }
    )

    const frameFiles = fs.readdirSync(tmpDir).filter(f => f.endsWith('.png')).sort()
    const allFrames = []

    for (const file of frameFiles) {
      const { data, info } = await sharp(path.join(tmpDir, file))
        .grayscale()
        .raw()
        .toBuffer({ resolveWithObject: true })

      const lines = []
      for (let y = 0; y < info.height; y++) {
        let line = ''
        for (let x = 0; x < info.width; x++) {
          const idx = y * info.width + x
          const v = data[idx] / 255
          const charIndex = Math.round(v * (RAMP.length - 1))
          line += RAMP[charIndex]
        }
        lines.push(line)
      }
      allFrames.push(lines)
    }

    writeOutput(allFrames, outName, `video ${path.basename(inputPath)} (${frameFiles.length} frames @ ${FPS}fps)`)
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }
}

// ── Shared output ────────────────────────────────────────────────────────────
function writeOutput(data, name, sourceDesc, filePrefix = '') {
  const outPath = path.join(OUT_DIR, `${filePrefix}${name}.ts`)
  const varName = `${name.replace(/-([a-z])/g, (_, c) => c.toUpperCase())}Art`
  const isArray = Array.isArray(data[0])

  const fileContent =
    `// Auto-generated from ${sourceDesc} — regenerate, don't hand-edit.\n` +
    `// node scripts/ascii-gen.mjs ${args.join(' ')}\n\n` +
    `export const ${varName}: ${isArray ? 'string[][]' : 'string[]'} = ${JSON.stringify(data, null, 2)}\n`

  fs.writeFileSync(outPath, fileContent)

  if (isArray) {
    console.log(`Wrote ${data.length} frames (${data[0].length}x${data[0][0].length}) to ${outPath}`)
  } else {
    console.log(`Wrote ${data.length}x${(data[0] || '').length} ASCII art to ${outPath}`)
  }
}

// ── Run ──────────────────────────────────────────────────────────────────────
const modes = { text: textMode, image: imageMode, video: videoMode }
await modes[mode]()
