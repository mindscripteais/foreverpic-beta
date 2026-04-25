'use client'

import { useEffect } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Button } from './button'

interface ErrorFallbackProps {
  error: Error & { digest?: string }
  reset: () => void
  variant?: 'light' | 'dark'
}

export function ErrorFallback({ error, reset, variant = 'light' }: ErrorFallbackProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  const isDark = variant === 'dark'

  return (
    <div className={`min-h-screen flex items-center justify-center px-6 ${isDark ? 'bg-charcoal text-cream-100' : 'bg-cream-100 text-charcoal'}`}>
      <div className="text-center max-w-md">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 ${isDark ? 'bg-coral/10' : 'bg-coral/10'}`}>
          <AlertTriangle className="w-8 h-8 text-coral" />
        </div>
        <h1 className="font-display text-2xl font-bold mb-2">
          Qualcosa è andato storto
        </h1>
        <p className={`text-sm mb-6 ${isDark ? 'text-warm-500' : 'text-warm-600'}`}>
          Si è verificato un errore imprevisto. Riprova o torna alla home.
        </p>
        {error.digest && (
          <p className={`text-xs font-mono mb-6 ${isDark ? 'text-warm-600' : 'text-warm-400'}`}>
            Ref: {error.digest}
          </p>
        )}
        <div className="flex items-center justify-center gap-3">
          <Button onClick={reset} className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            Riprova
          </Button>
          <Button variant="secondary" onClick={() => window.location.href = '/'}>
            Torna alla home
          </Button>
        </div>
      </div>
    </div>
  )
}
