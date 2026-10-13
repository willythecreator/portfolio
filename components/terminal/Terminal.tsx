'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createFileSystem, resolvePath, getPwd } from './fileSystem'

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

      case 'neofetch': {
        const nf = [
          '   █████╗ ██████╗  ██████╗██████╗ ██╗   ██╗████████╗███████╗',
          '  ██╔══██╗██╔══██╗██╔════╝██╔══██╗╚██╗ ██╔╝╚══██╔══╝██╔════╝',
          '  ███████║██████╔╝██║     ██████╔╝ ╚████╔╝    ██║   █████╗',
          '  ██╔══██║██╔══██╗██║     ██╔══██╗  ╚██╔╝     ██║   ██╔══╝',
          '  ██║  ██║██║  ██║╚██████╗██████╔╝   ██║      ██║   ███████╗',
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
