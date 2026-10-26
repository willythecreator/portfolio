'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createFileSystem, resolvePath, getPwd } from './fileSystem'
import { arcbyteArt } from '@/lib/ascii-art/text-arcbyte'

interface TerminalProps {
  onBack: () => void
}

interface TermLine {
  type: 'input' | 'output' | 'error' | 'success'
  text: string
}

export default function Terminal({ onBack }: TerminalProps) {
  const [lines, setLines] = useState<TermLine[]>([
        { type: 'success', text: 'ArcByte OS Terminal v0.97' },
        { type: 'output', text: 'Type "help" to list available commands.\n' },
      ])
  const [input, setInput] = useState('')
  const [cwd, setCwd] = useState('/')
  const [history, setHistory] = useState<string[]>([])
  const [historyIdx, setHistoryIdx] = useState(-1)
  const fs = useRef(createFileSystem())
  const outputRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Nano editor state
  const [nanoMode, setNanoMode] = useState(false)
  const [nanoFile, setNanoFile] = useState('')
  const [nanoContent, setNanoContent] = useState('')
  const [nanoOriginal, setNanoOriginal] = useState('')
  const [nanoCursorX, setNanoCursorX] = useState(0)
  const [nanoCursorY, setNanoCursorY] = useState(0)
  const [nanoStatus, setNanoStatus] = useState('')

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [lines])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const prompt = useCallback(() => {
    return `willy@arcbyte-os:${getPwd(cwd)}$ `
  }, [cwd])

  const addLines = useCallback((...newLines: TermLine[]) => {
    setLines(prev => [...prev, ...newLines])
  }, [])

  const execCommand = useCallback((raw: string) => {
    const trimmed = raw.trim()
    if (!trimmed) return

    setHistory(prev => [...prev, trimmed])
    setHistoryIdx(-1)

    addLines({ type: 'input', text: `${prompt()}${trimmed}` })

    const parts = trimmed.split(/\s+/)
    const cmd = parts[0]
    const args = parts.slice(1)

    switch (cmd) {
      case 'help': {
        addLines(
          { type: 'output', text: 'Available commands:' },
          { type: 'output', text: '  help              Show this help message' },
          { type: 'output', text: '  ls [path]         List directory contents' },
          { type: 'output', text: '  cd <path>         Change directory' },
          { type: 'output', text: '  cat <file>        Display file contents' },
          { type: 'output', text: '  nano <file>       Edit file (nano-like editor)' },
          { type: 'output', text: '  pwd               Print working directory' },
          { type: 'output', text: '  whoami            Display current user' },
          { type: 'output', text: '  uname             Display system info' },
          { type: 'output', text: '  date              Display current date' },
          { type: 'output', text: '  clear             Clear the terminal' },
          { type: 'output', text: '  history           Show command history' },
          { type: 'output', text: '  echo <text>       Print text' },
          { type: 'output', text: '  neofetch          Display system information' },
          { type: 'output', text: '  sudo <cmd>        Execute as superuser' },
          { type: 'output', text: '  exit              Return to menu' },
        )
        break
      }

      case 'ls': {
        const target = args[0] ? resolvePath(fs.current, args[0].replace(/^~\/?/, '/')) || resolvePath(fs.current, cwd + (cwd.endsWith('/') ? '' : '/') + args[0]) : resolvePath(fs.current, cwd)
        if (!target || target.type !== 'dir' || !target.children) {
          addLines({ type: 'error', text: `ls: cannot access '${args[0] || cwd}': No such file or directory` })
          break
        }
        const entries = Object.values(target.children)
        if (entries.length === 0) {
          addLines({ type: 'output', text: '(empty directory)' })
        } else {
          const formatted = entries.map(e => {
            if (e.type === 'dir') return `${e.name}/`
            return e.name
          }).join('  ')
          addLines({ type: 'output', text: formatted })
        }
        break
      }

      case 'cd': {
        if (!args[0] || args[0] === '~') {
          setCwd('/')
          break
        }
        let targetPath = args[0]
        if (targetPath.startsWith('~')) {
          targetPath = targetPath.slice(1) || '/'
        } else if (!targetPath.startsWith('/')) {
          targetPath = cwd + (cwd.endsWith('/') ? '' : '/') + targetPath
        }
        // Normalize path
        const segments = targetPath.split('/').filter(Boolean)
        const resolved: string[] = []
        for (const seg of segments) {
          if (seg === '..') {
            if (resolved.length > 0) resolved.pop()
            continue
          }
          if (seg === '.') continue
          resolved.push(seg)
        }
        const normalized = '/' + resolved.join('/')
        const node = resolvePath(fs.current, normalized)
        if (!node || node.type !== 'dir') {
          addLines({ type: 'error', text: `cd: ${args[0]}: No such file or directory` })
        } else {
          setCwd(normalized || '/')
        }
        break
      }

      case 'cat': {
        if (!args[0]) {
          addLines({ type: 'error', text: 'cat: missing file operand' })
          break
        }
        let filePath = args[0]
        if (filePath.startsWith('~')) {
          filePath = filePath.slice(1) || '/'
        } else if (!filePath.startsWith('/')) {
          filePath = cwd + (cwd.endsWith('/') ? '' : '/') + filePath
        }
        const node = resolvePath(fs.current, filePath)
        if (!node) {
          addLines({ type: 'error', text: `cat: ${args[0]}: No such file or directory` })
        } else if (node.type === 'dir') {
          addLines({ type: 'error', text: `cat: ${args[0]}: Is a directory` })
        } else {
          const content = node.content || '(empty file)'
          content.split('\n').forEach(line => {
            addLines({ type: 'output', text: line })
          })
        }
        break
      }

      case 'pwd':
        addLines({ type: 'output', text: cwd })
        break

      case 'whoami':
        addLines({ type: 'output', text: 'willy' })
        break

      case 'uname':
        addLines({ type: 'output', text: 'ArcByte OS v0.97 x86_64 Unknown' })
        break

      case 'date':
        addLines({ type: 'output', text: new Date().toString() })
        break

      case 'clear':
        setLines([])
        break

      case 'history':
        history.forEach((cmd, i) => {
          addLines({ type: 'output', text: `  ${String(i + 1).padStart(4)} ${cmd}` })
        })
        break

      case 'echo':
        addLines({ type: 'output', text: args.join(' ') })
        break

      case 'nano': {
        if (!args[0]) {
          addLines({ type: 'error', text: 'nano: missing file operand' })
          break
        }
        let filePath = args[0]
        if (filePath.startsWith('~')) {
          filePath = filePath.slice(1) || '/'
        } else if (!filePath.startsWith('/')) {
          filePath = cwd + (cwd.endsWith('/') ? '' : '/') + filePath
        }
        const node = resolvePath(fs.current, filePath)
        let content = ''
        if (node) {
          if (node.type === 'dir') {
            addLines({ type: 'error', text: `nano: ${args[0]}: Is a directory` })
            break
          }
          content = node.content || ''
        }
        // If file doesn't exist, create empty buffer
        setNanoFile(filePath)
        setNanoOriginal(content)
        setNanoContent(content)
        setNanoCursorX(0)
        setNanoCursorY(0)
        setNanoStatus(`New File    ${args[0]}`)
        setNanoMode(true)
        setLines([])
        break
      }

      case 'neofetch': {
        const nf = [
          ...arcbyteArt,
          '',
          '  OS:         ArcByte OS v0.97',
          '  Host:       Sector 7 — Grid 4491',
          '  Shell:      arcbyte-sh',
          '  User:       willy',
          '  Uptime:     [REDACTED]',
          '  Status:     OPERATIONAL',
        ]
        nf.forEach(line => addLines({ type: 'output', text: line }))
        break
      }

      case 'sudo': {
        if (args.join(' ') === 'rm -rf /') {
          addLines({ type: 'error', text: 'Nice try. ACCESS DENIED.' })
        } else if (args[0] === 'rm' && args.includes('-rf') && args.includes('/')) {
          addLines({ type: 'error', text: 'Nice try. ACCESS DENIED.' })
        } else if (args[0] === 'rm') {
          addLines({ type: 'error', text: 'Operation not permitted. Nice try.' })
        } else {
          addLines({ type: 'error', text: `sudo: ${args[0]}: command not found — or you are not authorized.` })
        }
        break
      }

      case 'rm':
      case 'rmdir':
      case 'mkdir':
      case 'touch':
      case 'mv':
      case 'cp':
        addLines({ type: 'error', text: `${cmd}: Operation not permitted. This is a read-only filesystem.` })
        break

      case 'exit':
        onBack()
        break

      default:
        addLines({ type: 'error', text: `${cmd}: command not found. Type "help" for available commands.` })
    }
  }, [addLines, prompt, cwd, history, onBack])

  const saveNanoFile = useCallback(() => {
    const filePath = nanoFile
    const parts = filePath.split('/').filter(Boolean)
    let current: any = fs.current
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current.children[parts[i]]) {
        current.children[parts[i]] = { type: 'dir', name: parts[i], children: {} }
      }
      current = current.children[parts[i]]
    }
    const fileName = parts[parts.length - 1] || 'untitled'
    if (!current.children) current.children = {}
    if (current.children[fileName]) {
      current.children[fileName].content = nanoContent
    } else {
      current.children[fileName] = { type: 'file', name: fileName, content: nanoContent }
    }
    setNanoOriginal(nanoContent)
    setNanoStatus(`[ Wrote ${nanoContent.split('\n').length} lines ]`)
    setTimeout(() => setNanoStatus(`File: ${filePath}`), 1500)
  }, [nanoFile, nanoContent])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (nanoMode) {
      e.preventDefault()
      if (e.key === 'x' && e.ctrlKey) {
        if (nanoContent !== nanoOriginal) {
          setNanoStatus('Save modified buffer?  Y Yes  N No  ^C Cancel')
          const handler = (ev: KeyboardEvent) => {
            if (ev.key.toLowerCase() === 'y') {
              saveNanoFile()
              setNanoMode(false)
              setLines([{ type: 'success', text: `Wrote ${nanoFile}` }])
              window.removeEventListener('keydown', handler)
            } else if (ev.key.toLowerCase() === 'n') {
              setNanoMode(false)
              setLines([{ type: 'output', text: `Exited without saving` }])
              window.removeEventListener('keydown', handler)
            } else if (ev.key === 'c' && ev.ctrlKey) {
              setNanoStatus(`File: ${nanoFile}`)
              window.removeEventListener('keydown', handler)
            }
          }
          window.addEventListener('keydown', handler)
          return
        }
        setNanoMode(false)
        setLines([{ type: 'output', text: `Exited` }])
        return
      }
      if (e.key === 'o' && e.ctrlKey) {
        saveNanoFile()
        return
      }
      if (e.key === 'Enter') {
        const lines = nanoContent.split('\n')
        const currentLine = lines[nanoCursorY] || ''
        const before = currentLine.slice(0, nanoCursorX)
        const after = currentLine.slice(nanoCursorX)
        lines[nanoCursorY] = before
        lines.splice(nanoCursorY + 1, 0, after)
        setNanoContent(lines.join('\n'))
        setNanoCursorY(nanoCursorY + 1)
        setNanoCursorX(0)
        return
      }
      if (e.key === 'Backspace') {
        const lines = nanoContent.split('\n')
        if (nanoCursorX === 0 && nanoCursorY > 0) {
          const prevLine = lines[nanoCursorY - 1]
          const currentLine = lines[nanoCursorY]
          lines[nanoCursorY - 1] = prevLine + currentLine
          lines.splice(nanoCursorY, 1)
          setNanoContent(lines.join('\n'))
          setNanoCursorY(nanoCursorY - 1)
          setNanoCursorX(prevLine.length)
        } else if (nanoCursorX > 0) {
          const currentLine = lines[nanoCursorY] || ''
          lines[nanoCursorY] = currentLine.slice(0, nanoCursorX - 1) + currentLine.slice(nanoCursorX)
          setNanoContent(lines.join('\n'))
          setNanoCursorX(nanoCursorX - 1)
        }
        return
      }
      if (e.key === 'ArrowUp') {
        if (nanoCursorY > 0) {
          setNanoCursorY(nanoCursorY - 1)
          const lines = nanoContent.split('\n')
          setNanoCursorX(Math.min(nanoCursorX, (lines[nanoCursorY - 1] || '').length))
        }
        return
      }
      if (e.key === 'ArrowDown') {
        const lines = nanoContent.split('\n')
        if (nanoCursorY < lines.length - 1) {
          setNanoCursorY(nanoCursorY + 1)
          setNanoCursorX(Math.min(nanoCursorX, (lines[nanoCursorY + 1] || '').length))
        }
        return
      }
      if (e.key === 'ArrowLeft') {
        if (nanoCursorX > 0) setNanoCursorX(nanoCursorX - 1)
        else if (nanoCursorY > 0) {
          setNanoCursorY(nanoCursorY - 1)
          const lines = nanoContent.split('\n')
          setNanoCursorX((lines[nanoCursorY - 1] || '').length)
        }
        return
      }
      if (e.key === 'ArrowRight') {
        const lines = nanoContent.split('\n')
        const currentLine = lines[nanoCursorY] || ''
        if (nanoCursorX < currentLine.length) setNanoCursorX(nanoCursorX + 1)
        else if (nanoCursorY < lines.length - 1) {
          setNanoCursorY(nanoCursorY + 1)
          setNanoCursorX(0)
        }
        return
      }
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey) {
        const lines = nanoContent.split('\n')
        const currentLine = lines[nanoCursorY] || ''
        lines[nanoCursorY] = currentLine.slice(0, nanoCursorX) + e.key + currentLine.slice(nanoCursorX)
        setNanoContent(lines.join('\n'))
        setNanoCursorX(nanoCursorX + 1)
        return
      }
      return
    }

    if (e.key === 'Enter') {
      execCommand(input)
      setInput('')
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (history.length > 0) {
        const newIdx = historyIdx < history.length - 1 ? historyIdx + 1 : historyIdx
        setHistoryIdx(newIdx)
        setInput(history[history.length - 1 - newIdx])
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIdx > 0) {
        const newIdx = historyIdx - 1
        setHistoryIdx(newIdx)
        setInput(history[history.length - 1 - newIdx])
      } else {
        setHistoryIdx(-1)
        setInput('')
      }
    } else if (e.key === 'Tab') {
      e.preventDefault()
      // Simple tab completion
      const parts = input.split(/\s+/)
      const last = parts[parts.length - 1]
      if (!last) return
      const node = resolvePath(fs.current, cwd)
      if (node?.type === 'dir' && node.children) {
        const match = Object.keys(node.children).find(k => k.startsWith(last))
        if (match) {
          parts[parts.length - 1] = match
          setInput(parts.join(' '))
        }
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault()
      setLines([])
    }
  }

  if (nanoMode) {
    const linesArr = nanoContent.split('\n')
    return (
      <div className="terminal" style={{ padding: 0 }}>
        <div style={{ background: '#001a08', color: '#33ff66', padding: '4px 8px', borderBottom: '1px solid #003315', fontSize: '12px' }}>
          GNU nano 2.9.3
        </div>
        <div style={{ padding: '8px', fontSize: '13px', lineHeight: '1.4', overflowY: 'auto', height: 'calc(100% - 60px)' }}>
          {linesArr.map((line, i) => (
            <div key={i} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {i === nanoCursorY ? (
                <>
                  {line.slice(0, nanoCursorX)}
                  <span style={{ background: '#33ff66', color: '#000' }}>{line[nanoCursorX] || ' '}</span>
                  {line.slice(nanoCursorX + 1)}
                </>
              ) : (
                line || ' '
              )}
            </div>
          ))}
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
          <div style={{ background: '#001a08', color: '#33ff66', padding: '2px 8px', fontSize: '11px', borderTop: '1px solid #003315' }}>
            {nanoStatus || `File: ${nanoFile}`}
          </div>
          <div style={{ background: '#001a08', color: '#1a8f3d', padding: '4px 8px', fontSize: '11px', display: 'flex', flexWrap: 'wrap', gap: '12px', borderTop: '1px solid #003315' }}>
            <span>^O Write Out</span>
            <span>^X Exit</span>
            <span>^R Read File</span>
            <span>^W Where Is</span>
          </div>
        </div>
        <input
          ref={inputRef}
          onKeyDown={handleKeyDown}
          style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
          autoFocus
        />
      </div>
    )
  }

  return (
    <div className="terminal" onClick={() => inputRef.current?.focus()}>
      <div className="terminal-output" ref={outputRef}>
        {lines.map((line, i) => (
          <div key={i} className={`terminal-line terminal-line-${line.type}`}>
            {line.text}
          </div>
        ))}
        <div className="terminal-input-row">
          <span className="terminal-line-prompt">{prompt()}</span>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            autoComplete="off"
            autoFocus
          />
        </div>
      </div>
    </div>
  )
}
