'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Calendar, Image, Eye, TrendingUp, Zap, HardDrive } from 'lucide-react'
import { Sidebar } from '@/components/layout'
import { EventCard, CreateEventModal, EventCreatedModal } from '@/components/event'
import { EventCardSkeleton } from '@/components/ui'
import { Button } from '@/components/ui'
import { useState } from 'react'
import { trpc } from '@/lib/trpc-client'
import { formatBytes } from '@/lib/utils'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [createOpen, setCreateOpen] = useState(false)
  const [createdEvent, setCreatedEvent] = useState<{ id: string; name: string } | null>(null)

  const { data: events, isLoading } = trpc.event.list.useQuery()
  const { data: userData } = trpc.user.me.useQuery()
  const utils = trpc.useUtils()

  const deleteEvent = trpc.event.delete.useMutation({
    onSuccess: () => {
      utils.event.list.invalidate()
      utils.user.me.invalidate()
    },
  })

  if (status === 'unauthenticated') {
    redirect('/signin')
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-coral border-t-transparent rounded-full animate-spin" />
          <p className="text-warm-600 text-sm">Caricamento eventi...</p>
        </div>
      </div>
    )
  }

  const user = session?.user

  const totalPhotos = events?.reduce((sum, e) => sum + e._count.photos, 0) || 0
  const totalViews = events?.reduce((sum, e) => sum + e.views, 0) || 0
  const totalStorage = events?.reduce((sum, e) => sum + e.photos.reduce((s, p) => s + p.size, 0), 0) || 0

  return (
    <div className="min-h-screen bg-cream-100 flex">
      <Sidebar user={{
        name: user?.name,
        email: user?.email,
        image: user?.image,
        tier: (session as any)?.subscriptionTier || 'FREE'
      }} />

      <main className="flex-1 p-6 lg:p-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-charcoal">I tuoi eventi</h1>
            <p className="text-warm-600 text-sm mt-1">
              {events && events.length > 0
                ? `Gestisci ${events.length} evento${events.length !== 1 ? 'i' : ''}`
                : 'Crea il tuo primo evento per iniziare a condividere foto'}
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="shadow-glow">
            <Plus className="w-4 h-4" />
            Crea evento
          </Button>
        </div>

        {/* Storage Bar */}
        {userData && (
          <div className="bg-cream-100 rounded-2xl border border-warm-300/40 p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-warm-500" />
                <span className="text-sm font-medium text-charcoal">Spazio totale usato</span>
              </div>
              <span className="text-sm font-mono text-warm-600">
                {formatBytes(userData.totalStorageUsed)} / {formatBytes(userData.totalStorageLimit)}
              </span>
            </div>
            <div className="h-3 bg-warm-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  userData.storagePercent > 90 ? 'bg-coral' :
                  userData.storagePercent > 75 ? 'bg-warning' :
                  userData.storagePercent > 50 ? 'bg-gold' :
                  'bg-success'
                }`}
                style={{ width: `${userData.storagePercent}%` }}
              />
            </div>
            <p className="text-xs text-warm-500 mt-2">
              {userData.storagePercent > 90
                ? 'Spazio quasi esaurito! Passa a un piano superiore.'
                : userData.storagePercent > 75
                ? 'Stai usando molto spazio.'
                : `Hai ancora ${formatBytes(userData.totalStorageLimit - userData.totalStorageUsed)} disponibili.`}
            </p>
          </div>
        )}

        {/* Stats Row */}
        {events && events.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-cream-100 rounded-2xl p-5 border border-warm-300/40 hover:border-coral/30 transition-colors group">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-xl bg-coral/10 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Calendar className="w-5 h-5 text-coral" />
                </div>
              </div>
              <p className="text-2xl font-bold font-mono text-charcoal">{events.length}</p>
              <p className="text-sm text-warm-600">Eventi</p>
            </div>
            <div className="bg-cream-100 rounded-2xl p-5 border border-warm-300/40 hover:border-gold/30 transition-colors group">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-xl bg-gold/10 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Image className="w-5 h-5 text-gold" />
                </div>
              </div>
              <p className="text-2xl font-bold font-mono text-charcoal">{totalPhotos}</p>
              <p className="text-sm text-warm-600">Foto</p>
            </div>
            <div className="bg-cream-100 rounded-2xl p-5 border border-warm-300/40 hover:border-success/30 transition-colors group">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-xl bg-success/10 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Eye className="w-5 h-5 text-success" />
                </div>
              </div>
              <p className="text-2xl font-bold font-mono text-charcoal">{totalViews}</p>
              <p className="text-sm text-warm-600">Visualizzazioni</p>
            </div>
            <div className="bg-cream-100 rounded-2xl p-5 border border-warm-300/40 hover:border-coral/30 transition-colors group">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-xl bg-coral/10 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <TrendingUp className="w-5 h-5 text-coral" />
                </div>
              </div>
              <p className="text-2xl font-bold font-mono text-charcoal">{formatBytes(totalStorage)}</p>
              <p className="text-sm text-warm-600">Spazio</p>
            </div>
          </div>
        )}

        {/* Event Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        ) : !events || events.length === 0 ? (
          <div className="text-center py-24 bg-cream-100 rounded-2xl border border-warm-300/40">
            <div className="w-20 h-20 bg-gradient-to-br from-coral/10 to-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Zap className="w-10 h-10 text-coral" />
            </div>
            <h2 className="font-display text-2xl font-semibold text-charcoal mb-2">Nessun evento</h2>
            <p className="text-warm-600 mb-8 max-w-md mx-auto">
              Crea il tuo primo evento e inizia a raccogliere foto dai tuoi ospiti tramite QR code.
            </p>
            <Button onClick={() => setCreateOpen(true)} size="lg" className="shadow-glow">
              <Plus className="w-5 h-5" />
              Crea il tuo primo evento
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard key={event.id} event={event} onDelete={(id) => {
                if (confirm('Sei sicuro di voler eliminare questo evento? Tutte le foto verranno perse.')) {
                  deleteEvent.mutate({ id })
                }
              }} />
            ))}
          </div>
        )}
      </main>

      <CreateEventModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onEventCreated={(event) => setCreatedEvent(event)}
      />

      <EventCreatedModal
        eventId={createdEvent?.id ?? null}
        eventName={createdEvent?.name ?? ''}
        open={!!createdEvent}
        onClose={() => setCreatedEvent(null)}
      />
    </div>
  )
}