'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Calendar, Image, Eye, MoreVertical, Trash2, Settings, Copy, QrCode, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatBytes } from '@/lib/utils'
import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface EventCardProps {
  event: {
    id: string
    name: string
    date: Date | string
    coverImage?: string | null
    privacy: string
    views: number
    storageLimit?: number
    photos: { size: number }[]
    _count: { photos: number }
  }
  onDelete?: (id: string) => void
}

export function EventCard({ event, onDelete }: EventCardProps) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const totalSize = event.photos.reduce((sum, p) => sum + p.size, 0)
  const storageLimit = event.storageLimit || 500 * 1024 * 1024
  const storagePercent = Math.min(100, (totalSize / storageLimit) * 100)
  const storageColor = storagePercent > 80 ? 'bg-coral' : storagePercent > 50 ? 'bg-warning' : 'bg-coral'

  const privacyBadge = {
    PUBLIC: { label: 'Pubblico', variant: 'success' as const, icon: 'globe' },
    PRIVATE: { label: 'Privato', variant: 'warning' as const, icon: 'lock' },
    INVITE_ONLY: { label: 'Su invito', variant: 'default' as const, icon: 'users' },
  }
  const privacyKey = event.privacy as keyof typeof privacyBadge
  const badge = privacyBadge[privacyKey] || { label: 'Sconosciuto', variant: 'default' as const, icon: 'help' }

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    await navigator.clipboard.writeText(`${window.location.origin}/events/${event.id}`)
    setCopied(true)
    setMenuOpen(false)
    setTimeout(() => setCopied(false), 2000)
  }

  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation()

  return (
    <Card
      hover={false}
      padding="none"
      className="group overflow-hidden hover:shadow-elevated transition-all duration-300 hover:-translate-y-1.5 cursor-pointer"
      onClick={() => router.push(`/manage/${event.id}`)}
    >
      {/* Cover */}
      <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-warm-200 to-warm-100">
        {event.coverImage ? (
          <img
            src={event.coverImage}
            alt=""
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-2xl bg-cream-100/80 backdrop-blur flex items-center justify-center shadow-soft">
              <Calendar className="w-10 h-10 text-warm-400" />
            </div>
          </div>
        )}

        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Privacy badge */}
        <div className="absolute top-3 left-3">
          <Badge variant={badge.variant} className="backdrop-blur-sm shadow-soft">
            {badge.label}
          </Badge>
        </div>

        {/* Menu */}
        <div className="absolute top-3 right-3" ref={menuRef}>
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setMenuOpen(!menuOpen)
            }}
            className="p-2 rounded-xl bg-cream-100/90 backdrop-blur text-warm-600 hover:text-charcoal shadow-soft opacity-0 group-hover:opacity-100 transition-all hover:bg-cream-100"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-48 bg-cream-100 rounded-2xl shadow-elevated border border-warm-300/30 py-1.5 z-20">
              <Link
                href={`/manage/${event.id}`}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-charcoal hover:bg-warm-200/50 transition-colors"
                onClick={(e) => { stopPropagation(e); setMenuOpen(false) }}
              >
                <Settings className="w-4 h-4 text-warm-500" />
                Gestisci evento
              </Link>
              <Link
                href={`/events/${event.id}`}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-charcoal hover:bg-warm-200/50 transition-colors"
                onClick={(e) => { stopPropagation(e); setMenuOpen(false) }}
              >
                <Eye className="w-4 h-4 text-warm-500" />
                Vedi galleria
              </Link>
              <Link
                href={`/manage/${event.id}#qr`}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-charcoal hover:bg-warm-200/50 transition-colors"
                onClick={(e) => { stopPropagation(e); setMenuOpen(false) }}
              >
                <QrCode className="w-4 h-4 text-warm-500" />
                QR Code
              </Link>
              <button
                onClick={(e) => { stopPropagation(e); handleCopyLink(e) }}
                className={cn(
                  "w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors",
                  copied ? "text-success bg-success/5" : "text-charcoal hover:bg-warm-200/50"
                )}
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copiato!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-warm-500" />
                    Copia link
                  </>
                )}
              </button>
              <hr className="my-1.5 border-warm-300/40" />
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onDelete?.(event.id)
                  setMenuOpen(false)
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-coral hover:bg-coral/5 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Elimina
              </button>
            </div>
          )}
        </div>

        {/* Quick actions on hover */}
        <div className="absolute bottom-3 left-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
          <Link
            href={`/events/${event.id}`}
            className="flex-1 py-2.5 bg-cream-100/95 backdrop-blur-sm rounded-xl text-center text-sm font-semibold text-charcoal hover:bg-cream-100 transition-colors shadow-soft"
            onClick={stopPropagation}
          >
            Vedi galleria
          </Link>
          <Link
            href={`/manage/${event.id}`}
            className="flex-1 py-2.5 bg-coral/95 backdrop-blur-sm rounded-xl text-center text-sm font-semibold text-white hover:bg-coral transition-colors shadow-glow"
            onClick={stopPropagation}
          >
            Gestisci
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <Link href={`/manage/${event.id}`} className="block">
          <h3 className="font-display text-lg font-semibold text-charcoal mb-1 hover:text-coral transition-colors line-clamp-1 group/title">
            {event.name}
            <span className="absolute inset-0" />
          </h3>
        </Link>
        <p className="text-sm text-warm-500 mb-4">{formatDate(event.date)}</p>

        {/* Stats row */}
        <div className="flex items-center gap-5 text-sm">
          <span className="flex items-center gap-2 text-charcoal">
            <div className="w-8 h-8 rounded-xl bg-warm-200 flex items-center justify-center">
              <Image className="w-4 h-4 text-warm-600" />
            </div>
            <span className="font-semibold">{event._count.photos}</span>
          </span>
          <span className="flex items-center gap-2 text-charcoal">
            <div className="w-8 h-8 rounded-xl bg-warm-200 flex items-center justify-center">
              <Eye className="w-4 h-4 text-warm-600" />
            </div>
            <span className="font-semibold">{event.views}</span>
          </span>
        </div>

        {/* Storage indicator */}
        <div className="mt-4 pt-4 border-t border-warm-300/40">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-warm-600 font-semibold">Spazio</span>
            <span className={cn(
              "font-mono font-semibold",
              storagePercent > 80 ? "text-coral" : storagePercent > 50 ? "text-warning" : "text-warm-600"
            )}>
              {formatBytes(totalSize)} / {formatBytes(storageLimit)}
            </span>
          </div>
          <div className="h-1.5 bg-warm-200 rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-500", storageColor)}
              style={{ width: `${storagePercent}%` }}
            />
          </div>
        </div>
      </div>
    </Card>
  )
}