'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, QrCode, Settings, Upload, Trash2, Download, Loader2 } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout'
import { QRUploader } from '@/components/qr'
import { UploadZone } from '@/components/photo'
import { PhotoGrid, PhotoLightbox } from '@/components/photo'
import { Button } from '@/components/ui'
import { Progress } from '@/components/ui'
import { formatBytes } from '@/lib/utils'
import { trpc } from '@/lib/trpc-client'
import { usePusher } from '@/hooks/usePusher'
import JSZip from 'jszip'

export default function ManageEventPage() {
  const params = useParams()
  const eventId = params.eventId as string
  const { data: session } = useSession()
  const router = useRouter()
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const { data: event, isLoading: eventLoading } = trpc.event.get.useQuery(
    { id: eventId },
    { enabled: !!eventId }
  )

  const utils = trpc.useUtils()

  usePusher(
    eventId ? `event-${eventId}` : null,
    ['photo-added', 'reaction-added', 'reaction-removed', 'vote-cast', 'vote-removed'],
    () => {
      utils.event.get.invalidate({ id: eventId })
    }
  )

  const deleteEvent = trpc.event.delete.useMutation({
    onSuccess: () => {
      router.push('/dashboard')
    },
  })

  const downloadUrls = trpc.photo.getDownloadUrls.useMutation()

  const handleDownloadAll = async () => {
    const zip = new JSZip()
    const folder = zip.folder('photos') || zip.folder('')

    const urls = await downloadUrls.mutateAsync({ eventId })

    const photoFetches = urls.urls
      .filter((photo) => !!photo.downloadUrl)
      .map(async (photo) => {
        try {
          const response = await fetch(photo.downloadUrl!)
          const blob = await response.blob()
          const ext = photo.url.split('.').pop() || 'jpg'
          folder?.file(`photo-${photo.id.slice(0, 8)}.${ext}`, blob)
        } catch (err) {
          console.error('Failed to fetch photo:', photo.id, err)
        }
      })

    await Promise.all(photoFetches)

    const blob = await zip.generateAsync({ type: 'blob' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${event?.name || 'event'}-photos.zip`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const openLightbox = (photo: any, index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  if (eventLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-100">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-100">
        <div className="text-center">
          <p className="text-warm-600 mb-4">Evento non trovato</p>
          <Link href="/dashboard">
            <Button variant="secondary">Torna alla dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  const photos = event.photos || []
  const totalStorageUsed = photos.reduce((sum, p) => sum + p.size, 0)
  const totalReactions = photos.reduce((sum, p) => sum + p.reactions.length, 0)

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      deleteEvent.mutate({ id: eventId })
    }
  }

  return (
    <div className="min-h-screen bg-cream-100 flex">
      <Sidebar user={{
        name: session?.user?.name,
        email: session?.user?.email,
        image: session?.user?.image,
        tier: (session as any)?.subscriptionTier || 'FREE'
      }} />

      <main className="flex-1 p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/dashboard"
            className="p-2 rounded-xl hover:bg-warm-200 text-warm-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-bold text-charcoal">{event.name}</h1>
            <p className="text-sm text-warm-500">
               Gestione evento
            </p>
          </div>
          <Link href={`/events/${eventId}`}>
            <Button variant="secondary">
              <QrCode className="w-4 h-4" />
              Vedi galleria
            </Button>
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upload */}
            <div className="bg-cream-100 rounded-2xl border border-warm-300/40 overflow-hidden">
              <div className="px-6 py-4 border-b border-warm-300/40">
                <h2 className="font-semibold flex items-center gap-2 text-charcoal">
                  <Upload className="w-5 h-5" />
                  Carica foto
                </h2>
              </div>
              <div className="p-6">
                <UploadZone eventId={eventId} />
              </div>
            </div>

            {/* Photos */}
            <div className="bg-cream-100 rounded-2xl border border-warm-300/40 overflow-hidden">
              <div className="px-6 py-4 border-b border-warm-300/40 flex items-center justify-between">
                <h2 className="font-semibold text-charcoal">Foto ({photos.length})</h2>
                {photos.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={handleDownloadAll}>
                    <Download className="w-4 h-4" />
                    Scarica tutto
                  </Button>
                )}
              </div>
              <div className="p-6">
                {photos.length > 0 ? (
                  <PhotoGrid photos={photos} onPhotoClick={openLightbox} />
                ) : (
                  <div className="text-center py-12">
                    <p className="text-warm-500">Nessuna foto caricata ancora</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            {/* QR — Always visible sticky card */}
            <div className="bg-gradient-to-br from-coral/5 via-white to-gold/5 rounded-2xl border-2 border-coral/20 shadow-glow overflow-hidden">
              <div className="px-6 py-4 border-b border-coral/10 bg-white/50">
                <h2 className="font-semibold text-charcoal flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-coral" />
                  Condividi QR Code
                </h2>
              </div>
              <div className="p-4">
                <QRUploader
                  eventId={eventId}
                  eventName={event.name}
                  tier={(session as any)?.subscriptionTier || 'FREE'}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="bg-cream-100 rounded-2xl border border-warm-300/40 overflow-hidden">
              <div className="px-6 py-4 border-b border-warm-300/40">
                <h2 className="font-semibold text-charcoal">Statistiche</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between">
                  <span className="text-warm-600 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    Visualizzazioni
                  </span>
                  <span className="font-mono font-medium">{event.views}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-warm-600 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-secondary" />
                    Foto
                  </span>
                  <span className="font-mono font-medium">{photos.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-warm-600 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-accent" />
                    Reazioni
                  </span>
                  <span className="font-mono font-medium">{totalReactions}</span>
                </div>
                <hr className="border-warm-300/40" />
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-warm-600">Spazio</span>
                    <span className="font-mono">
                      {formatBytes(totalStorageUsed)} / {formatBytes(event.storageLimit)}
                    </span>
                  </div>
                  <Progress
                    value={event.storageLimit > 0 ? (totalStorageUsed / event.storageLimit) * 100 : 0}
                    size="sm"
                  />
                </div>
              </div>
            </div>

            {/* Danger zone */}
            <div className="bg-cream-100 rounded-2xl border border-red-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-red-100 bg-red-50">
                <h2 className="font-semibold text-red-700">Zona pericolosa</h2>
              </div>
              <div className="p-6">
                <Button
                  variant="danger"
                  className="w-full"
                  onClick={handleDelete}
                  loading={deleteEvent.isPending}
                >
                  <Trash2 className="w-4 h-4" />
                  Elimina evento
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {lightboxOpen && photos.length > 0 && (
        <PhotoLightbox
          photos={photos}
          initialIndex={lightboxIndex}
          open={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          currentUserId={session?.user?.id}
        />
      )}
    </div>
  )
}
