'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight, Heart, Award, Download, ZoomIn, ZoomOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Photo {
  id: string
  url: string
  type?: string
  reactions: { type: string; userId: string }[]
  votes: { userId: string }[]
  uploader?: { name?: string | null } | null
  guestName?: string | null
}

interface PhotoLightboxProps {
  photos: Photo[]
  initialIndex: number
  open: boolean
  onClose: () => void
  currentUserId?: string
  onReact?: (photoId: string, type: string) => void
  onVote?: (photoId: string) => void
  onDownload?: (photo: Photo) => void
}

export function PhotoLightbox({
  photos,
  initialIndex,
  open,
  onClose,
  currentUserId,
  onReact,
  onVote,
  onDownload,
}: PhotoLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [scale, setScale] = useState(1)

  const currentPhoto = photos[currentIndex]

  const prev = useCallback(() => {
    setCurrentIndex((i) => (i > 0 ? i - 1 : photos.length - 1))
    setScale(1)
  }, [photos.length])

  const next = useCallback(() => {
    setCurrentIndex((i) => (i < photos.length - 1 ? i + 1 : 0))
    setScale(1)
  }, [photos.length])

  useEffect(() => {
    setCurrentIndex(initialIndex)
    setScale(1)
  }, [initialIndex])

  useEffect(() => {
    if (!open) return

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
      if (e.key === '+' || e.key === '=') setScale((s) => Math.min(3, s + 0.25))
      if (e.key === '-') setScale((s) => Math.max(0.5, s - 0.25))
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKey)
    }
  }, [open, onClose, prev, next])

  if (!open || !currentPhoto) return null

  const getReactionCounts = (photo: Photo) => {
    const counts: Record<string, number> = {}
    photo.reactions.forEach((r) => {
      counts[r.type] = (counts[r.type] || 0) + 1
    })
    return counts
  }

  const reactions = getReactionCounts(currentPhoto)
  const userReacted = currentUserId
    ? currentPhoto.reactions.filter((r) => r.userId === currentUserId).map((r) => r.type)
    : []
  const userVoted = currentUserId
    ? currentPhoto.votes.some((v) => v.userId === currentUserId)
    : false

  const reactionTypes = [
    { type: 'LOVE', emoji: '❤️', label: 'Amore' },
    { type: 'LAUGH', emoji: '😂', label: 'Riso' },
    { type: 'WOW', emoji: '😮', label: 'Wow' },
    { type: 'HEART', emoji: '😍', label: 'Cuore' },
    { type: 'FIRE', emoji: '🔥', label: 'Fuoco' },
  ]

  return (
    <div className="fixed inset-0 z-50 bg-charcoal/95 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-5 text-white">
        <div className="flex items-center gap-4">
          <span className="text-sm font-mono">
            {currentIndex + 1} / {photos.length}
          </span>
          {(currentPhoto.uploader?.name || currentPhoto.guestName) && (
            <span className="text-sm text-white/60">di {currentPhoto.uploader?.name || currentPhoto.guestName}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
            className="p-2.5 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <span className="text-sm font-mono text-white/70 w-12 text-center">{Math.round(scale * 100)}%</span>
          <button
            onClick={() => setScale((s) => Math.min(3, s + 0.25))}
            className="p-2.5 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          {onDownload && (
            <button
              onClick={() => onDownload(currentPhoto)}
              className="p-2.5 rounded-xl hover:bg-white/10 text-white/70 hover:text-white ml-2 transition-colors"
            >
              <Download className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl hover:bg-white/10 text-white/70 hover:text-white ml-2 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Image */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        {currentIndex > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); prev() }}
            className="absolute left-5 top-1/2 -translate-y-1/2 p-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white z-10 transition-all hover:scale-105"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
        )}
        {currentIndex < photos.length - 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); next() }}
            className="absolute right-5 top-1/2 -translate-y-1/2 p-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white z-10 transition-all hover:scale-105"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        )}

        <div
          className="transition-transform duration-200 cursor-grab active:cursor-grabbing"
          style={{ transform: `scale(${scale})` }}
          onClick={(e) => e.stopPropagation()}
        >
          {currentPhoto.type === 'VIDEO' ? (
            <video
              src={currentPhoto.url}
              controls
              autoPlay
              className="max-w-[90vw] max-h-[75vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={currentPhoto.url}
              alt=""
              className="max-w-[90vw] max-h-[75vh] object-contain"
            />
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-5 border-t border-white/10">
        <div className="flex items-center justify-between">
          {/* Reactions */}
          <div className="flex items-center gap-2">
            {reactionTypes.map(({ type, emoji, label }) => (
              <button
                key={type}
                onClick={() => onReact?.(currentPhoto.id, type)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
                  userReacted.includes(type)
                    ? 'bg-coral/30 text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                }`}
                title={label}
              >
                <span>{emoji}</span>
                <span className="text-sm font-semibold">{reactions[type] || 0}</span>
              </button>
            ))}
          </div>

          {/* Vote */}
          <div className="flex items-center gap-2">
            <Button
              variant={userVoted ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => onVote?.(currentPhoto.id)}
              className={userVoted ? 'bg-gold hover:bg-gold/90' : ''}
            >
              <Award className="w-4 h-4" />
              {currentPhoto.votes.length}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}