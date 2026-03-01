import type { Metadata, Viewport } from 'next'
import { JetBrains_Mono, Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const _jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

export const metadata: Metadata = {
  title: 'Analizador de Algoritmos - Calcula f(n) paso a paso',
  description: 'Herramienta interactiva para analizar la eficiencia de algoritmos con ciclos anidados. Aprende a calcular f(n) paso a paso.',

}

export const viewport: Viewport = {
  themeColor: '#1a1a2e',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`${_inter.variable} ${_jetbrains.variable} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
