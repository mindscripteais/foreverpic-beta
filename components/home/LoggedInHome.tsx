'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Plus, ArrowRight, Calendar } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { EventCard, CreateEventModal, EventCreatedModal } from '@/components/event'
import { EventCardSkeleton } from '@/components/ui'
import { Button } from '@/components/ui'
import { trpc } from '@/lib/trpc-client'
import { formatDate } from '@/lib/utils'

export function LoggedInHome() {
  const { data: session } = useSession()
  const [createOpen, setCreateOpen] = useState(false)
  const [createdEvent, setCreatedEvent] = useState<{ id: string; name: string } | null>(null)

  const { data: events, isLoading } = trpc.event.list.useQuery()
  const utils = trpc.useUtils()

  const deleteEvent = trpc.event.delete.useMutation({
    onSuccess: () => {
      utils.event.list.invalidate()
      utils.user.me.invalidate()
    },
  })

  const recentEvents = events?.slice(0, 6) || []

  return (
    <div className="min-h-screen bg-cream-100">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-cream-100/80 backdrop-blur-md border-b border-warm-300/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="font-display font-semibold text-charcoal text-xl">
              ForeverPic
            </Link>
            <nav className="flex items-center gap-6">
              <Link href="/dashboard" className="text-warm-600 hover:text-charcoal text-sm font-medium transition-colors">
                Dashboard
              </Link>
              <Link href="/settings" className="text-warm-600 hover:text-charcoal text-sm font-medium transition-colors">
                Impostazioni
              </Link>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-semibold">
                {session?.user?.name?.[0] || 'U'}
              </div>
            </nav>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Welcome */}
        <div className="mb-10">
          <h1 className="font-display text-3xl font-bold text-charcoal mb-2">
            Ciao, {session?.user?.name?.split(' ')[0] || 'Utente'}! 👋
          </h1>
          <p className="text-warm-600">
            Ecco i tuoi eventi recenti.{' '}
            <Link href="/dashboard" className="text-coral hover:underline font-medium">
              Vai alla dashboard →
            </Link>
          </p>
        </div>

        {/* Events Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        ) : recentEvents.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-warm-300/40">
            <div className="w-16 h-16 bg-gradient-to-br from-coral/10 to-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-coral" />
            </div>
            <h2 className="font-display text-xl font-semibold text-charcoal mb-2">Nessun evento</h2>
            <p className="text-warm-600 mb-6">Crea il tuo primo evento per iniziare a raccogliere foto.</p>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4" />
              Crea evento
            </Button>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onDelete={(id) => {
                    if (confirm('Sei sicuro di voler eliminare questo evento? Tutte le foto verranno perse.')) {
                      deleteEvent.mutate({ id })
                    }
                  }}
                />
              ))}
            </div>
            {events && events.length > 6 && (
              <div className="mt-8 text-center">
                <Link href="/dashboard">
                  <Button variant="secondary">
                    Vedi tutti gli eventi
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            )}
          </>
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
