import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

const [, , inputPath, outName, colsArg, rowsArg, invertArg] = process.argv

if (!inputPath || !outName) {
  console.error('Usage: node scripts/img-to-ascii.mjs <image-path> <output-name> [cols] [rows] [invert]')
  console.error('Example: node scripts/img-to-ascii.mjs source-images/skull.jpg skull 60 34')
  process.exit(1)
}

const COLS = parseInt(colsArg || '60', 10)
const ROWS = parseInt(rowsArg || '34', 10)
const INVERT = invertArg === 'invert'

// dark -> light. Bright pixels get denser characters (assumes bright subject on dark bg).
const RAMP = ' .:-=+*#%@'

async function run() {
  const { data, info } = await sharp(inputPath)
    .resize(COLS, ROWS, { fit: 'fill' })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const rows = []
  for (let y = 0; y < ROWS; y++) {
    let line = ''
    for (let x = 0; x < COLS; x++) {
      const idx = y * info.width + x
      let v = data[idx] / 255
      if (INVERT) v = 1 - v
      const charIndex = Math.round(v * (RAMP.length - 1))
      line += RAMP[charIndex]
    }
    rows.push(line)
  }

  const outDir = path.resolve('lib/ascii-art')
  fs.mkdirSync(outDir, { recursive: true })
  const outPath = path.join(outDir, `${outName}.ts`)
  const varName = `${outName}Art`

  const fileContent =
    `// Auto-generated from ${path.basename(inputPath)} — regenerate, don't hand-edit.\n` +
    `// node scripts/img-to-ascii.mjs ${inputPath} ${outName} ${COLS} ${ROWS}${INVERT ? ' invert' : ''}\n\n` +
    `export const ${varName}: string[] = ${JSON.stringify(rows, null, 2)}\n`

  fs.writeFileSync(outPath, fileContent)
  console.log(`Wrote ${rows.length}x${COLS} ASCII art to ${outPath}`)
}

run()