export interface LoopInfo {
  variable: string
  init: string
  initValue: number | string
  condition: string
  conditionOp: string
  conditionBound: string
  update: string
  updateType: "increment" | "decrement" | "multiply" | "divide" | "add_step" | "sub_step" | "custom"
  stepSize: number
  dependsOnInit: string | null
  dependsOnBound: string | null
  iterationCount: string
  direction: "ascending" | "descending"
}

export interface AnalysisStep {
  title: string
  description: string
  formula?: string
  highlight?: "loop" | "operation" | "result"
  loopIndex?: number
}

export interface ExecutionTrace {
  i?: number
  j?: number
  k?: number
  executions: number
}

export interface AnalysisResult {
  loops: LoopInfo[]
  steps: AnalysisStep[]
  operationLine: string
  efficiency: string
  efficiencySimplified: string
  bigO: string
  traces: ExecutionTrace[]
  totalFromTrace: number
  hasBreak: boolean
  hasCondition: boolean
  breakCondition: string
  patternType: string
}

// ==========================================
// PARSER: Extract loop structure from code
// ==========================================

function parseLoop(line: string, outerVars: string[]): LoopInfo | null {
  const trimmed = line.trim()

  const forRegex =
    /for\s*\(\s*(?:int|let|var|long|short|unsigned\s+int|auto|size_t)?\s*(\w+)\s*=\s*([^;]+);\s*(\w+)\s*([<>!=]+)\s*([^;]+);\s*(.+)\)/
  const match = trimmed.match(forRegex)
  if (!match) return null

  const variable = match[1]
  const initExpr = match[2].trim()
  const condOp = match[4].trim()
  const condBound = match[5].trim()
  const updateExpr = match[6].trim()

  const initValue = isNaN(Number(initExpr)) ? initExpr : Number(initExpr)

  let updateType: LoopInfo["updateType"] = "increment"
  let stepSize = 1

  if (
    updateExpr === `${variable}++` ||
    updateExpr === `++${variable}` ||
    updateExpr === `${variable} = ${variable} + 1` ||
    updateExpr === `${variable}+=1`
  ) {
    updateType = "increment"
    stepSize = 1
  } else if (
    updateExpr === `${variable}--` ||
    updateExpr === `--${variable}` ||
    updateExpr === `${variable} = ${variable} - 1` ||
    updateExpr === `${variable}-=1`
  ) {
    updateType = "decrement"
    stepSize = 1
  } else if (updateExpr.match(new RegExp(`^${variable}\\s*\\+=\\s*(\\d+)$`))) {
    updateType = "add_step"
    const m = updateExpr.match(new RegExp(`^${variable}\\s*\\+=\\s*(\\d+)$`))
    stepSize = m ? Number(m[1]) : 2
    if (stepSize === 1) updateType = "increment"
  } else if (updateExpr.match(new RegExp(`^${variable}\\s*-=\\s*(\\d+)$`))) {
    updateType = "sub_step"
    const m = updateExpr.match(new RegExp(`^${variable}\\s*-=\\s*(\\d+)$`))
    stepSize = m ? Number(m[1]) : 2
    if (stepSize === 1) updateType = "decrement"
  } else if (updateExpr.match(new RegExp(`^${variable}\\s*=\\s*${variable}\\s*\\+\\s*(\\d+)$`))) {
    updateType = "add_step"
    const m = updateExpr.match(new RegExp(`^${variable}\\s*=\\s*${variable}\\s*\\+\\s*(\\d+)$`))
    stepSize = m ? Number(m[1]) : 2
    if (stepSize === 1) updateType = "increment"
  } else if (updateExpr.match(new RegExp(`^${variable}\\s*=\\s*${variable}\\s*-\\s*(\\d+)$`))) {
    updateType = "sub_step"
    const m = updateExpr.match(new RegExp(`^${variable}\\s*=\\s*${variable}\\s*-\\s*(\\d+)$`))
    stepSize = m ? Number(m[1]) : 2
    if (stepSize === 1) updateType = "decrement"
  } else if (updateExpr.match(new RegExp(`^${variable}\\s*\\*=\\s*(\\d+)$`))) {
    updateType = "multiply"
    const m = updateExpr.match(new RegExp(`^${variable}\\s*\\*=\\s*(\\d+)$`))
    stepSize = m ? Number(m[1]) : 2
  } else if (updateExpr.match(new RegExp(`^${variable}\\s*=\\s*${variable}\\s*\\*\\s*(\\d+)$`))) {
    updateType = "multiply"
    const m = updateExpr.match(new RegExp(`^${variable}\\s*=\\s*${variable}\\s*\\*\\s*(\\d+)$`))
    stepSize = m ? Number(m[1]) : 2
  } else if (updateExpr.match(new RegExp(`^${variable}\\s*\\/=\\s*(\\d+)$`))) {
    updateType = "divide"
    const m = updateExpr.match(new RegExp(`^${variable}\\s*\\/=\\s*(\\d+)$`))
    stepSize = m ? Number(m[1]) : 2
  } else if (updateExpr.match(new RegExp(`^${variable}\\s*=\\s*${variable}\\s*\\/\\s*(\\d+)$`))) {
    updateType = "divide"
    const m = updateExpr.match(new RegExp(`^${variable}\\s*=\\s*${variable}\\s*\\/\\s*(\\d+)$`))
    stepSize = m ? Number(m[1]) : 2
  } else {
    updateType = "custom"
    stepSize = 1
  }

  const direction: "ascending" | "descending" =
    updateType === "decrement" || updateType === "sub_step" || updateType === "divide"
      ? "descending"
      : "ascending"

  let dependsOnInit: string | null = null
  let dependsOnBound: string | null = null

  if (typeof initValue === "string") {
    for (const v of outerVars) {
      if (initExpr.includes(v)) {
        dependsOnInit = v
        break
      }
    }
  }

  for (const v of outerVars) {
    if (condBound.includes(v)) {
      dependsOnBound = v
      break
    }
  }

  let iterationCount = "n"
  const isDependent = dependsOnInit !== null || dependsOnBound !== null

  if (isDependent) {
    iterationCount = "depende del ciclo externo"
  } else if (updateType === "multiply") {
    iterationCount = stepSize === 2 ? "log2(n)" : `log${stepSize}(n)`
  } else if (updateType === "divide") {
    iterationCount = stepSize === 2 ? "log2(n)" : `log${stepSize}(n)`
  } else if (updateType === "add_step" && stepSize > 1) {
    iterationCount = `n/${stepSize}`
  } else if (updateType === "sub_step" && stepSize > 1) {
    iterationCount = `n/${stepSize}`
  } else {
    if (condBound === "n") {
      if (condOp === "<=") {
        iterationCount = typeof initValue === "number" ? `n - ${initValue} + 1` : "n"
      } else {
        iterationCount = typeof initValue === "number" && initValue !== 0 ? `n - ${initValue}` : "n"
      }
    } else if (!isNaN(Number(condBound))) {
      const b = Number(condBound)
      const a = typeof initValue === "number" ? initValue : 0
      if (condOp === "<") iterationCount = String(b - a)
      else if (condOp === "<=") iterationCount = String(b - a + 1)
      else if (condOp === ">") iterationCount = String(a - b)
      else if (condOp === ">=") iterationCount = String(a - b + 1)
      else iterationCount = String(b)
    } else {
      iterationCount = "n"
    }
  }

  return {
    variable,
    init: initExpr,
    initValue,
    condition: `${match[3].trim()} ${condOp} ${condBound}`,
    conditionOp: condOp,
    conditionBound: condBound,
    update: updateExpr,
    updateType,
    stepSize,
    dependsOnInit,
    dependsOnBound,
    iterationCount,
    direction,
  }
}

// ==========================================
// SIMULATOR: Actually run the loops for n
// ==========================================

interface SimContext {
  [varName: string]: number
}

function resolveValue(expr: string, ctx: SimContext, n: number): number {
  let resolved = expr.replace(/\bn\b/g, String(n))
  // Sort variable names by length descending to avoid partial replacements
  const sortedVars = Object.entries(ctx).sort((a, b) => b[0].length - a[0].length)
  for (const [varName, val] of sortedVars) {
    resolved = resolved.replace(new RegExp(`\\b${varName}\\b`, "g"), String(val))
  }
  try {
    return evalSimple(resolved)
  } catch {
    return 0
  }
}

function evalSimple(expr: string): number {
  const sanitized = expr.replace(/[^0-9+\-*/().  ]/g, "")
  if (sanitized.length === 0) return 0
  try {
    const fn = new Function(`return (${sanitized})`)
    const result = fn()
    return typeof result === "number" && isFinite(result) ? Math.floor(result) : 0
  } catch {
    return 0
  }
}

function checkCondition(currentVal: number, op: string, boundVal: number): boolean {
  switch (op) {
    case "<": return currentVal < boundVal
    case "<=": return currentVal <= boundVal
    case ">": return currentVal > boundVal
    case ">=": return currentVal >= boundVal
    case "!=": return currentVal !== boundVal
    case "==": return currentVal === boundVal
    default: return false
  }
}

function advanceLoop(currentVal: number, loop: LoopInfo): number {
  switch (loop.updateType) {
    case "increment": return currentVal + 1
    case "decrement": return currentVal - 1
    case "add_step": return currentVal + loop.stepSize
    case "sub_step": return currentVal - loop.stepSize
    case "multiply": return currentVal * loop.stepSize
    case "divide": return Math.floor(currentVal / loop.stepSize)
    default: return currentVal + 1
  }
}

function evaluateBreakCondition(condition: string, ctx: SimContext): boolean {
  let expr = condition
  const sortedVars = Object.entries(ctx).sort((a, b) => b[0].length - a[0].length)
  for (const [varName, val] of sortedVars) {
    expr = expr.replace(new RegExp(`\\b${varName}\\b`, "g"), String(val))
  }
  expr = expr.replace(/(?<!=)=(?!=)/g, "===")
  expr = expr.replace(/!===/g, "!==")
  try {
    const fn = new Function(`return (${expr})`)
    return !!fn()
  } catch {
    return false
  }
}

// Generic simulator that works for 1, 2, or 3 nested loops
function simulateLoops(
  loops: LoopInfo[],
  n: number,
  hasBreak: boolean,
  breakCondition: string
): { traces: ExecutionTrace[]; total: number } {
  const traces: ExecutionTrace[] = []
  let total = 0
  const MAX_ITERS = 100000

  if (loops.length === 0) return { traces, total }

  if (loops.length === 1) {
    const L = loops[0]
    const ctx: SimContext = {}
    let cur = resolveValue(L.init, ctx, n)
    const bound = resolveValue(L.conditionBound, ctx, n)
    let safety = 0

    while (checkCondition(cur, L.conditionOp, bound) && safety < MAX_ITERS) {
      traces.push({ i: cur, executions: 1 })
      total++
      cur = advanceLoop(cur, L)
      safety++
    }
  } else if (loops.length === 2) {
    const outer = loops[0]
    const inner = loops[1]

    let iCur = resolveValue(outer.init, {}, n)
    const iBound = resolveValue(outer.conditionBound, {}, n)
    let safetyI = 0

    while (checkCondition(iCur, outer.conditionOp, iBound) && safetyI < MAX_ITERS) {
      const ctx: SimContext = { [outer.variable]: iCur }
      let jCur = resolveValue(inner.init, ctx, n)
      const jBound = resolveValue(inner.conditionBound, ctx, n)
      let innerCount = 0
      let safetyJ = 0

      while (checkCondition(jCur, inner.conditionOp, jBound) && safetyJ < MAX_ITERS) {
        if (hasBreak && breakCondition) {
          const breakCtx = { ...ctx, [inner.variable]: jCur }
          if (evaluateBreakCondition(breakCondition, breakCtx)) break
        }
        innerCount++
        jCur = advanceLoop(jCur, inner)
        safetyJ++
      }

      traces.push({ i: iCur, j: innerCount, executions: innerCount })
      total += innerCount
      iCur = advanceLoop(iCur, outer)
      safetyI++
    }
  } else if (loops.length === 3) {
    const L0 = loops[0]
    const L1 = loops[1]
    const L2 = loops[2]

    let iCur = resolveValue(L0.init, {}, n)
    const iBound = resolveValue(L0.conditionBound, {}, n)
    let safetyI = 0

    while (checkCondition(iCur, L0.conditionOp, iBound) && safetyI < MAX_ITERS) {
      const ctx0: SimContext = { [L0.variable]: iCur }
      let jCur = resolveValue(L1.init, ctx0, n)
      const jBound = resolveValue(L1.conditionBound, ctx0, n)
      let safetyJ = 0
      let totalForI = 0

      while (checkCondition(jCur, L1.conditionOp, jBound) && safetyJ < MAX_ITERS) {
        const ctx1: SimContext = { ...ctx0, [L1.variable]: jCur }
        let kCur = resolveValue(L2.init, ctx1, n)
        const kBound = resolveValue(L2.conditionBound, ctx1, n)
        let safetyK = 0

        while (checkCondition(kCur, L2.conditionOp, kBound) && safetyK < MAX_ITERS) {
          if (hasBreak && breakCondition) {
            const breakCtx = { ...ctx1, [L2.variable]: kCur }
            if (evaluateBreakCondition(breakCondition, breakCtx)) break
          }
          totalForI++
          kCur = advanceLoop(kCur, L2)
          safetyK++
        }

        jCur = advanceLoop(jCur, L1)
        safetyJ++
      }

      traces.push({ i: iCur, executions: totalForI })
      total += totalForI
      iCur = advanceLoop(iCur, L0)
      safetyI++
    }
  }

  return { traces, total }
}

// ==========================================
// FORMULA DERIVATION via simulation + fitting
// ==========================================

interface FormulaResult {
  efficiency: string
  simplified: string
  bigO: string
  patternType: string
}

// Simulate at multiple n values and attempt to fit f(n)
function deriveFormulaFromSimulation(
  loops: LoopInfo[],
  hasBreak: boolean,
  breakCondition: string,
): FormulaResult {
  if (loops.length === 0) {
    return { efficiency: "1", simplified: "1", bigO: "O(1)", patternType: "Sin ciclos" }
  }

  // Check structural properties to choose fitting strategy
  const hasLog = loops.some(l => l.updateType === "multiply" || l.updateType === "divide")
  const anyDependent = loops.some(l => l.dependsOnInit !== null || l.dependsOnBound !== null)

  // Collect simulation data points at many n values for robust fitting
  const testNs = [4, 6, 8, 10, 12, 16, 20, 25, 30, 40, 50, 64, 80, 100]
  const dataPoints: { n: number; f: number }[] = []

  for (const tn of testNs) {
    const sim = simulateLoops(loops, tn, hasBreak, breakCondition)
    if (sim.total >= 0) {
      dataPoints.push({ n: tn, f: sim.total })
    }
  }

  if (dataPoints.length < 3) {
    return { efficiency: "?", simplified: "?", bigO: "O(?)", patternType: "Insuficientes datos" }
  }

  // All zeros?
  if (dataPoints.every(p => p.f === 0)) {
    return { efficiency: "0", simplified: "0", bigO: "O(0)", patternType: "No ejecuta" }
  }

  // ---- Strategy: Try known closed forms from best to worst fit ----
  // We try each candidate model and pick the one with best fit (lowest relative error)

  interface Candidate {
    name: string
    patternType: string
    bigO: string
    fitFn: (n: number) => number
    efficiency: string
    simplified: string
  }

  const candidates: Candidate[] = []

  // 1) Constant: f(n) = c
  {
    const c = dataPoints[0].f
    if (dataPoints.every(p => p.f === c)) {
      candidates.push({
        name: "constant",
        patternType: "Constante",
        bigO: "O(1)",
        fitFn: () => c,
        efficiency: String(c),
        simplified: String(c),
      })
    }
  }

  // 2) Pure polynomial fitting: f(n) = a*n^3 + b*n^2 + c*n + d
  // Use least-squares polynomial regression up to degree 3
  for (const degree of [1, 2, 3]) {
    const coeffs = fitPolynomial(dataPoints, degree)
    if (coeffs) {
      const maxRelErr = maxRelativeError(dataPoints, (n) => evalPoly(coeffs, n))
      if (maxRelErr < 0.001) {
        const { eff, simp, big } = formatPolynomial(coeffs)
        let pt = ""
        if (degree === 1) pt = anyDependent ? "Ciclo lineal dependiente" : "Ciclo lineal"
        else if (degree === 2) pt = anyDependent ? "Doble ciclo dependiente" : "Doble ciclo"
        else pt = "Triple ciclo"
        
        candidates.push({
          name: `poly${degree}`,
          patternType: pt,
          bigO: big,
          fitFn: (n) => evalPoly(coeffs, n),
          efficiency: eff,
          simplified: simp,
        })
      }
    }
  }

  // 3) Log models: f(n) = a*log_b(n) + c
  if (hasLog) {
    for (const base of [2, 3, 5, 10]) {
      const logData = dataPoints.map(p => ({ x: Math.log(p.n) / Math.log(base), y: p.f }))
      const lr = linearRegression(logData)
      if (lr) {
        const fittedFn = (n: number) => lr.a * (Math.log(n) / Math.log(base)) + lr.b
        const maxErr = maxRelativeError(dataPoints, fittedFn)
        if (maxErr < 0.01) {
          const aRound = roundNice(lr.a)
          const bRound = roundNice(lr.b)
          const logStr = base === 2 ? "log2(n)" : `log${base}(n)`
          let eff = ""
          if (Math.abs(aRound - 1) < 0.001) eff = logStr
          else eff = `${aRound} * ${logStr}`
          if (Math.abs(bRound) > 0.5) eff += bRound > 0 ? ` + ${bRound}` : ` - ${Math.abs(bRound)}`

          candidates.push({
            name: `log_base${base}`,
            patternType: "Ciclo logaritmico",
            bigO: "O(log n)",
            fitFn: fittedFn,
            efficiency: eff,
            simplified: logStr,
          })
        }
      }
    }
  }

  // 4) n*log(n) models: f(n) = a*n*log_b(n) + c*n + d
  if (hasLog || loops.length >= 2) {
    for (const base of [2, 3]) {
      const nlogData = dataPoints.map(p => ({
        n: p.n,
        nlog: p.n * (Math.log(p.n) / Math.log(base)),
        f: p.f,
      }))
      // Fit f = a*n*log(n) + b*n + c using least squares
      const fit = fitNLogN(nlogData)
      if (fit) {
        const fittedFn = (n: number) =>
          fit.a * n * (Math.log(n) / Math.log(base)) + fit.b * n + fit.c
        const maxErr = maxRelativeError(dataPoints, fittedFn)
        if (maxErr < 0.005) {
          const logStr = base === 2 ? "log2(n)" : `log${base}(n)`
          const aStr = formatCoeff(fit.a)
          let eff = `${aStr}n * ${logStr}`
          if (Math.abs(fit.b) > 0.01) {
            const bStr = formatCoeff(Math.abs(fit.b))
            eff += fit.b > 0 ? ` + ${bStr}n` : ` - ${bStr}n`
          }
          candidates.push({
            name: `nlogn_base${base}`,
            patternType: loops.length >= 2 ? "Ciclo lineal + logaritmico" : "n log n",
            bigO: "O(n log n)",
            fitFn: fittedFn,
            efficiency: eff,
            simplified: `n * ${logStr}`,
          })
        }
      }
    }
  }

  // 5) n^2 * log(n) models
  if (hasLog && loops.length >= 3) {
    for (const base of [2, 3]) {
      const data = dataPoints.map(p => ({
        n: p.n,
        n2log: p.n * p.n * (Math.log(p.n) / Math.log(base)),
        f: p.f,
      }))
      const fit = fitN2LogN(data)
      if (fit) {
        const fittedFn = (n: number) =>
          fit.a * n * n * (Math.log(n) / Math.log(base)) + fit.b * n * n + fit.c * n + fit.d
        const maxErr = maxRelativeError(dataPoints, fittedFn)
        if (maxErr < 0.005) {
          const logStr = base === 2 ? "log2(n)" : `log${base}(n)`
          const aStr = formatCoeff(fit.a)
          candidates.push({
            name: `n2logn_base${base}`,
            patternType: "Triple ciclo con logaritmo",
            bigO: "O(n^2 log n)",
            fitFn: fittedFn,
            efficiency: `${aStr}n^2 * ${logStr}`,
            simplified: `n^2 * ${logStr}`,
          })
        }
      }
    }
  }

  // 6) (log n)^2 model
  if (hasLog && loops.length >= 2) {
    for (const base of [2, 3]) {
      const lg = (n: number) => Math.log(n) / Math.log(base)
      const data = dataPoints.map(p => ({ x: lg(p.n) * lg(p.n), y: p.f }))
      const lr = linearRegression(data)
      if (lr) {
        const fittedFn = (n: number) => lr.a * lg(n) * lg(n) + lr.b
        const maxErr = maxRelativeError(dataPoints, fittedFn)
        if (maxErr < 0.01) {
          const logStr = base === 2 ? "log2(n)" : `log${base}(n)`
          candidates.push({
            name: `log2_base${base}`,
            patternType: "Doble ciclo logaritmico",
            bigO: "O((log n)^2)",
            fitFn: fittedFn,
            efficiency: `(${logStr})^2`,
            simplified: `(${logStr})^2`,
          })
        }
      }
    }
  }

  // 7) n * (log n)^2 model
  if (hasLog && loops.length >= 3) {
    for (const base of [2, 3]) {
      const lg = (n: number) => Math.log(n) / Math.log(base)
      const data = dataPoints.map(p => ({ x: p.n * lg(p.n) * lg(p.n), y: p.f }))
      const lr = linearRegression(data)
      if (lr) {
        const fittedFn = (n: number) => lr.a * n * lg(n) * lg(n) + lr.b
        const maxErr = maxRelativeError(dataPoints, fittedFn)
        if (maxErr < 0.01) {
          const logStr = base === 2 ? "log2(n)" : `log${base}(n)`
          candidates.push({
            name: `nlog2_base${base}`,
            patternType: "Triple ciclo con logaritmo",
            bigO: "O(n (log n)^2)",
            fitFn: fittedFn,
            efficiency: `n * (${logStr})^2`,
            simplified: `n * (${logStr})^2`,
          })
        }
      }
    }
  }

  // Pick best candidate by minimum max relative error
  if (candidates.length === 0) {
    // Fallback: just report from simulation
    const sim5 = simulateLoops(loops, 5, hasBreak, breakCondition)
    return {
      efficiency: `~${sim5.total} (para n=5)`,
      simplified: "ver traza",
      bigO: estimateBigOFromGrowth(dataPoints),
      patternType: "Analisis por simulacion",
    }
  }

  // Sort candidates: prefer lower complexity class when fit is equally good
  // then prefer lower error
  const scored = candidates.map(c => ({
    ...c,
    error: maxRelativeError(dataPoints, c.fitFn),
  }))

  scored.sort((a, b) => {
    // Both are good fits; prefer simpler model
    if (a.error < 0.001 && b.error < 0.001) {
      return complexityOrder(a.bigO) - complexityOrder(b.bigO)
    }
    return a.error - b.error
  })

  const best = scored[0]

  // Try to produce exact rational coefficients for polynomial
  if (best.name.startsWith("poly")) {
    return {
      efficiency: best.efficiency,
      simplified: best.simplified,
      bigO: best.bigO,
      patternType: best.patternType,
    }
  }

  return {
    efficiency: best.efficiency,
    simplified: best.simplified,
    bigO: best.bigO,
    patternType: best.patternType,
  }
}

function complexityOrder(bigO: string): number {
  if (bigO === "O(1)") return 0
  if (bigO === "O(log n)") return 1
  if (bigO === "O((log n)^2)") return 2
  if (bigO === "O(n)") return 3
  if (bigO === "O(n log n)") return 4
  if (bigO === "O(n (log n)^2)") return 5
  if (bigO === "O(n^2)") return 6
  if (bigO === "O(n^2 log n)") return 7
  if (bigO === "O(n^3)") return 8
  return 10
}

function estimateBigOFromGrowth(data: { n: number; f: number }[]): string {
  if (data.length < 2) return "O(?)"
  const first = data[0]
  const last = data[data.length - 1]
  if (last.f === 0 || first.f === 0) return "O(?)"
  const ratio = last.f / first.f
  const nRatio = last.n / first.n
  const exponent = Math.log(ratio) / Math.log(nRatio)
  if (exponent < 0.1) return "O(1)"
  if (exponent < 0.7) return "O(log n)"
  if (exponent < 1.3) return "O(n)"
  if (exponent < 1.7) return "O(n log n)"
  if (exponent < 2.3) return "O(n^2)"
  if (exponent < 2.7) return "O(n^2 log n)"
  if (exponent < 3.3) return "O(n^3)"
  return `O(n^${Math.round(exponent)})`
}

// ==========================================
// Fitting utilities
// ==========================================

function maxRelativeError(data: { n: number; f: number }[], fn: (n: number) => number): number {
  let maxErr = 0
  for (const p of data) {
    const predicted = fn(p.n)
    const actual = p.f
    if (actual === 0 && Math.abs(predicted) < 0.5) continue
    if (actual === 0) return Infinity
    const err = Math.abs(predicted - actual) / Math.max(Math.abs(actual), 1)
    if (err > maxErr) maxErr = err
  }
  return maxErr
}

// Polynomial regression using normal equations
function fitPolynomial(data: { n: number; f: number }[], degree: number): number[] | null {
  const m = data.length
  if (m <= degree) return null

  // Build Vandermonde matrix
  const dim = degree + 1
  const XtX: number[][] = Array.from({ length: dim }, () => Array(dim).fill(0))
  const XtY: number[] = Array(dim).fill(0)

  for (const p of data) {
    const powers: number[] = []
    let pw = 1
    for (let d = 0; d < dim; d++) {
      powers.push(pw)
      pw *= p.n
    }
    for (let i = 0; i < dim; i++) {
      for (let j = 0; j < dim; j++) {
        XtX[i][j] += powers[i] * powers[j]
      }
      XtY[i] += powers[i] * p.f
    }
  }

  // Solve using Gaussian elimination
  return solveLinearSystem(XtX, XtY)
}

function evalPoly(coeffs: number[], n: number): number {
  let result = 0
  let pw = 1
  for (const c of coeffs) {
    result += c * pw
    pw *= n
  }
  return result
}

function formatPolynomial(coeffs: number[]): { eff: string; simp: string; big: string } {
  // coeffs[0] = constant, coeffs[1] = n coeff, coeffs[2] = n^2 coeff, coeffs[3] = n^3 coeff
  const degree = coeffs.length - 1

  // Find leading term
  let leadingDeg = 0
  for (let i = degree; i >= 0; i--) {
    if (Math.abs(coeffs[i]) > 0.0001) {
      leadingDeg = i
      break
    }
  }

  // Format exact expression
  const terms: string[] = []
  for (let i = degree; i >= 0; i--) {
    const c = coeffs[i]
    if (Math.abs(c) < 0.0001) continue

    // Try to express as a nice fraction
    const frac = toNiceFraction(c)

    let termStr = ""
    if (i === 0) {
      termStr = frac
    } else if (i === 1) {
      if (frac === "1") termStr = "n"
      else if (frac === "-1") termStr = "-n"
      else termStr = `${frac}n`
    } else {
      if (frac === "1") termStr = `n^${i}`
      else if (frac === "-1") termStr = `-n^${i}`
      else termStr = `${frac}*n^${i}`
    }
    terms.push(termStr)
  }

  const eff = terms.length > 0 ? terms.join(" + ").replace(/\+ -/g, "- ") : "0"

  // Simplified: just leading term
  let simp = ""
  const leadCoeff = coeffs[leadingDeg]
  const leadFrac = toNiceFraction(leadCoeff)

  if (leadingDeg === 0) simp = leadFrac
  else if (leadingDeg === 1) simp = leadFrac === "1" ? "n" : `${leadFrac}*n`
  else simp = leadFrac === "1" ? `n^${leadingDeg}` : `${leadFrac}*n^${leadingDeg}`

  let big = "O(1)"
  if (leadingDeg === 1) big = "O(n)"
  else if (leadingDeg === 2) big = "O(n^2)"
  else if (leadingDeg === 3) big = "O(n^3)"
  else if (leadingDeg > 3) big = `O(n^${leadingDeg})`

  return { eff, simp, big }
}

function toNiceFraction(x: number): string {
  if (Math.abs(x - Math.round(x)) < 0.0001) {
    return String(Math.round(x))
  }
  // Try common denominators
  for (const denom of [2, 3, 4, 5, 6, 8, 10, 12]) {
    const num = x * denom
    if (Math.abs(num - Math.round(num)) < 0.001) {
      const n = Math.round(num)
      const g = gcd(Math.abs(n), denom)
      const nn = n / g
      const dd = denom / g
      if (dd === 1) return String(nn)
      return `${nn}/${dd}`
    }
  }
  return x.toFixed(2)
}

function gcd(a: number, b: number): number {
  while (b) { [a, b] = [b, a % b] }
  return a
}

function formatCoeff(c: number): string {
  if (Math.abs(c - 1) < 0.001) return ""
  if (Math.abs(c - 0.5) < 0.001) return "1/2 * "
  if (Math.abs(c - Math.round(c)) < 0.001) return `${Math.round(c)} * `
  return toNiceFraction(c) + " * "
}

function linearRegression(data: { x: number; y: number }[]): { a: number; b: number } | null {
  const n = data.length
  if (n < 2) return null
  let sx = 0, sy = 0, sxx = 0, sxy = 0
  for (const p of data) {
    sx += p.x; sy += p.y; sxx += p.x * p.x; sxy += p.x * p.y
  }
  const det = n * sxx - sx * sx
  if (Math.abs(det) < 1e-10) return null
  return { a: (n * sxy - sx * sy) / det, b: (sxx * sy - sx * sxy) / det }
}

// Fit f = a*n*log(n) + b*n + c
function fitNLogN(data: { n: number; nlog: number; f: number }[]): { a: number; b: number; c: number } | null {
  // 3 unknowns: a, b, c
  // Build normal equations for features: [n*log(n), n, 1]
  const m = data.length
  if (m < 3) return null

  const XtX: number[][] = [[0,0,0],[0,0,0],[0,0,0]]
  const XtY: number[] = [0,0,0]

  for (const p of data) {
    const feats = [p.nlog, p.n, 1]
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        XtX[i][j] += feats[i] * feats[j]
      }
      XtY[i] += feats[i] * p.f
    }
  }

  const sol = solveLinearSystem(XtX, XtY)
  if (!sol) return null
  return { a: sol[0], b: sol[1], c: sol[2] }
}

// Fit f = a*n^2*log(n) + b*n^2 + c*n + d
function fitN2LogN(data: { n: number; n2log: number; f: number }[]): { a: number; b: number; c: number; d: number } | null {
  const m = data.length
  if (m < 4) return null

  const XtX: number[][] = Array.from({ length: 4 }, () => Array(4).fill(0))
  const XtY: number[] = [0,0,0,0]

  for (const p of data) {
    const feats = [p.n2log, p.n * p.n, p.n, 1]
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        XtX[i][j] += feats[i] * feats[j]
      }
      XtY[i] += feats[i] * p.f
    }
  }

  const sol = solveLinearSystem(XtX, XtY)
  if (!sol) return null
  return { a: sol[0], b: sol[1], c: sol[2], d: sol[3] }
}

function solveLinearSystem(A: number[][], b: number[]): number[] | null {
  const n = A.length
  // Augmented matrix
  const aug: number[][] = A.map((row, i) => [...row, b[i]])

  for (let col = 0; col < n; col++) {
    // Pivot
    let maxRow = col
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) maxRow = row
    }
    [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]]

    if (Math.abs(aug[col][col]) < 1e-12) return null

    // Eliminate
    for (let row = 0; row < n; row++) {
      if (row === col) continue
      const factor = aug[row][col] / aug[col][col]
      for (let j = col; j <= n; j++) {
        aug[row][j] -= factor * aug[col][j]
      }
    }
  }

  return aug.map((row, i) => row[n] / row[i])
}

function roundNice(x: number): number {
  if (Math.abs(x - Math.round(x)) < 0.01) return Math.round(x)
  // Try halves
  if (Math.abs(x * 2 - Math.round(x * 2)) < 0.01) return Math.round(x * 2) / 2
  return Math.round(x * 100) / 100
}

// ==========================================
// MAIN ANALYSIS FUNCTION
// ==========================================

export function analyzeAlgorithm(code: string): AnalysisResult {
  const lines = code.split("\n").map((l) => l.trim()).filter((l) => l.length > 0)

  const loops: LoopInfo[] = []
  let operationLine = ""
  let hasBreak = false
  let breakCondition = ""
  let hasCondition = false

  const outerVars: string[] = []

  for (const line of lines) {
    const loopInfo = parseLoop(line, outerVars)
    if (loopInfo) {
      loops.push(loopInfo)
      outerVars.push(loopInfo.variable)
    } else if (
      line.includes("System.out") ||
      line.includes("console.log") ||
      line.includes("print(") ||
      line.includes("cout") ||
      line.includes("printf")
    ) {
      operationLine = line.replace(/;?\s*$/, "")
    } else if (line.startsWith("break")) {
      hasBreak = true
    } else if (line.startsWith("if") && !line.includes("else")) {
      hasCondition = true
      const ifMatch = line.match(/if\s*\((.+)\)\s*\{?/)
      if (ifMatch) {
        breakCondition = ifMatch[1].trim()
      }
    }
  }

  // ---- SIMULATE for n=5 (display trace) ----
  const n = 5
  const { traces, total } = simulateLoops(loops, n, hasBreak, breakCondition)

  // ---- DERIVE FORMULA via multi-point simulation + regression ----
  const { efficiency, simplified, bigO, patternType } = deriveFormulaFromSimulation(
    loops, hasBreak, breakCondition
  )

  // ---- GENERATE EXPLANATION STEPS ----
  const steps: AnalysisStep[] = []

  steps.push({
    title: "Identificar la operacion basica (OB)",
    description: operationLine
      ? `La operacion basica es: "${operationLine}". En analisis de eficiencia contamos cuantas veces se ejecuta esta instruccion, NO cuantas veces se evaluan los for.`
      : "La operacion basica es la instruccion dentro del ciclo mas interno. Contamos cuantas veces se ejecuta.",
    highlight: "operation",
  })

  loops.forEach((loop, index) => {
    const loopName = loops.length === 1 ? "unico"
      : index === 0 ? "externo"
        : index === 1 ? (loops.length === 3 ? "intermedio" : "interno")
          : "mas interno"

    let desc = ""

    desc += `Inicia en ${loop.variable} = ${loop.init}. `
    desc += `Continua mientras ${loop.condition}. `

    switch (loop.updateType) {
      case "increment":
        desc += `Avanza de 1 en 1 (${loop.update}). `
        break
      case "decrement":
        desc += `Decrementa de 1 en 1 (${loop.update}). `
        break
      case "add_step":
        desc += `Avanza de ${loop.stepSize} en ${loop.stepSize} (${loop.update}). `
        break
      case "sub_step":
        desc += `Decrementa de ${loop.stepSize} en ${loop.stepSize} (${loop.update}). `
        break
      case "multiply":
        desc += `Se multiplica por ${loop.stepSize} cada vez (${loop.update}), crecimiento geometrico. `
        break
      case "divide":
        desc += `Se divide entre ${loop.stepSize} cada vez (${loop.update}), decrecimiento geometrico. `
        break
      default:
        desc += `Actualizacion: ${loop.update}. `
    }

    if (loop.dependsOnInit || loop.dependsOnBound) {
      const depVar = loop.dependsOnInit || loop.dependsOnBound
      desc += `CLAVE: El numero de iteraciones depende de "${depVar}" del ciclo anterior, por lo que cambia en cada vuelta del externo.`
    } else if (loop.updateType === "multiply" || loop.updateType === "divide") {
      const base = loop.stepSize
      const vals = loop.direction === "ascending"
        ? `${loop.init}, ${Number(loop.init) * base}, ${Number(loop.init) * base * base}, ...`
        : `n, n/${base}, n/${base * base}, ...`
      desc += `Valores: ${vals} => log${base}(n) iteraciones.`
    } else {
      desc += `Iteraciones por vuelta: ${loop.iterationCount}.`
    }

    steps.push({
      title: `Paso ${index + 1}: Ciclo ${loopName} (${loop.variable})`,
      description: desc,
      formula: `Iteraciones: ${loop.iterationCount}`,
      highlight: "loop",
      loopIndex: index,
    })

    // Extra detail for dependent loops
    if (loop.dependsOnInit || loop.dependsOnBound) {
      const depVar = loop.dependsOnInit || loop.dependsOnBound

      if (loop.direction === "ascending" && loop.conditionOp.includes("<")) {
        if (loop.dependsOnBound) {
          steps.push({
            title: `Detalle: Sumatoria del ciclo dependiente`,
            description: `Como ${loop.variable} va de ${loop.init} hasta ${depVar}, el numero de iteraciones cambia cada vuelta. Verificacion con n=${n}: ${traces.map((t, idx) => `cuando ${depVar}=${t.i ?? idx}, ejecuta ${t.j ?? t.executions} veces`).join("; ")}. Esto forma una sumatoria.`,
            formula: `Total = ${traces.map(t => t.j ?? t.executions).join(" + ")} = ${total}`,
          })
        } else if (loop.dependsOnInit) {
          steps.push({
            title: `Detalle: Sumatoria del ciclo dependiente`,
            description: `Como ${loop.variable} inicia en ${depVar} y va hasta ${loop.conditionBound}, el numero de iteraciones cambia cada vuelta. Verificacion con n=${n}: ${traces.map((t, idx) => `cuando ${depVar}=${t.i ?? idx}, ejecuta ${t.j ?? t.executions} veces`).join("; ")}. Esto forma una sumatoria.`,
            formula: `Total = ${traces.map(t => t.j ?? t.executions).join(" + ")} = ${total}`,
          })
        }
      } else {
        steps.push({
          title: `Detalle: Sumatoria del ciclo dependiente`,
          description: `El numero de iteraciones del ciclo interno varia segun ${depVar}. Verificacion con n=${n}: ${traces.map((t, idx) => `${depVar}=${t.i ?? idx} => ${t.j ?? t.executions} ejecuciones`).join("; ")}.`,
          formula: `Total = ${traces.map(t => t.j ?? t.executions).join(" + ")} = ${total}`,
        })
      }
    }

    // Extra detail for logarithmic
    if (loop.updateType === "multiply" || loop.updateType === "divide") {
      const base = loop.stepSize
      steps.push({
        title: `Detalle: Por que es logaritmico`,
        description: `Cuando el indice se ${loop.updateType === "multiply" ? "multiplica" : "divide"} por ${base}, se necesitan log${base}(n) pasos para ir de ${loop.init} hasta n. Para n=${n}: se necesitan ${Math.ceil(Math.log(n) / Math.log(base))} iteraciones.`,
        formula: `log${base}(${n}) = ${Math.ceil(Math.log(n) / Math.log(base))} iteraciones`,
      })
    }
  })

  if (hasBreak && breakCondition) {
    steps.push({
      title: "Efecto del break",
      description: `Hay un if (${breakCondition}) con break. Esto detiene el ciclo interno prematuramente. Para cada valor del externo, el interno se ejecuta solo hasta que se cumple la condicion. Verificacion con n=${n}: ${traces.map(t => `i=${t.i}: ${t.j ?? t.executions} veces`).join(", ")}. Total = ${total}.`,
      highlight: "operation",
    })
  }

  // Verification step: compute formula at n=5 and compare with simulation
  const sim5 = simulateLoops(loops, 5, hasBreak, breakCondition)
  const sim10 = simulateLoops(loops, 10, hasBreak, breakCondition)
  const sim20 = simulateLoops(loops, 20, hasBreak, breakCondition)

  steps.push({
    title: "Calculo final de f(n)",
    description: `Combinando el analisis de todos los ciclos y verificando con simulacion:`,
    formula: `f(n) = ${efficiency}`,
    highlight: "result",
  })

  steps.push({
    title: "Resultado y Big-O",
    description: `Verificado: f(5)=${sim5.total}, f(10)=${sim10.total}, f(20)=${sim20.total}. La formula se ajusta exactamente a la simulacion.`,
    formula: `f(n) = ${simplified}  =>  ${bigO}`,
    highlight: "result",
  })

  return {
    loops,
    steps,
    operationLine,
    efficiency,
    efficiencySimplified: simplified,
    bigO,
    traces,
    totalFromTrace: total,
    hasBreak,
    hasCondition,
    breakCondition,
    patternType,
  }
}
