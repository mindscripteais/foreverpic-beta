'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Heart, Award, Download, Upload, Users, Loader2, Sparkles, Camera, Share2, Link as LinkIcon, MessageCircle } from 'lucide-react'
import JSZip from 'jszip'
import { Button } from '@/components/ui'
import { PhotoGrid, PhotoLightbox } from '@/components/photo'
import { UploadZone } from '@/components/photo'
import { trpc } from '@/lib/trpc-client'
import { formatDate } from '@/lib/utils'
import { usePusher } from '@/hooks/usePusher'

export default function EventGalleryPage() {
  const params = useParams()
  const eventId = params.eventId as string
  const { data: session } = useSession()
  const isLoggedIn = !!session?.user

  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [uploadedCount, setUploadedCount] = useState(0)
  const [showUploader, setShowUploader] = useState(false)
  const [guestName, setGuestName] = useState('')
  const [copied, setCopied] = useState(false)

  const { data: event, isLoading: eventLoading, error } = trpc.event.get.useQuery(
    { id: eventId },
    { enabled: !!eventId }
  )

  const isOwner = isLoggedIn && session?.user?.id === event?.owner?.id
  const galleryUrl = typeof window !== 'undefined' ? window.location.href : ''

  const utils = trpc.useUtils()

  usePusher(
    eventId ? `event-${eventId}` : null,
    ['photo-added', 'reaction-added', 'reaction-removed', 'vote-cast', 'vote-removed'],
    () => {
      utils.event.get.invalidate({ id: eventId })
    }
  )

  const totalReactions = event?.photos?.reduce((sum, p) => sum + p.reactions.length, 0) || 0
  const totalVotes = event?.photos?.reduce((sum, p) => sum + p.votes.length, 0) || 0

  const openLightbox = (photo: any, index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  const handleUploadComplete = (results: { id: string; url: string }[]) => {
    setUploadedCount((c) => c + results.length)
    setShowUploader(false)
    // Invalidate cache so new photos appear immediately
    utils.event.get.invalidate({ id: eventId })
  }

  const downloadUrls = trpc.photo.getDownloadUrls.useMutation()

  const addReaction = trpc.reaction.add.useMutation({
    onSuccess: () => utils.event.get.invalidate({ id: eventId }),
  })
  const removeReaction = trpc.reaction.remove.useMutation({
    onSuccess: () => utils.event.get.invalidate({ id: eventId }),
  })
  const castVote = trpc.vote.cast.useMutation({
    onSuccess: () => utils.event.get.invalidate({ id: eventId }),
  })
  const removeVote = trpc.vote.remove.useMutation({
    onSuccess: () => utils.event.get.invalidate({ id: eventId }),
  })

  const handleReact = (photoId: string, type: string) => {
    if (!session?.user?.id) return
    const photo = event?.photos?.find((p) => p.id === photoId)
    const hasReacted = photo?.reactions?.some((r) => r.userId === session.user.id && r.type === type)
    const reactionType = type as 'LOVE' | 'LAUGH' | 'WOW' | 'HEART' | 'FIRE'
    if (hasReacted) {
      removeReaction.mutate({ photoId, type: reactionType })
    } else {
      addReaction.mutate({ photoId, type: reactionType })
    }
  }

  const handleVote = (photoId: string) => {
    if (!session?.user?.id) return
    const photo = event?.photos?.find((p) => p.id === photoId)
    const hasVoted = photo?.votes?.some((v) => v.userId === session.user.id)
    if (hasVoted) {
      removeVote.mutate({ photoId })
    } else {
      castVote.mutate({ photoId })
    }
  }

  const handleDownloadAll = async () => {
    const zip = new JSZip()
    const folder = zip.folder('photos') || zip

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

  const handleShare = async () => {
    const shareData = {
      title: event?.name || 'Galleria ForeverPic',
      text: `Guarda le foto di ${event?.name} su ForeverPic!`,
      url: galleryUrl,
    }
    if (navigator.share) {
      try { await navigator.share(shareData) } catch {}
    } else {
      handleCopyLink()
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(galleryUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`Guarda le foto di ${event?.name} su ForeverPic: ${galleryUrl}`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  if (eventLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-coral border-t-transparent rounded-full animate-spin" />
          <p className="text-warm-600 text-sm">Caricamento galleria...</p>
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-100">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-20 h-20 bg-warm-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Camera className="w-10 h-10 text-warm-400" />
          </div>
          <h1 className="font-display text-2xl font-bold text-charcoal mb-2">Galleria non trovata</h1>
          <p className="text-warm-600 mb-6">Questo evento potrebbe essere scaduto o il QR code non è valido.</p>
          <Link href="/">
            <Button variant="secondary">Vai alla homepage</Button>
          </Link>
        </div>
      </div>
    )
  }

  const photos = event.photos || []

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-100 to-white">
      {/* Header */}
      <header className="bg-cream-100/80 backdrop-blur-md border-b border-warm-300/40 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href={isLoggedIn ? '/dashboard' : '/'} className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-gradient-to-br from-coral to-gold rounded-xl group-hover:scale-105 transition-transform" />
              <span className="font-display text-xl font-semibold text-charcoal">ForeverPic</span>
            </Link>
            {photos.length > 0 && isOwner && (
              <Button variant="secondary" size="sm" className="shadow-soft" onClick={handleDownloadAll}>
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Scarica</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Event Hero */}
      <section className="relative overflow-hidden">
        {/* Cover image background */}
        {event.coverImage && (
          <div className="absolute inset-0">
            <img
              src={event.coverImage}
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-charcoal/60 backdrop-blur-[2px]" />
          </div>
        )}
        {/* Decorative background (fallback when no cover) */}
        {!event.coverImage && (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-coral/5 via-transparent to-gold/5 pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-coral/10 to-transparent rounded-full blur-3xl pointer-events-none" />
          </>
        )}

        <div className={`relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center ${event.coverImage ? 'text-white' : ''}`}>
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full shadow-soft border mb-6 ${event.coverImage ? 'bg-white/10 border-white/20' : 'bg-cream-100 border-warm-300/50'}`}>
            <span className="w-2 h-2 bg-success rounded-full animate-pulse-soft" />
            <span className={`text-sm font-medium ${event.coverImage ? 'text-white/90' : 'text-warm-700'}`}>Galleria live</span>
          </div>

          <h1 className={`font-display text-4xl md:text-5xl font-bold mb-4 ${event.coverImage ? 'text-white' : 'text-charcoal'}`}>
            {event.name}
          </h1>

          <p className={`flex items-center justify-center gap-3 text-base ${event.coverImage ? 'text-white/80' : 'text-warm-600'}`}>
            <span>{formatDate(event.date)}</span>
            <span className={`w-1 h-1 rounded-full ${event.coverImage ? 'bg-white/50' : 'bg-warm-400'}`} />
            <span>Organizzato da {event.owner?.name || 'Anonimo'}</span>
          </p>

          {/* Share buttons */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 bg-coral text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-glow hover:bg-coral/90 transition-all"
            >
              <Share2 className="w-4 h-4" />
              Condividi
            </button>
            <button
              onClick={handleWhatsAppShare}
              className="inline-flex items-center gap-2 bg-success text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-success/90 transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </button>
            <button
              onClick={handleCopyLink}
              className={`inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl transition-all ${
                copied ? 'bg-success text-white' : 'bg-warm-200 text-charcoal hover:bg-warm-300'
              }`}
            >
              <LinkIcon className="w-4 h-4" />
              {copied ? 'Copiato!' : 'Copia link'}
            </button>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-6 md:gap-10 mt-10">
            <div className="text-center">
              <p className="text-3xl font-bold font-mono text-charcoal">{photos.length}</p>
              <p className="text-xs text-warm-500 uppercase tracking-wide mt-1">Foto</p>
            </div>
            <div className="w-px h-10 bg-warm-300" />
            <div className="text-center">
              <p className="text-3xl font-bold font-mono text-charcoal flex items-center justify-center gap-1.5">
                <Heart className="w-6 h-6 text-coral" />
                {totalReactions}
              </p>
              <p className="text-xs text-warm-500 uppercase tracking-wide mt-1">Reazioni</p>
            </div>
            <div className="w-px h-10 bg-warm-300" />
            <div className="text-center">
              <p className="text-3xl font-bold font-mono text-charcoal flex items-center justify-center gap-1.5">
                <Award className="w-6 h-6 text-gold" />
                {totalVotes}
              </p>
              <p className="text-xs text-warm-500 uppercase tracking-wide mt-1">Voti</p>
            </div>
            <div className="w-px h-10 bg-warm-300" />
            <div className="text-center">
              <p className="text-3xl font-bold font-mono text-charcoal flex items-center justify-center gap-1.5">
                <Users className="w-6 h-6 text-warm-500" />
                {event.views}
              </p>
              <p className="text-xs text-warm-500 uppercase tracking-wide mt-1">Visualizzazioni</p>
            </div>
          </div>
        </div>
      </section>

      {/* Upload CTA */}
      <section className="py-6 bg-cream-100 border-b border-warm-300/40">
        <div className="max-w-2xl mx-auto px-4">
          {showUploader ? (
            <div className="bg-white rounded-2xl p-6 border border-warm-300/40 shadow-soft">
              {!isLoggedIn && (
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-charcoal mb-1.5">Il tuo nome</label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Come dovremmo accredirti?"
                    className="w-full px-4 py-2.5 rounded-xl border border-warm-300 bg-white focus:outline-none focus:ring-2 focus:ring-coral/50 focus:border-coral transition-all"
                  />
                </div>
              )}
              <UploadZone
                eventId={eventId}
                onUploadComplete={handleUploadComplete}
                guestMode={!isLoggedIn}
                guestName={guestName || undefined}
              />
              <Button
                variant="ghost"
                onClick={() => setShowUploader(false)}
                className="mt-4 w-full py-2 text-sm text-warm-500 hover:text-charcoal transition-colors"
              >
                Annulla
              </Button>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-coral via-coral/90 to-gold p-[2px] rounded-2xl shadow-glow">
              <div className="bg-cream-100 rounded-2xl p-6 text-center">
                <div className="w-14 h-14 bg-gradient-to-br from-coral/10 to-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-7 h-7 text-coral" />
                </div>
                <p className="font-display font-semibold text-lg text-charcoal mb-1">Condividi le tue foto!</p>
                <p className="text-sm text-warm-600 mb-4">
                  Carica le tue foto di questo evento. Appariranno nella galleria istantaneamente.
                </p>
                <Button onClick={() => setShowUploader(true)} className="shadow-glow">
                  <Upload className="w-4 h-4" />
                  Carica foto
                </Button>
                {uploadedCount > 0 && (
                  <p className="text-sm text-success mt-3 font-semibold">
                    ✓ {uploadedCount} foto caricat{uploadedCount > 1 ? 'e' : 'a'} con successo!
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Photo Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {photos.length > 0 ? (
          <PhotoGrid photos={photos} onPhotoClick={openLightbox} />
        ) : (
          <div className="text-center py-24">
            <div className="w-20 h-20 bg-warm-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Camera className="w-10 h-10 text-warm-400" />
            </div>
            <p className="text-warm-600 text-lg mb-2">Nessuna foto ancora</p>
            <p className="text-warm-500 text-sm">Sii il primo a caricare una foto!</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-warm-300/40 bg-cream-100/50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-warm-500 hover:text-charcoal transition-colors">
            <div className="w-5 h-5 bg-gradient-to-br from-coral to-gold rounded" />
            Realizzato con ForeverPic
          </Link>
        </div>
      </footer>

      {/* Lightbox */}
      {lightboxOpen && photos.length > 0 && (
        <PhotoLightbox
          photos={photos}
          initialIndex={lightboxIndex}
          open={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          currentUserId={session?.user?.id}
          onReact={handleReact}
          onVote={handleVote}
        />
      )}
    </div>
  )
}
