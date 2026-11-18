'use client'

import { useEffect, useRef } from 'react'

const GUARD_CLASS = 'no-text-select'
const REPEAT_TAP_MS = 400
const REPEAT_TAP_DISTANCE = 36

/** Fuerza el colapso de cualquier selección de texto del documento. */
export function clearTextSelection() {
  const selection = window.getSelection()
  if (selection && !selection.isCollapsed) selection.removeAllRanges()
}

/**
 * Instala una "guarda táctil" sobre un contenedor:
 *  - CSS (clase `no-text-select`) desactiva selección, callout y highlight.
 *  - `selectstart` / `dragstart` / `contextmenu` / `dblclick` se cancelan.
 *  - Un toque repetido (doble tap) se cancela antes de que el navegador
 *    intente hacer zoom o seleccionar texto, por muy rápido que se repita.
 * Devuelve una función para desinstalar todo.
 */
export function installTouchGuard(root: HTMLElement): () => void {
  root.classList.add(GUARD_CLASS)

  let lastTapAt = 0
  let lastX = 0
  let lastY = 0

  const prevent = (event: Event) => {
    event.preventDefault()
    clearTextSelection()
  }

  const onSelectStart = (event: Event) => prevent(event)
  const onDragStart = (event: Event) => prevent(event)
  const onContextMenu = (event: Event) => prevent(event)
  const onDblClick = (event: Event) => prevent(event)

  const onTouchStart = (event: TouchEvent) => {
    const now = Date.now()
    const touch = event.touches[0]
    const x = touch?.clientX ?? 0
    const y = touch?.clientY ?? 0
    const repeated =
      now - lastTapAt < REPEAT_TAP_MS &&
      Math.hypot(x - lastX, y - lastY) < REPEAT_TAP_DISTANCE

    lastTapAt = now
    lastX = x
    lastY = y
    clearTextSelection()

    // Solo bloqueamos el segundo (o posteriores) toques: el primero sigue
    // llegando a los controles del juego con normalidad.
    if (repeated) event.preventDefault()
  }

  const onTouchEnd = () => clearTextSelection()
  const onSelectionChange = () => clearTextSelection()

  root.addEventListener('selectstart', onSelectStart)
  root.addEventListener('dragstart', onDragStart)
  root.addEventListener('contextmenu', onContextMenu)
  root.addEventListener('dblclick', onDblClick)
  root.addEventListener('touchstart', onTouchStart, { passive: false })
  root.addEventListener('touchend', onTouchEnd)
  root.addEventListener('touchcancel', onTouchEnd)
  document.addEventListener('selectionchange', onSelectionChange)

  return () => {
    root.classList.remove(GUARD_CLASS)
    root.removeEventListener('selectstart', onSelectStart)
    root.removeEventListener('dragstart', onDragStart)
    root.removeEventListener('contextmenu', onContextMenu)
    root.removeEventListener('dblclick', onDblClick)
    root.removeEventListener('touchstart', onTouchStart)
    root.removeEventListener('touchend', onTouchEnd)
    root.removeEventListener('touchcancel', onTouchEnd)
    document.removeEventListener('selectionchange', onSelectionChange)
    clearTextSelection()
  }
}

/** Versión hook: aplica la guarda al elemento referenciado mientras `enabled`. */
export function useTouchGuard<T extends HTMLElement>(enabled = true) {
  const ref = useRef<T>(null)

  useEffect(() => {
    if (!enabled || !ref.current) return
    return installTouchGuard(ref.current)
  }, [enabled])

  return ref
}
