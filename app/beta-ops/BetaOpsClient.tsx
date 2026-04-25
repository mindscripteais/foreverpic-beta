'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Users, Calendar, Image, HardDrive, Activity,
  Trash2, BarChart3, Loader2, X, Search, ArrowUpRight,
  ArrowUp, ArrowDown, Eye, Shield, Upload, UserPlus, PartyPopper,
  Filter, ExternalLink
} from 'lucide-react'
import { trpc } from '@/lib/trpc-client'
import { formatBytes, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui'

export default function BetaOpsClient() {
  const [tab, setTab] = useState<'overview' | 'users' | 'events' | 'photos' | 'activity'>('overview')
  const [lightbox, setLightbox] = useState<string | null>(null)

  // Filters
  const [userSearch, setUserSearch] = useState('')
  const [userTier, setUserTier] = useState<'ALL' | 'FREE' | 'PRO' | 'ENTERPRISE'>('ALL')
  const [eventSearch, setEventSearch] = useState('')
  const [eventPrivacy, setEventPrivacy] = useState<'ALL' | 'PUBLIC' | 'PRIVATE' | 'INVITE_ONLY'>('ALL')
  const [photoEventId, setPhotoEventId] = useState<string>('')

  const { data: stats } = trpc.admin.stats.useQuery()
  const { data: users } = trpc.admin.users.useQuery(
    userSearch ? { search: userSearch } : undefined,
    { enabled: tab === 'users' }
  )
  const { data: events } = trpc.admin.events.useQuery(
    eventSearch || eventPrivacy !== 'ALL'
      ? { search: eventSearch || undefined, privacy: eventPrivacy !== 'ALL' ? eventPrivacy : undefined }
      : undefined,
    { enabled: tab === 'events' }
  )
  const { data: photos } = trpc.admin.photos.useQuery(
    photoEventId ? { eventId: photoEventId } : undefined,
    { enabled: tab === 'photos' }
  )
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

  const filteredUsers = useMemo(() => {
    if (!users) return []
    if (userTier === 'ALL') return users
    return users.filter((u) => u.tier === userTier)
  }, [users, userTier])

  const maxDailyUpload = useMemo(() => {
    if (!stats?.dailyUploads?.length) return 1
    return Math.max(...stats.dailyUploads.map((d) => d.count), 1)
  }, [stats])

  const trendPercent = (today: number, yesterday: number) => {
    if (yesterday === 0) return today > 0 ? 100 : 0
    return Math.round(((today - yesterday) / yesterday) * 100)
  }

  return (
    <div className="min-h-screen bg-charcoal text-cream-100">
      {/* Header */}
      <header className="bg-charcoal border-b border-warm-800 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-coral" />
          <h1 className="font-display text-xl font-bold">Beta Ops Dashboard</h1>
        </div>
        <Link href="/dashboard" className="text-sm text-warm-500 hover:text-cream-100 flex items-center gap-1">
          Torna all&apos;app <ArrowUpRight className="w-4 h-4" />
        </Link>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-56 bg-charcoal border-r border-warm-800 min-h-screen p-4 sticky top-[65px] self-start">
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
          {/* OVERVIEW */}
          {tab === 'overview' && stats && (
            <div className="space-y-6">
              <h2 className="font-display text-2xl font-bold">Overview</h2>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  icon={Users}
                  label="Utenti"
                  value={stats.users}
                  trend={stats.last7DaysUsers}
                  trendLabel="ultimi 7gg"
                  color="coral"
                />
                <StatCard
                  icon={Calendar}
                  label="Eventi"
                  value={stats.events}
                  trend={stats.last7DaysEvents}
                  trendLabel="ultimi 7gg"
                  color="gold"
                />
                <StatCard
                  icon={Image}
                  label="Foto"
                  value={stats.photos}
                  trend={stats.todayUploads}
                  trendLabel="oggi"
                  color="success"
                />
                <StatCard
                  icon={HardDrive}
                  label="Storage totale"
                  value={formatBytes(stats.totalStorage)}
                  trendLabel=""
                  color="coral"
                />
              </div>

              {/* Upload Trend Chart */}
              <div className="bg-warm-800/30 rounded-2xl border border-warm-700 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold">Upload giornalieri</h3>
                    <p className="text-sm text-warm-500">Ultimi 7 giorni</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{stats.todayUploads}</span>
                    {stats.yesterdayUploads > 0 && (
                      <span className={`text-xs flex items-center gap-0.5 ${
                        trendPercent(stats.todayUploads, stats.yesterdayUploads) >= 0
                          ? 'text-success'
                          : 'text-coral'
                      }`}>
                        {trendPercent(stats.todayUploads, stats.yesterdayUploads) >= 0 ? (
                          <ArrowUp className="w-3 h-3" />
                        ) : (
                          <ArrowDown className="w-3 h-3" />
                        )}
                        {Math.abs(trendPercent(stats.todayUploads, stats.yesterdayUploads))}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-end gap-3 h-40">
                  {stats.dailyUploads.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex items-end justify-center h-32">
                        <div
                          className="w-full max-w-[40px] bg-gradient-to-t from-coral to-coral/50 rounded-t-lg transition-all duration-500"
                          style={{ height: `${(d.count / maxDailyUpload) * 100}%`, minHeight: d.count > 0 ? 4 : 0 }}
                        />
                      </div>
                      <span className="text-[10px] text-warm-500">
                        {new Date(d.date).toLocaleDateString('it', { weekday: 'short' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* USERS */}
          {tab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl font-bold">Utenti ({filteredUsers.length})</h2>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-warm-500" />
                    <input
                      type="text"
                      placeholder="Cerca utente..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="bg-warm-800/50 border border-warm-700 rounded-xl pl-9 pr-4 py-2 text-sm text-cream-100 placeholder:text-warm-600 focus:outline-none focus:border-coral w-56"
                    />
                  </div>
                  <select
                    value={userTier}
                    onChange={(e) => setUserTier(e.target.value as any)}
                    className="bg-warm-800/50 border border-warm-700 rounded-xl px-3 py-2 text-sm text-cream-100 focus:outline-none focus:border-coral"
                  >
                    <option value="ALL">Tutti i tier</option>
                    <option value="FREE">Free</option>
                    <option value="PRO">Pro</option>
                    <option value="ENTERPRISE">Enterprise</option>
                  </select>
                </div>
              </div>

              <div className="bg-warm-800/30 rounded-2xl border border-warm-700 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-warm-800/50 text-warm-500">
                    <tr>
                      <th className="text-left px-4 py-3">Utente</th>
                      <th className="text-left px-4 py-3">Tier</th>
                      <th className="text-left px-4 py-3">Eventi</th>
                      <th className="text-left px-4 py-3">Foto</th>
                      <th className="text-left px-4 py-3">Storage</th>
                      <th className="text-left px-4 py-3">Registrato</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="border-t border-warm-700/50 hover:bg-warm-800/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {u.image ? (
                              <img src={u.image} alt="" className="w-9 h-9 rounded-xl object-cover" />
                            ) : (
                              <div className="w-9 h-9 rounded-xl bg-coral/10 flex items-center justify-center text-coral font-semibold text-sm">
                                {(u.name || u.email)?.[0]?.toUpperCase() || 'U'}
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{u.name || '—'}</p>
                              <p className="text-xs text-warm-500">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                            u.tier === 'FREE' ? 'bg-warm-700 text-warm-300' :
                            u.tier === 'PRO' ? 'bg-coral/20 text-coral' :
                            'bg-gold/20 text-gold'
                          }`}>{u.tier}</span>
                        </td>
                        <td className="px-4 py-3">{u.eventCount}</td>
                        <td className="px-4 py-3">{u.photoCount}</td>
                        <td className="px-4 py-3">{formatBytes(u.totalStorage || 0)}</td>
                        <td className="px-4 py-3 text-warm-500">{formatDate(u.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* EVENTS */}
          {tab === 'events' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl font-bold">Eventi ({events?.length ?? 0})</h2>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-warm-500" />
                    <input
                      type="text"
                      placeholder="Cerca evento..."
                      value={eventSearch}
                      onChange={(e) => setEventSearch(e.target.value)}
                      className="bg-warm-800/50 border border-warm-700 rounded-xl pl-9 pr-4 py-2 text-sm text-cream-100 placeholder:text-warm-600 focus:outline-none focus:border-coral w-56"
                    />
                  </div>
                  <select
                    value={eventPrivacy}
                    onChange={(e) => setEventPrivacy(e.target.value as any)}
                    className="bg-warm-800/50 border border-warm-700 rounded-xl px-3 py-2 text-sm text-cream-100 focus:outline-none focus:border-coral"
                  >
                    <option value="ALL">Tutte</option>
                    <option value="PUBLIC">Pubblico</option>
                    <option value="PRIVATE">Privato</option>
                    <option value="INVITE_ONLY">Su invito</option>
                  </select>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-4">
                {events?.map((e) => (
                  <div key={e.id} className="bg-warm-800/30 rounded-2xl border border-warm-700 overflow-hidden group hover:border-warm-600 transition-colors">
                    <div className="flex">
                      {/* Cover or placeholder */}
                      <div className="w-24 h-24 flex-shrink-0 bg-warm-800/50">
                        {e.coverImage ? (
                          <img src={e.coverImage} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Calendar className="w-8 h-8 text-warm-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 p-4 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-semibold truncate">{e.name}</h3>
                            <p className="text-xs text-warm-500 truncate">{e.ownerName || e.ownerEmail}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Link
                              href={`/events/${e.id}`}
                              target="_blank"
                              className="p-1.5 rounded-lg hover:bg-warm-700 text-warm-500 hover:text-cream-100 transition-colors"
                              title="Vedi galleria"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm(`Eliminare "${e.name}"? Questo cancellerà anche tutte le foto.`)) {
                                  deleteEvent.mutate({ id: e.id })
                                }
                              }}
                              className="text-coral hover:text-coral/80 p-1.5"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-xs text-warm-500">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            e.privacy === 'PUBLIC' ? 'bg-success/10 text-success' :
                            e.privacy === 'PRIVATE' ? 'bg-coral/10 text-coral' :
                            'bg-gold/10 text-gold'
                          }`}>{e.privacy}</span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" /> {e.views}
                          </span>
                          <span>{e.photoCount} foto</span>
                          <span>{formatBytes(e.storageUsed)}</span>
                        </div>
                        {e.autoDeleteAt && (
                          <p className="text-[10px] text-coral mt-1.5">
                            Scade il {formatDate(e.autoDeleteAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PHOTOS */}
          {tab === 'photos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl font-bold">Foto recenti ({photos?.length ?? 0})</h2>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-warm-500" />
                  <input
                    type="text"
                    placeholder="Filtra per eventId..."
                    value={photoEventId}
                    onChange={(e) => setPhotoEventId(e.target.value)}
                    className="bg-warm-800/50 border border-warm-700 rounded-xl pl-9 pr-4 py-2 text-sm text-cream-100 placeholder:text-warm-600 focus:outline-none focus:border-coral w-64"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {photos?.map((p) => (
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
                        <p className="text-[10px] text-warm-500">{formatBytes(p.size)}</p>
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

          {/* ACTIVITY */}
          {tab === 'activity' && activity && (
            <div className="space-y-4">
              <h2 className="font-display text-2xl font-bold">Attività recente</h2>
              <div className="bg-warm-800/30 rounded-2xl border border-warm-700 overflow-hidden">
                {activity.map((a, i) => {
                  const icons = {
                    upload: { icon: Upload, color: 'text-success', bg: 'bg-success/10' },
                    register: { icon: UserPlus, color: 'text-coral', bg: 'bg-coral/10' },
                    event: { icon: PartyPopper, color: 'text-gold', bg: 'bg-gold/10' },
                  }
                  const cfg = icons[a.type]
                  const Icon = cfg.icon
                  return (
                    <div
                      key={`${a.type}-${a.id}-${i}`}
                      className="flex items-center gap-3 px-4 py-3 border-b border-warm-700/30 last:border-0 hover:bg-warm-800/30 transition-colors"
                    >
                      <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-4 h-4 ${cfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="text-cream-100 font-medium">{a.user}</span>{' '}
                          <span className="text-warm-500">
                            {a.type === 'upload' && 'ha caricato una foto in'}
                            {a.type === 'register' && 'si è registrato'}
                            {a.type === 'event' && 'ha creato l\'evento'}
                          </span>{' '}
                          {a.type !== 'register' && <span className="text-gold">{a.event}</span>}
                        </p>
                        <p className="text-xs text-warm-600">{formatDate(a.createdAt)}</p>
                      </div>
                    </div>
                  )
                })}
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

function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  trendLabel,
  color,
}: {
  icon: any
  label: string
  value: string | number
  trend?: number
  trendLabel: string
  color: 'coral' | 'gold' | 'success'
}) {
  const colorMap = {
    coral: 'text-coral',
    gold: 'text-gold',
    success: 'text-success',
  }
  return (
    <div className="bg-warm-800/50 rounded-2xl p-5 border border-warm-700 hover:border-warm-600 transition-colors">
      <Icon className={`w-5 h-5 ${colorMap[color]} mb-3`} />
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm text-warm-500">{label}</p>
      {trend !== undefined && trendLabel && (
        <p className="text-xs text-warm-400 mt-1.5">
          {trend > 0 && <span className="text-success">+{trend} </span>}
          {trend === 0 && <span>0 </span>}
          {trendLabel}
        </p>
      )}
    </div>
  )
}
