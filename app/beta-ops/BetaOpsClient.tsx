'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Users, Calendar, Image, HardDrive, Activity,
  Trash2, BarChart3, Loader2, X
} from 'lucide-react'
import { trpc } from '@/lib/trpc-client'
import { formatBytes, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui'

export default function BetaOpsClient() {
  const [tab, setTab] = useState<'overview' | 'users' | 'events' | 'photos' | 'activity'>('overview')
  const [lightbox, setLightbox] = useState<string | null>(null)

  const { data: stats } = trpc.admin.stats.useQuery()
  const { data: users } = trpc.admin.users.useQuery(undefined, {
    enabled: tab === 'users',
  })
  const { data: events } = trpc.admin.events.useQuery(undefined, {
    enabled: tab === 'events',
  })
  const { data: photos } = trpc.admin.photos.useQuery(undefined, {
    enabled: tab === 'photos',
  })
  const { data: activity } = trpc.admin.activity.useQuery(undefined, {
    enabled: tab === 'activity',
  })

  const utils = trpc.useUtils()
  const deleteEvent = trpc.admin.deleteEvent.useMutation({
    onSuccess: () => utils.admin.events.invalidate(),
  })
  const deletePhoto = trpc.admin.deletePhoto.useMutation({
    onSuccess: () => utils.admin.photos.invalidate(),
  })

  return (
    <div className="min-h-screen bg-charcoal text-cream-100">
      {/* Header */}
      <header className="bg-charcoal border-b border-warm-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-coral" />
          <h1 className="font-display text-xl font-bold">Beta Ops Dashboard</h1>
        </div>
        <Link href="/dashboard" className="text-sm text-warm-500 hover:text-cream-100">
          Torna all&apos;app
        </Link>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-56 bg-charcoal border-r border-warm-800 min-h-screen p-4">
          <nav className="space-y-1">
            {[
              { key: 'overview', label: 'Overview', icon: BarChart3 },
              { key: 'users', label: 'Utenti', icon: Users },
              { key: 'events', label: 'Eventi', icon: Calendar },
              { key: 'photos', label: 'Foto', icon: Image },
              { key: 'activity', label: 'Attività', icon: Activity },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setTab(item.key as any)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  tab === item.key
                    ? 'bg-coral/10 text-coral'
                    : 'text-warm-500 hover:text-cream-100 hover:bg-warm-800'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <main className="flex-1 p-6">
          {tab === 'overview' && stats && (
            <div className="space-y-6">
              <h2 className="font-display text-2xl font-bold">Overview</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-warm-800/50 rounded-2xl p-5 border border-warm-700">
                  <Users className="w-5 h-5 text-coral mb-3" />
                  <p className="text-3xl font-bold">{stats.users}</p>
                  <p className="text-sm text-warm-500">Utenti</p>
                </div>
                <div className="bg-warm-800/50 rounded-2xl p-5 border border-warm-700">
                  <Calendar className="w-5 h-5 text-gold mb-3" />
                  <p className="text-3xl font-bold">{stats.events}</p>
                  <p className="text-sm text-warm-500">Eventi</p>
                </div>
                <div className="bg-warm-800/50 rounded-2xl p-5 border border-warm-700">
                  <Image className="w-5 h-5 text-success mb-3" />
                  <p className="text-3xl font-bold">{stats.photos}</p>
                  <p className="text-sm text-warm-500">Foto</p>
                </div>
                <div className="bg-warm-800/50 rounded-2xl p-5 border border-warm-700">
                  <HardDrive className="w-5 h-5 text-coral mb-3" />
                  <p className="text-3xl font-bold">{formatBytes(stats.totalStorage)}</p>
                  <p className="text-sm text-warm-500">Storage totale</p>
                </div>
              </div>
              <div className="bg-warm-800/30 rounded-2xl p-5 border border-warm-700">
                <p className="text-warm-500 text-sm">Upload oggi</p>
                <p className="text-2xl font-bold mt-1">{stats.todayUploads}</p>
              </div>
            </div>
          )}

          {tab === 'users' && users && (
            <div className="space-y-4">
              <h2 className="font-display text-2xl font-bold">Utenti ({users.length})</h2>
              <div className="bg-warm-800/30 rounded-2xl border border-warm-700 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-warm-800/50 text-warm-500">
                    <tr>
                      <th className="text-left px-4 py-3">Nome</th>
                      <th className="text-left px-4 py-3">Email</th>
                      <th className="text-left px-4 py-3">Tier</th>
                      <th className="text-left px-4 py-3">Eventi</th>
                      <th className="text-left px-4 py-3">Foto</th>
                      <th className="text-left px-4 py-3">Registrato</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-t border-warm-700/50 hover:bg-warm-800/30">
                        <td className="px-4 py-3">{u.name || '—'}</td>
                        <td className="px-4 py-3">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            u.tier === 'FREE' ? 'bg-warm-700 text-warm-300' :
                            u.tier === 'PRO' ? 'bg-coral/20 text-coral' :
                            'bg-gold/20 text-gold'
                          }`}>{u.tier}</span>
                        </td>
                        <td className="px-4 py-3">{u.eventCount}</td>
                        <td className="px-4 py-3">{u.photoCount}</td>
                        <td className="px-4 py-3 text-warm-500">{formatDate(u.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'events' && events && (
            <div className="space-y-4">
              <h2 className="font-display text-2xl font-bold">Eventi ({events.length})</h2>
              <div className="bg-warm-800/30 rounded-2xl border border-warm-700 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-warm-800/50 text-warm-500">
                    <tr>
                      <th className="text-left px-4 py-3">Nome</th>
                      <th className="text-left px-4 py-3">Owner</th>
                      <th className="text-left px-4 py-3">Privacy</th>
                      <th className="text-left px-4 py-3">Foto</th>
                      <th className="text-left px-4 py-3">Views</th>
                      <th className="text-left px-4 py-3">Storage</th>
                      <th className="text-left px-4 py-3">Scadenza</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((e) => (
                      <tr key={e.id} className="border-t border-warm-700/50 hover:bg-warm-800/30">
                        <td className="px-4 py-3">{e.name}</td>
                        <td className="px-4 py-3">{e.ownerName || e.ownerEmail}</td>
                        <td className="px-4 py-3">{e.privacy}</td>
                        <td className="px-4 py-3">{e.photoCount}</td>
                        <td className="px-4 py-3">{e.views}</td>
                        <td className="px-4 py-3">{formatBytes(e.storageUsed)}</td>
                        <td className="px-4 py-3 text-warm-500">{e.autoDeleteAt ? formatDate(e.autoDeleteAt) : '—'}</td>
                        <td className="px-4 py-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteEvent.mutate({ id: e.id })}
                            className="text-coral hover:text-coral/80"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'photos' && photos && (
            <div className="space-y-4">
              <h2 className="font-display text-2xl font-bold">Foto recenti ({photos.length})</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {photos.map((p) => (
                  <div key={p.id} className="group relative aspect-square rounded-xl overflow-hidden bg-warm-800 cursor-pointer"
                    onClick={() => setLightbox(p.url)}>
                    {p.url.startsWith('data:') ? (
                      <img src={p.url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <img src={p.thumbnail || p.url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-2 left-2 right-2">
                        <p className="text-[10px] text-white truncate">{p.eventName}</p>
                        <p className="text-[10px] text-warm-400 truncate">{p.uploaderName}</p>
                      </div>
                      <button
                        onClick={(ev) => { ev.stopPropagation(); deletePhoto.mutate({ id: p.id }) }}
                        className="absolute top-2 right-2 p-1 bg-coral/80 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'activity' && activity && (
            <div className="space-y-4">
              <h2 className="font-display text-2xl font-bold">Attività recente</h2>
              <div className="bg-warm-800/30 rounded-2xl border border-warm-700 p-4 space-y-2">
                {activity.map((a, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm py-2 border-b border-warm-700/30 last:border-0">
                    <div className="w-2 h-2 rounded-full bg-success" />
                    <span className="text-warm-500 w-20">{formatDate(a.createdAt)}</span>
                    <span className="text-cream-100">{a.user}</span>
                    <span className="text-warm-500">ha caricato in</span>
                    <span className="text-gold">{a.event}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-charcoal/95 flex items-center justify-center p-8" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white hover:text-coral">
            <X className="w-8 h-8" />
          </button>
          <img src={lightbox} alt="" className="max-w-full max-h-full rounded-xl" />
        </div>
      )}
    </div>
  )
}
