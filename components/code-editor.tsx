"use client"

import { useRef, useEffect } from "react"

interface CodeEditorProps {
  code: string
  onChange: (code: string) => void
  highlightedLoop?: number
}

export function CodeEditor({ code, onChange, highlightedLoop }: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lineNumbersRef = useRef<HTMLDivElement>(null)

  const lines = code.split("\n")
  const lineCount = lines.length

  useEffect(() => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }, [code])

  const loopLineIndices: number[] = []
  let loopCounter = 0
  lines.forEach((line) => {
    if (line.trim().match(/^for\s*\(/)) {
      loopLineIndices.push(loopCounter)
      loopCounter++
    } else {
      loopLineIndices.push(-1)
    }
  })

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Minimal top bar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border/60">
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-foreground/10" />
          <div className="w-2 h-2 rounded-full bg-foreground/10" />
          <div className="w-2 h-2 rounded-full bg-foreground/10" />
        </div>
        <span className="text-[10px] font-mono text-muted-foreground/50 ml-1">algorithm.java</span>
      </div>

      <div className="flex relative">
        {/* Line numbers */}
        <div
          ref={lineNumbersRef}
          className="flex flex-col items-end py-4 px-3 select-none overflow-hidden border-r border-border/40"
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div
              key={i}
              className={`text-[11px] font-mono leading-6 h-6 tabular-nums ${
                loopLineIndices[i] === highlightedLoop && highlightedLoop !== undefined
                  ? "text-primary"
                  : "text-muted-foreground/30"
              }`}
            >
              {i + 1}
            </div>
          ))}
        </div>

        {/* Syntax display overlay */}
        <div className="absolute inset-0 ml-[2.75rem] py-4 px-4 pointer-events-none overflow-hidden">
          {lines.map((line, idx) => {
            const isLoop = loopLineIndices[idx] >= 0
            const isHighlighted = loopLineIndices[idx] === highlightedLoop && highlightedLoop !== undefined
            const isOperation =
              line.trim().includes("System.out") ||
              line.trim().includes("console.log") ||
              line.trim().includes("print(")
            const isBreak = line.trim().startsWith("break")
            const isIf = line.trim().startsWith("if")

            return (
              <div
                key={idx}
                className={`text-sm font-mono leading-6 h-6 whitespace-pre transition-colors ${
                  isHighlighted
                    ? "text-primary bg-primary/5 -mx-4 px-4"
                    : isOperation
                      ? "text-chart-2"
                      : isBreak
                        ? "text-destructive"
                        : isIf
                          ? "text-chart-4"
                          : isLoop
                            ? "text-chart-3"
                            : "text-foreground/70"
                }`}
              >
                {line.replace(/\t/g, "    ")}
              </div>
            )
          })}
        </div>

        {/* Editable textarea */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => onChange(e.target.value)}
          onScroll={() => {
            if (lineNumbersRef.current && textareaRef.current) {
              lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop
            }
          }}
          className="flex-1 py-4 px-4 bg-transparent text-transparent caret-foreground resize-none outline-none font-mono text-sm leading-6 min-h-[180px] selection:bg-primary/20"
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
        />
      </div>
    </div>
  )
}
