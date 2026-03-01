"use client"

import { useState } from "react"
import { ChevronRight, ChevronDown } from "lucide-react"
import type { AnalysisStep } from "@/lib/algorithm-analyzer"

interface StepExplainerProps {
  steps: AnalysisStep[]
  onHoverLoop?: (index: number | undefined) => void
}

export function StepExplainer({ steps, onHoverLoop }: StepExplainerProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(
    new Set(steps.map((_, i) => i))
  )

  const toggleStep = (index: number) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const getStepAccent = (step: AnalysisStep) => {
    switch (step.highlight) {
      case "operation": return "border-l-chart-2"
      case "loop": return "border-l-chart-3"
      case "result": return "border-l-primary"
      default: return "border-l-border"
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {steps.map((step, index) => {
        const isExpanded = expandedSteps.has(index)
        const isResult = step.highlight === "result"

        return (
          <div
            key={index}
            className={`rounded-lg border border-border bg-card overflow-hidden border-l-2 ${getStepAccent(step)}`}
            onMouseEnter={() => {
              if (step.loopIndex !== undefined) onHoverLoop?.(step.loopIndex)
            }}
            onMouseLeave={() => onHoverLoop?.(undefined)}
          >
            <button
              onClick={() => toggleStep(index)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-secondary/30 transition-colors"
            >
              <span className="text-[11px] font-mono text-muted-foreground/50 w-5 text-right flex-shrink-0">
                {index + 1}
              </span>
              <span className={`flex-1 text-sm ${isResult ? "font-semibold text-primary" : "text-foreground"}`}>
                {step.title}
              </span>
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/40" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40" />
              )}
            </button>

            {isExpanded && (
              <div className="px-4 pb-3.5 space-y-2">
                <p className="text-[13px] text-foreground/70 leading-relaxed pl-8">
                  {step.description}
                </p>
                {step.formula && (
                  <div className={`ml-8 px-3 py-2 rounded-md font-mono text-sm ${
                    isResult
                      ? "bg-primary/10 text-primary font-semibold"
                      : "bg-secondary text-foreground/80"
                  }`}>
                    {step.formula}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
