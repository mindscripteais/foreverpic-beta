'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

export function CookieBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) setShow(true)
  }, [])

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted')
    setShow(false)
  }

  const handleDecline = () => {
    localStorage.setItem('cookie-consent', 'declined')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 bg-cream-100 border border-warm-300/40 rounded-2xl shadow-elevated p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-sm text-charcoal mb-1">Gestione cookie</p>
          <p className="text-xs text-warm-600 leading-relaxed">
            Utilizziamo cookie essenziali per il funzionamento del sito e cookie analitici per migliorare l'esperienza.
            Consulta la nostra <a href="/privacy" className="text-coral underline">Privacy Policy</a> per maggiori informazioni.
          </p>
        </div>
        <button onClick={handleDecline} className="text-warm-500 hover:text-charcoal">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex gap-2 mt-4">
        <button
          onClick={handleAccept}
          className="flex-1 bg-coral text-white text-sm font-semibold py-2 rounded-xl hover:bg-coral/90 transition-colors"
        >
          Accetta tutti
        </button>
        <button
          onClick={handleDecline}
          className="flex-1 bg-warm-200 text-charcoal text-sm font-semibold py-2 rounded-xl hover:bg-warm-300 transition-colors"
        >
          Rifiuta
        </button>
      </div>
    </div>
  )
}
