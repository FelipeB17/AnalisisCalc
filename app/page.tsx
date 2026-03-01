"use client"

import { useState, useMemo, useCallback } from "react"
import { ArrowRight, RotateCcw, ChevronDown, ChevronUp, Sparkles } from "lucide-react"
import { analyzeAlgorithm } from "@/lib/algorithm-analyzer"
import { AnalysisView } from "@/components/analysis-view"
import { ExampleExercises } from "@/components/example-exercises"

const PLACEHOLDER = `// Pega tu codigo aqui, por ejemplo:
for (int i = 0; i < n; i++) {
    for (int j = 0; j < n; j++) {
        System.out.println(i * j);
    }
}`

export default function AlgorithmAnalyzer() {
  const [code, setCode] = useState("")
  const [inputCode, setInputCode] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const [showExamples, setShowExamples] = useState(false)

  const analysis = useMemo(() => {
    if (!code.trim()) return null
    try {
      return analyzeAlgorithm(code)
    } catch {
      return null
    }
  }, [code])

  const handleAnalyze = useCallback(() => {
    if (inputCode.trim()) {
      setCode(inputCode.trim())
    }
  }, [inputCode])

  const handleSelectExample = useCallback((exCode: string) => {
    setInputCode(exCode)
    setCode(exCode)
    setShowExamples(false)
  }, [])

  const handleReset = useCallback(() => {
    setCode("")
    setInputCode("")
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleAnalyze()
    }
  }

  const hasInput = inputCode.trim().length > 0

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Minimal header */}
      <header className="border-b border-border/50">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="text-sm font-semibold text-foreground tracking-tight">
              Analizador de Algoritmos
            </span>
          </div>
          {code && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Nuevo
            </button>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col">
        {!code ? (
          /* ======================== */
          /*    LANDING / INPUT       */
          /* ======================== */
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
            <div className="w-full max-w-2xl">
              {/* Title */}
              <div className="text-center mb-10">
                <h1 className="text-3xl font-bold text-foreground tracking-tight text-balance mb-3">
                  Analiza la eficiencia de tu algoritmo
                </h1>
                <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed text-pretty">
                  Pega tu codigo con ciclos for y obtendras f(n), Big-O y una explicacion paso a paso.
                </p>
              </div>

              {/* Input area */}
              <div
                className={`rounded-xl border bg-card transition-all ${
                  isFocused
                    ? "border-primary/50 ring-1 ring-primary/20"
                    : "border-border"
                }`}
              >
                {/* Editor top bar */}
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/60">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-foreground/10" />
                    <div className="w-2.5 h-2.5 rounded-full bg-foreground/10" />
                    <div className="w-2.5 h-2.5 rounded-full bg-foreground/10" />
                  </div>
                  <span className="text-[11px] font-mono text-muted-foreground/60 ml-1">
                    tu-algoritmo.java
                  </span>
                </div>

                <textarea
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onKeyDown={handleKeyDown}
                  placeholder={PLACEHOLDER}
                  className="w-full bg-transparent text-foreground font-mono text-sm leading-7 p-5 resize-none outline-none placeholder:text-muted-foreground/30 min-h-[200px]"
                  spellCheck={false}
                  autoCorrect="off"
                  autoCapitalize="off"
                />

                {/* Bottom bar */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-border/40">
                  <span className="text-[11px] text-muted-foreground/50">
                    {hasInput ? `${inputCode.split("\n").length} lineas` : "Ctrl+Enter para analizar"}
                  </span>
                  <button
                    onClick={handleAnalyze}
                    disabled={!hasInput}
                    className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                      hasInput
                        ? "bg-primary text-primary-foreground hover:brightness-110 active:scale-[0.97]"
                        : "bg-muted text-muted-foreground cursor-not-allowed"
                    }`}
                  >
                    Analizar
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Examples toggle */}
              <div className="mt-8">
                <button
                  onClick={() => setShowExamples(!showExamples)}
                  className="w-full flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
                >
                  <span>Probar con un ejemplo</span>
                  {showExamples ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>

                {showExamples && (
                  <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <ExampleExercises onSelect={handleSelectExample} />
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ======================== */
          /*    ANALYSIS RESULTS      */
          /* ======================== */
          <div className="flex-1">
            {analysis ? (
              <AnalysisView
                code={code}
                analysis={analysis}
                onChangeCode={(newCode) => {
                  setCode(newCode)
                  setInputCode(newCode)
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center px-6">
                <p className="text-sm text-foreground mb-2">No se pudo analizar el codigo</p>
                <p className="text-xs text-muted-foreground mb-6">
                  Asegurate de que tenga al menos un ciclo for valido.
                </p>
                <button
                  onClick={handleReset}
                  className="text-xs text-primary hover:underline"
                >
                  Intentar de nuevo
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
