"use client"

import type { ExecutionTrace, LoopInfo } from "@/lib/algorithm-analyzer"

interface ExecutionGridProps {
  traces: ExecutionTrace[]
  loops: LoopInfo[]
  n: number
}

export function ExecutionGrid({ traces, loops, n }: ExecutionGridProps) {
  if (traces.length === 0) return null

  const totalExecutions = traces.reduce((sum, t) => sum + t.executions, 0)
  const maxExec = Math.max(...traces.map((t) => t.executions), 1)

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs text-muted-foreground">
          Traza para n = {n}
        </span>
        <span className="text-xs font-mono text-primary">
          Total: {totalExecutions}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {loops[0] && (
                <th className="text-left py-2.5 px-4 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  {loops[0].variable}
                </th>
              )}
              {loops.length >= 2 && (
                <th className="text-left py-2.5 px-4 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  {loops[1].variable} itera
                </th>
              )}
              <th className="text-left py-2.5 px-4 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                OB
              </th>
              <th className="text-left py-2.5 px-4 text-[11px] font-medium text-muted-foreground uppercase tracking-wider w-1/3">
                {" "}
              </th>
            </tr>
          </thead>
          <tbody>
            {traces.map((trace, idx) => (
              <tr key={idx} className="border-b border-border/40 last:border-0">
                {trace.i !== undefined && (
                  <td className="py-2 px-4 font-mono text-xs text-chart-3">
                    {trace.i}
                  </td>
                )}
                {trace.j !== undefined && (
                  <td className="py-2 px-4 font-mono text-xs text-chart-2">
                    {trace.j}
                  </td>
                )}
                <td className="py-2 px-4 font-mono text-xs text-foreground font-medium">
                  {trace.executions}
                </td>
                <td className="py-2 px-4">
                  <div className="h-3 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary/40 rounded-full transition-all duration-500"
                      style={{
                        width: `${maxExec > 0 ? (trace.executions / maxExec) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Visual matrix for 2D loops */}
      {loops.length >= 2 && traces.some((t) => t.j !== undefined) && (
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-[11px] text-muted-foreground mb-3 uppercase tracking-wider font-medium">
            Matriz ({loops[0].variable} x {loops[1].variable})
          </p>
          <div className="flex flex-col gap-px overflow-x-auto">
            {/* Header */}
            <div className="flex gap-px items-center">
              <div className="w-7 h-7 flex items-center justify-center text-[10px] font-mono text-muted-foreground/30" />
              {Array.from({ length: n }, (_, j) => (
                <div
                  key={j}
                  className="w-7 h-7 flex items-center justify-center text-[10px] font-mono text-muted-foreground/40"
                >
                  {j}
                </div>
              ))}
            </div>
            {/* Rows */}
            {traces.map((trace, i) => (
              <div key={i} className="flex gap-px items-center">
                <div className="w-7 h-7 flex items-center justify-center text-[10px] font-mono text-muted-foreground/40">
                  {trace.i}
                </div>
                {Array.from({ length: n }, (_, j) => {
                  const executed = j < (trace.j ?? 0)
                  return (
                    <div
                      key={j}
                      className={`w-7 h-7 rounded-sm flex items-center justify-center text-[9px] font-mono transition-all ${
                        executed
                          ? "bg-primary/25 text-primary"
                          : "bg-secondary/40"
                      }`}
                    >
                      {executed ? "x" : ""}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
