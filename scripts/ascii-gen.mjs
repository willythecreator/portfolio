import figlet from 'figlet'
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

const args = process.argv.slice(2)
const mode = args[0]

if (!mode || !['text', 'image', 'shade', 'video'].includes(mode)) {
  console.error('Usage:')
  console.error('  node scripts/ascii-gen.mjs text  <word> <font> [output-name]')
  console.error('  node scripts/ascii-gen.mjs image <path> [cols] [rows] [invert] [output-name]')
  console.error('  node scripts/ascii-gen.mjs shade <path> [cols] [rows] [output-name]')
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
  console.error('Shade mode:')
  console.error('  Converts a (light-background) image to a solid ASCII-only glyph ramp " .#@".')
  console.error('  Use for crisp icons that must align in strict monospace fonts.')
  console.error('  Example: node scripts/ascii-gen.mjs shade source-images/lock-icon.png 32 21 lock')
  console.error()
  console.error('Video mode:')
  console.error('  Extracts frames from a video and converts to ASCII art.')
  console.error('  Animated GIF/WebP inputs keep every frame (passthrough); videos sample at <fps>.')
  console.error('  Add the "invert" flag to flip luminance (bright <-> dark).')
  console.error('  Tune with gain=<n> (contrast multiplier) and offset=<n> (0-255 brightness lift).')
  console.error('  Example: node scripts/ascii-gen.mjs video source-images/clip.mp4 80 44 10 clip')
  console.error('  Example: node scripts/ascii-gen.mjs video source-images/board.gif 78 35 5 board invert')
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

// ── Shade mode ───────────────────────────────────────────────────────────────
async function shadeMode() {
  const [, inputPath, colsArg = '32', rowsArg = '21', outNameArg] = args
  if (!inputPath) { console.error('Error: provide an image path'); process.exit(1) }

  const COLS = parseInt(colsArg, 10)
  const ROWS = parseInt(rowsArg, 10)
  const outName = outNameArg || path.basename(inputPath, path.extname(inputPath))
  const RAMP = ' .#@'

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
      const v = data[idx] / 255
      line += RAMP[Math.round((1 - v) * (RAMP.length - 1))]
    }
    lines.push(line)
  }

  writeOutput(lines, outName, `image ${path.basename(inputPath)} (${COLS}x${ROWS}, shaded)`)
}

// ── Video mode ───────────────────────────────────────────────────────────────
async function videoMode() {
  const [, inputPath, colsArg = '80', rowsArg = '44', fpsArg = '10', outNameArg] = args
  if (!inputPath) { console.error('Error: provide a video path'); process.exit(1) }

  const COLS = parseInt(colsArg, 10)
  const ROWS = parseInt(rowsArg, 10)
  const FPS = parseInt(fpsArg, 10)
  const INVERT = args.includes('invert')
  const gainArg = args.find(a => a.startsWith('gain='))
  const offsetArg = args.find(a => a.startsWith('offset='))
  const GAIN = gainArg ? parseFloat(gainArg.split('=')[1]) : 1
  const OFFSET = offsetArg ? parseFloat(offsetArg.split('=')[1]) : 0
  const outName = outNameArg || path.basename(inputPath, path.extname(inputPath))
  const RAMP = ' .,:;i1tfLCG08@'

  const tmpDir = path.resolve('scripts/.tmp-frames')
  fs.mkdirSync(tmpDir, { recursive: true })

  const isAnimatedImage = /\.(gif|webp)$/i.test(inputPath)
  const vf = isAnimatedImage ? `scale=${COLS}:${ROWS}` : `fps=${FPS},scale=${COLS}:${ROWS}`
  const fpsMode = isAnimatedImage ? '-fps_mode passthrough ' : ''

  try {
    const { execSync } = await import('child_process')
    execSync(
      `ffmpeg -i "${inputPath}" ${fpsMode}-vf "${vf}" "${tmpDir}/frame-%04d.png" -y`,
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
          let v = data[idx] / 255
          if (INVERT) v = 1 - v
          v = v * GAIN + OFFSET / 255
          if (v < 0) v = 0
          if (v > 1) v = 1
          const charIndex = Math.round(v * (RAMP.length - 1))
          line += RAMP[charIndex]
        }
        lines.push(line)
      }
      allFrames.push(lines)
    }

    let frameDelays = null
    if (isAnimatedImage) {
      const meta = await sharp(inputPath, { animated: true }).metadata()
      frameDelays = meta.delay || null
    }

    writeOutput(
      allFrames,
      outName,
      `video ${path.basename(inputPath)} (${frameFiles.length} frames${isAnimatedImage ? '' : ` @ ${FPS}fps`}${INVERT ? ', inverted' : ''})`,
      '',
      frameDelays
    )
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }
}

// ── Shared output ────────────────────────────────────────────────────────────
function writeOutput(data, name, sourceDesc, filePrefix = '', frameDelays = null) {
  const outPath = path.join(OUT_DIR, `${filePrefix}${name}.ts`)
  const varBase = `${name.replace(/-([a-z])/g, (_, c) => c.toUpperCase())}`
  const varName = `${varBase}Art`
  const isArray = Array.isArray(data[0])

  const fileContent =
    `// Auto-generated from ${sourceDesc} — regenerate, don't hand-edit.\n` +
    `// node scripts/ascii-gen.mjs ${args.join(' ')}\n\n` +
    `export const ${varName}: ${isArray ? 'string[][]' : 'string[]'} = ${JSON.stringify(data, null, 2)}\n` +
    (frameDelays && frameDelays.length ? `\nexport const ${varBase}Delays: number[] = ${JSON.stringify(frameDelays)}\n` : '')

  fs.writeFileSync(outPath, fileContent)

  if (isArray) {
    console.log(`Wrote ${data.length} frames (${data[0].length}x${data[0][0].length}) to ${outPath}`)
  } else {
    console.log(`Wrote ${data.length}x${(data[0] || '').length} ASCII art to ${outPath}`)
  }
}

// ── Run ──────────────────────────────────────────────────────────────────────
const modes = { text: textMode, image: imageMode, shade: shadeMode, video: videoMode }
await modes[mode]()
