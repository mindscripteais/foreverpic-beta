'use client'

import { useState } from 'react'
import Link from 'next/link'
import { QrCode, Download, Copy, Check, X, ExternalLink, ArrowRight, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { trpc } from '@/lib/trpc-client'
import { Loader2 } from 'lucide-react'

interface EventCreatedModalProps {
  eventId: string | null
  eventName: string
  open: boolean
  onClose: () => void
}

export function EventCreatedModal({ eventId, eventName, open, onClose }: EventCreatedModalProps) {
  const [copied, setCopied] = useState(false)

  const { data: qrData, isLoading } = trpc.qr.generate.useQuery(
    { eventId: eventId! },
    { enabled: !!eventId }
  )

  const generatePng = trpc.qr.generatePNG.useMutation()

  const eventUrl = typeof window !== 'undefined' && eventId
    ? `${window.location.origin}/events/${eventId}`
    : ''

  const handleDownloadPNG = async () => {
    if (!eventId) return
    if (generatePng.data?.png) {
      const link = document.createElement('a')
      link.href = generatePng.data.png
      link.download = `${eventName || 'event'}-qr.png`
      link.click()
      return
    }
    const result = await generatePng.mutateAsync({ eventId, size: 800 })
    if (result.png) {
      const link = document.createElement('a')
      link.href = result.png
      link.download = `${eventName || 'event'}-qr.png`
      link.click()
    }
  }

  const handleDownloadSVG = () => {
    if (!qrData?.svg) return
    const blob = new Blob([qrData.svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${eventName || 'event'}-qr.svg`
    link.click()
    URL.revokeObjectURL(url)
  }

  const copyLink = async () => {
    if (!eventUrl) return
    await navigator.clipboard.writeText(eventUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!open) return null

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <div className="p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-coral to-gold rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
            <Share2 className="w-8 h-8 text-white" />
          </div>
          <h2 className="font-display text-2xl font-bold text-charcoal mb-2">
            Evento creato!
          </h2>
          <p className="text-warm-600">
            Condividi questo QR code con i tuoi ospiti così possono caricare foto.
          </p>
        </div>

        {/* Event Name */}
        <div className="bg-cream-100 rounded-xl border border-warm-300/40 p-4 mb-6 text-center">
          <p className="text-sm text-warm-500 mb-1">Il tuo evento</p>
          <p className="font-display text-lg font-semibold text-charcoal">{eventName}</p>
        </div>

        {/* QR Preview */}
        <div className="bg-white rounded-2xl border border-warm-300/30 p-6 mb-6 text-center">
          {isLoading ? (
            <div className="w-48 h-48 mx-auto bg-warm-100 rounded-2xl flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-coral" />
            </div>
          ) : qrData?.svg ? (
            <div className="space-y-4">
              <div className="relative mx-auto bg-white p-4 rounded-2xl shadow-soft inline-block">
                <div
                  className="w-48 h-48"
                  dangerouslySetInnerHTML={{ __html: qrData.svg }}
                />
              </div>
              <p className="text-xs text-warm-500 font-mono break-all">{qrData.url}</p>
            </div>
          ) : (
            <div className="w-48 h-48 mx-auto bg-warm-100 rounded-2xl flex items-center justify-center">
              <QrCode className="w-16 h-16 text-warm-400" />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Button
            variant="secondary"
            onClick={handleDownloadPNG}
            disabled={isLoading || !qrData?.svg}
            loading={generatePng.isPending}
          >
            <Download className="w-4 h-4" />
            PNG
          </Button>
          <Button
            variant="secondary"
            onClick={handleDownloadSVG}
            disabled={isLoading || !qrData?.svg}
          >
            <Download className="w-4 h-4" />
            SVG
          </Button>
        </div>

        <div className="space-y-3">
          <Button variant="secondary" className="w-full" onClick={copyLink}>
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Link copiato!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copia link galleria
              </>
            )}
          </Button>

          <Link href={eventId ? `/manage/${eventId}` : '/dashboard'} className="block">
            <Button variant="primary" className="w-full">
              <ArrowRight className="w-4 h-4" />
              Vai alla dashboard evento
            </Button>
          </Link>
        </div>
      </div>
    </Modal>
  )
}
