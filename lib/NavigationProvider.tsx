'use client'

import { createContext, useCallback, useContext, useState } from 'react'

interface NavContextValue {
  focused: number
  setFocused: (i: number) => void
  move: (dx: number, dy: number, cols: number, total: number) => void
  select: () => void
  selectHandler: (() => void) | null
  setSelectHandler: (fn: (() => void) | null) => void
}

const NavContext = createContext<NavContextValue>({
  focused: 0,
  setFocused: () => {},
  move: () => {},
  select: () => {},
  selectHandler: null,
  setSelectHandler: () => {},
})

export function useNav() {
  return useContext(NavContext)
}

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [focused, setFocused] = useState(0)
  const [selectHandler, setSelectHandler] = useState<(() => void) | null>(null)

  const move = useCallback((dx: number, dy: number, cols: number, total: number) => {
    setFocused(prev => {
      const col = prev % cols
      const row = Math.floor(prev / cols)
      let newCol = col + dx
      let newRow = row + dy
      if (newCol < 0) newCol = cols - 1
      if (newCol >= cols) newCol = 0
      if (newRow < 0) newRow = 0
      const maxRow = Math.floor((total - 1) / cols)
      if (newRow > maxRow) newRow = maxRow
      const idx = newRow * cols + newCol
      return Math.min(idx, total - 1)
    })
  }, [])

  const select = useCallback(() => {
    selectHandler?.()
  }, [selectHandler])

  return (
    <NavContext.Provider value={{ focused, setFocused, move, select, selectHandler, setSelectHandler }}>
      {children}
    </NavContext.Provider>
  )
}
