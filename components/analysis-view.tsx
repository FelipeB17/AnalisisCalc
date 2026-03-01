"use client"

import { useState } from "react"
import { Code2, ListOrdered, Grid3x3 } from "lucide-react"
import type { AnalysisResult } from "@/lib/algorithm-analyzer"
import { CodeEditor } from "@/components/code-editor"
import { StepExplainer } from "@/components/step-explainer"
import { ExecutionGrid } from "@/components/execution-grid"

interface AnalysisViewProps {
  code: string
  analysis: AnalysisResult
  onChangeCode: (code: string) => void
}

export function AnalysisView({ code, analysis, onChangeCode }: AnalysisViewProps) {
  const [highlightedLoop, setHighlightedLoop] = useState<number | undefined>(undefined)
  const [activeTab, setActiveTab] = useState<"steps" | "trace">("steps")

  const getComplexityStyle = () => {
    const b = analysis.bigO
    if (b.includes("log n") && !b.includes("n^2") && !b.includes("n log")) return "text-primary"
    if (b.includes("n log n")) return "text-chart-3"
    if (b.includes("n^2")) return "text-chart-2"
    if (b.includes("n^3")) return "text-destructive"
    return "text-primary"
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Result header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-8">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-medium">
            Resultado
          </p>
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className={`text-4xl font-bold font-mono tracking-tight ${getComplexityStyle()}`}>
              {analysis.bigO}
            </span>
            <span className="text-sm text-muted-foreground">
              f(n) = {analysis.efficiencySimplified}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="px-2.5 py-1 rounded-md bg-card border border-border font-mono">
            {analysis.patternType}
          </span>
          <span className="px-2.5 py-1 rounded-md bg-card border border-border font-mono">
            {'n=5 =>'} {analysis.totalFromTrace}
          </span>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Code */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Code2 className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Codigo
            </span>
          </div>
          <CodeEditor
            code={code}
            onChange={onChangeCode}
            highlightedLoop={highlightedLoop}
          />
          <p className="mt-2 text-[11px] text-muted-foreground/50">
            Edita el codigo directamente y el analisis se recalcula.
          </p>
        </div>

        {/* Right: Analysis */}
        <div>
          {/* Tab switcher */}
          <div className="flex items-center gap-1 mb-3">
            <button
              onClick={() => setActiveTab("steps")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === "steps"
                  ? "bg-card border border-border text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ListOrdered className="w-3 h-3" />
              Explicacion
            </button>
            <button
              onClick={() => setActiveTab("trace")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === "trace"
                  ? "bg-card border border-border text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Grid3x3 className="w-3 h-3" />
              Traza
            </button>
          </div>

          {activeTab === "steps" && (
            <StepExplainer
              steps={analysis.steps}
              onHoverLoop={setHighlightedLoop}
            />
          )}

          {activeTab === "trace" && (
            <ExecutionGrid
              traces={analysis.traces}
              loops={analysis.loops}
              n={5}
            />
          )}
        </div>
      </div>
    </div>
  )
}
