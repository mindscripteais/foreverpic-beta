'use client'

import { useState } from 'react'
import { QrCode, Download, Copy, Check, Loader2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { trpc } from '@/lib/trpc-client'

interface QRUploaderProps {
  eventId: string
  eventName?: string
  tier?: 'FREE' | 'PRO' | 'ENTERPRISE'
}

export function QRUploader({ eventId, eventName, tier = 'FREE' }: QRUploaderProps) {
  const [copied, setCopied] = useState(false)
  const [downloadedPng, setDownloadedPng] = useState(false)

  const { data: qrData, isLoading } = trpc.qr.generate.useQuery(
    { eventId },
    { enabled: !!eventId }
  )

  const generatePng = trpc.qr.generatePNG.useMutation()

  const eventUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/events/${eventId}`
    : `/events/${eventId}`

  const handleDownloadPNG = async () => {
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
    await navigator.clipboard.writeText(eventUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isWatermarked = tier === 'FREE'

  return (
    <div className="bg-cream-100 rounded-2xl border border-warm-300/40 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-warm-300/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-coral/10 flex items-center justify-center">
            <QrCode className="w-5 h-5 text-coral" />
          </div>
          <div>
            <h3 className="font-semibold text-charcoal">QR Code</h3>
            <p className="text-sm text-warm-500">Condividilo con i tuoi ospiti</p>
          </div>
        </div>
        {isWatermarked && <Badge variant="warning">Con watermark</Badge>}
      </div>

      {/* QR Preview */}
      <div className="p-6">
        {isLoading ? (
          <div className="w-48 h-48 mx-auto bg-warm-200 rounded-2xl flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-coral" />
          </div>
        ) : qrData?.svg ? (
          <div className="text-center">
            <div className="relative mx-auto bg-white p-4 rounded-2xl shadow-soft inline-block">
              <div
                className="w-48 h-48"
                dangerouslySetInnerHTML={{ __html: qrData.svg }}
              />
            </div>
            <p className="text-xs text-warm-500 mt-3 font-mono break-all">{qrData.url}</p>
          </div>
        ) : (
          <div className="w-48 h-48 mx-auto bg-warm-200 rounded-2xl flex items-center justify-center">
            <QrCode className="w-16 h-16 text-warm-400" />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-6 pb-6 space-y-3">
        <Button
          variant="secondary"
          className="w-full"
          onClick={handleDownloadPNG}
          disabled={isLoading || !qrData?.svg}
          loading={generatePng.isPending}
        >
          <Download className="w-4 h-4" />
          Scarica PNG
        </Button>

        <Button
          variant="secondary"
          className="w-full"
          onClick={handleDownloadSVG}
          disabled={isLoading || !qrData?.svg}
        >
          <Download className="w-4 h-4" />
          Scarica SVG
        </Button>

        <Button variant="secondary" className="w-full" onClick={copyLink}>
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              Copiato!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copia link
            </>
          )}
        </Button>

        <a
          href={eventUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-charcoal bg-warm-200/50 hover:bg-warm-200 rounded-xl transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Apri galleria
        </a>
      </div>

      {/* Footer info */}
      {isWatermarked && (
        <div className="px-6 pb-6">
          <p className="text-xs text-warm-500 text-center">
            Il piano Free include QR code con watermark.{' '}
            <a href="/settings" className="text-coral hover:underline">
              Passa a Pro
            </a>{' '}
            per QR puliti.
          </p>
        </div>
      )}
    </div>
  )
}
