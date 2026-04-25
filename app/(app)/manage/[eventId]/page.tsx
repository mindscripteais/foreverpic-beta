'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, QrCode, Settings, Upload, Trash2, Download, Loader2, Image as ImageIcon, ChevronDown, UserPlus, X } from 'lucide-react'
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
  const [coverUploading, setCoverUploading] = useState(false)
  const [collabEmail, setCollabEmail] = useState('')
  const [collabError, setCollabError] = useState<string | null>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const updateEvent = trpc.event.update.useMutation({
    onSuccess: () => {
      utils.event.get.invalidate({ id: eventId })
    },
  })

  const { data: event, isLoading: eventLoading } = trpc.event.get.useQuery(
    { id: eventId },
    { enabled: !!eventId }
  )

  const {
    data: photosData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: photosLoading,
  } = trpc.photo.list.useInfiniteQuery(
    { eventId, limit: 20 },
    {
      enabled: !!eventId,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  )

  const photos = photosData?.pages.flatMap((page) => page.photos) || []

  const utils = trpc.useUtils()

  const { data: collaborators } = trpc.event.getCollaborators.useQuery(
    { eventId },
    { enabled: !!eventId }
  )

  const addCollaborator = trpc.event.addCollaborator.useMutation({
    onSuccess: () => {
      utils.event.getCollaborators.invalidate({ eventId })
      setCollabEmail('')
      setCollabError(null)
    },
    onError: (err) => setCollabError(err.message),
  })

  const removeCollaborator = trpc.event.removeCollaborator.useMutation({
    onSuccess: () => utils.event.getCollaborators.invalidate({ eventId }),
  })

  usePusher(
    eventId ? `event-${eventId}` : null,
    ['photo-added', 'reaction-added', 'reaction-removed', 'vote-cast', 'vote-removed'],
    () => {
      utils.photo.list.invalidate({ eventId, limit: 20 })
    }
  )

  // Auto-load more on scroll
  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage()
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(loadMoreRef.current)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

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

  const isLoading = eventLoading || photosLoading

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-100">
        <Loader2 className="w-8 h-8 animate-spin text-coral" />
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

  const totalStorageUsed = photos.reduce((sum, p) => sum + p.size, 0)
  const totalReactions = photos.reduce((sum, p) => sum + p.reactions.length, 0)

  const handleDelete = () => {
    if (confirm('Sei sicuro di voler eliminare questo evento? Questa azione non può essere annullata.')) {
      deleteEvent.mutate({ id: eventId })
    }
  }

  const handleCoverUpload = async (file: File) => {
    if (!file || !eventId) return
    setCoverUploading(true)
    try {
      const key = `events/${eventId}/cover`
      const formData = new FormData()
      formData.append('file', file)
      formData.append('eventId', eventId)
      formData.append('key', key)

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')

      updateEvent.mutate({ id: eventId, coverImage: data.url })
    } catch (err: any) {
      alert('Errore caricamento copertina: ' + err.message)
    } finally {
      setCoverUploading(false)
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
                <UploadZone
                  eventId={eventId}
                  onUploadComplete={() => {
                    utils.photo.list.invalidate({ eventId, limit: 20 })
                  }}
                />
              </div>
            </div>

            {/* Photos */}
            <div className="bg-cream-100 rounded-2xl border border-warm-300/40 overflow-hidden">
              <div className="px-6 py-4 border-b border-warm-300/40 flex items-center justify-between">
                <h2 className="font-semibold text-charcoal">Foto ({event._count?.photos ?? photos.length})</h2>
                {photos.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={handleDownloadAll}>
                    <Download className="w-4 h-4" />
                    Scarica tutto
                  </Button>
                )}
              </div>
              <div className="p-6">
                {photos.length > 0 ? (
                  <>
                    <PhotoGrid photos={photos} onPhotoClick={openLightbox} />
                    {/* Load more trigger */}
                    <div ref={loadMoreRef} className="py-6 text-center">
                      {isFetchingNextPage && (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="w-6 h-6 animate-spin text-coral" />
                          <p className="text-sm text-warm-500">Caricamento foto...</p>
                        </div>
                      )}
                      {hasNextPage && !isFetchingNextPage && (
                        <button
                          onClick={() => fetchNextPage()}
                          className="inline-flex items-center gap-2 text-sm text-warm-600 hover:text-coral transition-colors"
                        >
                          <ChevronDown className="w-4 h-4" />
                          Carica altre foto
                        </button>
                      )}
                    </div>
                  </>
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
            {/* Cover Image */}
            <div className="bg-cream-100 rounded-2xl border border-warm-300/40 overflow-hidden">
              <div className="px-6 py-4 border-b border-warm-300/40">
                <h2 className="font-semibold text-charcoal flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-coral" />
                  Copertina
                </h2>
              </div>
              <div className="p-4">
                {event.coverImage ? (
                  <div className="relative group">
                    <img
                      src={event.coverImage}
                      alt="Copertina evento"
                      className="w-full h-40 object-cover rounded-xl"
                    />
                    <button
                      onClick={() => coverInputRef.current?.click()}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-sm font-medium rounded-xl transition-opacity"
                    >
                      Cambia
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => coverInputRef.current?.click()}
                    className="w-full h-40 border-2 border-dashed border-warm-300 rounded-xl flex flex-col items-center justify-center text-warm-500 hover:border-coral hover:text-coral transition-colors"
                  >
                    <ImageIcon className="w-8 h-8 mb-2" />
                    <span className="text-sm font-medium">Aggiungi copertina</span>
                  </button>
                )}
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleCoverUpload(file)
                    e.target.value = ''
                  }}
                />
                {coverUploading && (
                  <p className="text-xs text-warm-500 mt-2 text-center">Caricamento...</p>
                )}
              </div>
            </div>

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
                    <span className="w-2 h-2 rounded-full bg-coral" />
                    Visualizzazioni
                  </span>
                  <span className="font-mono font-medium">{event.views}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-warm-600 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gold" />
                    Foto
                  </span>
                  <span className="font-mono font-medium">{event._count?.photos ?? photos.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-warm-600 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-success" />
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

            {/* Collaborators */}
            <div className="bg-cream-100 rounded-2xl border border-warm-300/40 overflow-hidden">
              <div className="px-6 py-4 border-b border-warm-300/40">
                <h2 className="font-semibold text-charcoal flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-coral" />
                  Collaboratori
                </h2>
              </div>
              <div className="p-4 space-y-4">
                {/* Add collaborator */}
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Email del collaboratore"
                    value={collabEmail}
                    onChange={(e) => { setCollabEmail(e.target.value); setCollabError(null) }}
                    className="flex-1 px-3 py-2 rounded-xl border border-warm-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-coral/50 focus:border-coral"
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      if (!collabEmail.trim()) return
                      addCollaborator.mutate({ eventId, email: collabEmail.trim() })
                    }}
                    loading={addCollaborator.isPending}
                  >
                    Aggiungi
                  </Button>
                </div>
                {collabError && (
                  <p className="text-xs text-coral">{collabError}</p>
                )}

                {/* List */}
                <div className="space-y-2">
                  {collaborators && collaborators.length > 0 ? (
                    collaborators.map((c) => (
                      <div key={c.id} className="flex items-center justify-between p-2 rounded-xl bg-warm-100">
                        <div className="flex items-center gap-2 min-w-0">
                          {c.image ? (
                            <img src={c.image} alt="" className="w-7 h-7 rounded-lg object-cover" />
                          ) : (
                            <div className="w-7 h-7 rounded-lg bg-coral/10 flex items-center justify-center text-coral text-xs font-bold">
                              {(c.name || c.email)?.[0]?.toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{c.name || '—'}</p>
                            <p className="text-xs text-warm-500 truncate">{c.email}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeCollaborator.mutate({ eventId, userId: c.id })}
                          className="p-1.5 rounded-lg hover:bg-coral/10 text-warm-500 hover:text-coral transition-colors"
                          title="Rimuovi"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-warm-500 text-center py-2">Nessun collaboratore</p>
                  )}
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
