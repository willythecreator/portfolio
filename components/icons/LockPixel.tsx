interface LockPixelProps {
  className?: string
  title?: string
}

const PALETTE: Record<string, string> = {
  O: '#5c3606',
  D: '#c47a1a',
  M: '#ffb347',
  L: '#ffe3ab',
  K: '#241700',
}

const GRID = [
  '....MMMM....',
  '...LM..MD...',
  '..LM....MD..',
  '..LM....MD..',
  '..LM....MD..',
  '..LM....MD..',
  'OOOOOOOOOOOO',
  'OLMMMMMMMMDO',
  'OLMMKKKKMMDO',
  'OLMKKKKKKMDO',
  'OLMMKKKKMMDO',
  'OLMMMKKMMMDO',
  'OLMMMKKMMMDO',
  'OOOOOOOOOOOO',
]

export default function LockPixel({ className, title }: LockPixelProps) {
  const cols = GRID[0].length
  const rows = GRID.length

  return (
    <svg
      className={className}
      viewBox={`0 0 ${cols} ${rows}`}
      shapeRendering="crispEdges"
      role={title ? 'img' : 'presentation'}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title ? <title>{title}</title> : null}
      {GRID.flatMap((row, y) =>
        [...row].map((char, x) =>
          char === '.' ? null : (
            <rect
              key={`${x}-${y}`}
              x={x}
              y={y}
              width={1}
              height={1}
              fill={PALETTE[char]}
            />
          )
        )
      )}
    </svg>
  )
}
