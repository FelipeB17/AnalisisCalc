"use client"

interface ExampleExercisesProps {
  onSelect: (code: string) => void
}

const exercises = [
  {
    title: "Ciclo lineal simple",
    complexity: "O(n)",
    code: `for (int i = 0; i < n; i++) {\n    System.out.println(i);\n}`,
  },
  {
    title: "Doble ciclo independiente",
    complexity: "O(n^2)",
    code: `for (int i = 0; i < n; i++) {\n    for (int j = 0; j < n; j++) {\n        System.out.println(i * j);\n    }\n}`,
  },
  {
    title: "Ciclo dependiente (j < i)",
    complexity: "O(n^2)",
    code: `for (int i = 0; i < n; i++) {\n    for (int j = 0; j < i; j++) {\n        System.out.println(i + j);\n    }\n}`,
  },
  {
    title: "Dependiente (j = i hasta n)",
    complexity: "O(n^2)",
    code: `for (int i = 0; i < n; i++) {\n    for (int j = i; j < n; j++) {\n        System.out.println(i + j);\n    }\n}`,
  },
  {
    title: "Lineal + logaritmico",
    complexity: "O(n log n)",
    code: `for (int i = 0; i < n; i++) {\n    for (int j = 1; j < n; j = j * 2) {\n        System.out.println(i + j);\n    }\n}`,
  },
  {
    title: "Descendente dependiente",
    complexity: "O(n^2)",
    code: `for (int i = n; i > 0; i--) {\n    for (int j = 0; j < i; j++) {\n        System.out.println(i + j);\n    }\n}`,
  },
  {
    title: "Saltos (i+=2, j+=3)",
    complexity: "O(n^2)",
    code: `for (int i = 0; i < n; i+=2) {\n    for (int j = 0; j < n; j+=3) {\n        System.out.println(i + j);\n    }\n}`,
  },
  {
    title: "Doble logaritmico",
    complexity: "O((log n)^2)",
    code: `for (int i = 1; i < n; i *= 2) {\n    for (int j = 1; j < n; j *= 2) {\n        System.out.println(i + j);\n    }\n}`,
  },
  {
    title: "Break condicional (j == i)",
    complexity: "O(n^2)",
    code: `for (int i = 0; i < n; i++) {\n    for (int j = 0; j < n; j++) {\n        if (j == i) {\n            break;\n        }\n        System.out.println(i + j);\n    }\n}`,
  },
  {
    title: "Triple independiente",
    complexity: "O(n^3)",
    code: `for (int i = 0; i < n; i++) {\n    for (int j = 0; j < n; j++) {\n        for (int k = 0; k < n; k++) {\n            System.out.println(i + j + k);\n        }\n    }\n}`,
  },
  {
    title: "Triple con logaritmo",
    complexity: "O(n^2 log n)",
    code: `for (int i = 0; i < n; i++) {\n    for (int j = i; j < n; j++) {\n        for (int k = 1; k < n; k *= 2) {\n            System.out.println(i + j + k);\n        }\n    }\n}`,
  },
  {
    title: "Logaritmico simple",
    complexity: "O(log n)",
    code: `for (int i = 1; i < n; i *= 2) {\n    System.out.println(i);\n}`,
  },
]

export function ExampleExercises({ onSelect }: ExampleExercisesProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {exercises.map((ex, idx) => (
        <button
          key={idx}
          onClick={() => onSelect(ex.code)}
          className="group flex items-center justify-between gap-3 px-4 py-3 rounded-lg border border-border bg-card hover:border-primary/30 hover:bg-card/80 transition-all text-left"
        >
          <span className="text-sm text-foreground group-hover:text-primary transition-colors truncate">
            {ex.title}
          </span>
          <span className="text-[11px] font-mono text-muted-foreground flex-shrink-0">
            {ex.complexity}
          </span>
        </button>
      ))}
    </div>
  )
}
