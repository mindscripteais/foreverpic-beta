'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout'
import { EventCard } from '@/components/event'
import { EventCardSkeleton } from '@/components/ui'
import { trpc } from '@/lib/trpc-client'
import { Calendar, Search } from 'lucide-react'
import { useState } from 'react'

export default function EventsPage() {
  const { data: session, status } = useSession()
  const [searchQuery, setSearchQuery] = useState('')

  const { data: events, isLoading } = trpc.event.list.useQuery()

  if (status === 'unauthenticated') {
    redirect('/signin')
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const user = session?.user

  const filteredEvents = events?.filter((event) =>
    event.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-cream-100 flex">
      <Sidebar user={{
        name: user?.name,
        email: user?.email,
        image: user?.image,
        tier: (session as any)?.subscriptionTier || 'FREE'
      }} />

      <main className="flex-1 p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold text-charcoal mb-2">Tutti gli eventi</h1>
          <p className="text-warm-600 text-sm">
            Visualizza e gestisci tutte le tue gallerie evento
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-warm-500" />
          <input
            type="text"
            placeholder="Cerca eventi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-warm-300/40 bg-white focus:outline-none focus:ring-2 focus:ring-coral/50"
          />
        </div>

        {/* Event Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        ) : !filteredEvents || filteredEvents.length === 0 ? (
          <div className="text-center py-20 bg-cream-100 rounded-2xl border border-warm-300/40">
            <div className="w-16 h-16 bg-warm-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-warm-500" />
            </div>
            <h2 className="font-semibold text-lg mb-2">
              {searchQuery ? 'Nessun evento corrisponde alla ricerca' : 'Nessun evento'}
            </h2>
            <p className="text-warm-600">
              {searchQuery ? 'Prova un termine di ricerca diverso' : 'Crea il tuo primo evento per iniziare'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
