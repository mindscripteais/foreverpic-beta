'use client'

import { useState, useEffect } from 'react'
import { Heart, Award, Download, Maximize2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Photo {
  id: string
  url: string
  thumbnail?: string
  type?: string
  reactions: { type: string; userId: string }[]
  votes: { userId: string }[]
  uploader?: { name?: string | null } | null
  guestName?: string | null
}

interface PhotoGridProps {
  photos: Photo[]
  currentUserId?: string
  onPhotoClick?: (photo: Photo, index: number) => void
}

export function PhotoGrid({ photos, currentUserId, onPhotoClick }: PhotoGridProps) {
  const [loaded, setLoaded] = useState<Record<string, boolean>>({})

  // Debug: log photo URLs to help diagnose image loading issues
  useEffect(() => {
    if (photos.length > 0) {
      console.log('[PhotoGrid] Rendering', photos.length, 'photos')
      photos.forEach((p) => console.log('[PhotoGrid] Photo URL:', p.id, p.url.slice(0, 120)))
    }
  }, [photos])

  const getReactionCounts = (photo: Photo) => {
    const counts: Record<string, number> = {}
    photo.reactions.forEach((r) => {
      counts[r.type] = (counts[r.type] || 0) + 1
    })
    return counts
  }

  const totalReactions = (photo: Photo) => photo.reactions.length
  const totalVotes = (photo: Photo) => photo.votes.length

  const reactionEmoji: Record<string, string> = {
    LOVE: '❤️',
    LAUGH: '😂',
    WOW: '😮',
    HEART: '😍',
    FIRE: '🔥',
  }

  return (
    <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
      {photos.map((photo, index) => {
        const reactions = getReactionCounts(photo)
        const isTopPhoto = totalVotes(photo) >= 4

        return (
          <div
            key={photo.id}
            className="break-inside-avoid relative group cursor-pointer"
            onClick={() => onPhotoClick?.(photo, index)}
          >
            <div className="relative overflow-hidden rounded-2xl bg-warm-200 shadow-soft">
              {!loaded[photo.id] && (
                <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-warm-200 via-cream to-warm-200 bg-[length:200%_100%]" />
              )}
              {photo.type === 'VIDEO' ? (
                <video
                  src={photo.url}
                  className="w-full transition-transform duration-500 group-hover:scale-105"
                  muted
                  playsInline
                  preload="metadata"
                  onLoadedMetadata={() => setLoaded((prev) => ({ ...prev, [photo.id]: true }))}
                />
              ) : (
                <img
                  src={photo.url}
                  alt=""
                  className="w-full transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  onLoad={() => setLoaded((prev) => ({ ...prev, [photo.id]: true }))}
                />
              )}
              {photo.type === 'VIDEO' && (
                <div className="absolute top-3 left-3 bg-charcoal/70 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <span className="w-2 h-2 bg-coral rounded-full animate-pulse" />
                  Video
                </div>
              )}

              {/* Soft gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Top photo badge — gold accent */}
              {isTopPhoto && (
                <div className="absolute top-3 right-3 bg-gold text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-glow">
                  <Award className="w-3.5 h-3.5" />
                  Top
                </div>
              )}

              {/* Expand icon */}
              <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0">
                <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm text-white">
                  <Maximize2 className="w-4 h-4" />
                </div>
              </div>

              {/* Stats overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                <div className="flex items-center justify-between">
                  {/* Reactions */}
                  <div className="flex items-center gap-2">
                    {Object.entries(reactions).slice(0, 3).map(([type, count]) => (
                      <span key={type} className="flex items-center gap-1 text-white text-sm">
                        <span>{reactionEmoji[type]}</span>
                        <span className="text-xs font-semibold">{count}</span>
                      </span>
                    ))}
                    {Object.keys(reactions).length > 3 && (
                      <span className="text-white/70 text-xs">+{Object.keys(reactions).length - 3}</span>
                    )}
                  </div>

                  {/* Votes */}
                  {totalVotes(photo) > 0 && (
                    <span className="flex items-center gap-1 text-white text-sm">
                      <Award className="w-4 h-4 text-gold" />
                      {totalVotes(photo)}
                    </span>
                  )}
                </div>

                {/* Uploader */}
                {(photo.uploader?.name || photo.guestName) && (
                  <p className="text-white/80 text-xs mt-2 font-medium">
                    by {photo.uploader?.name || photo.guestName}
                  </p>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}