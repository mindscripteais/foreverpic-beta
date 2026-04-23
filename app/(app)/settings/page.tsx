'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CreditCard, User, Shield, Check, Loader2, Crown, Sparkles, Building2 } from 'lucide-react'
import { trpc } from '@/lib/trpc-client'
import { Button } from '@/components/ui'
import { Sidebar } from '@/components/layout'
import { formatBytes } from '@/lib/utils'
import { useState } from 'react'

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const [billingAnchor, setBillingAnchor] = useState(false)

  const { data: userData, isLoading } = trpc.user.me.useQuery()

  const createCheckoutPro = trpc.user.createCheckoutSession.useMutation()
  const createCheckoutEnterprise = trpc.user.createCheckoutSession.useMutation()

  if (status === 'unauthenticated') {
    redirect('/signin')
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-100">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const user = session?.user
  const tier = userData?.tier || 'FREE'
  const limits = userData?.limits
  const subscription = userData?.subscription

  const handleUpgrade = async (tier: 'PRO' | 'ENTERPRISE') => {
    const mutation = tier === 'PRO' ? createCheckoutPro : createCheckoutEnterprise
    const result = await mutation.mutateAsync({ tier })
    if (result.url) {
      window.location.href = result.url
    }
  }

  const tierDisplayInfo = {
    FREE: {
      name: 'Free',
      price: '€0',
      period: '/mo',
      storage: limits ? formatBytes(limits.storagePerEvent) : '500MB',
      events: limits ? (limits.eventsPerMonth === Infinity ? 'Unlimited' : `${limits.eventsPerMonth}/mo`) : '3/mo',
      features: ['500MB di spazio per evento', '3 eventi al mese', 'QR code base', 'Watermark sulle foto'],
      isCurrent: tier === 'FREE',
      isPopular: false,
      icon: Sparkles,
      gradient: 'from-warm-100 to-cream-100',
      border: 'border-warm-300/40',
    },
    PRO: {
      name: 'Pro',
      price: '€9',
      period: '/mo',
      storage: limits ? formatBytes(limits.storagePerEvent) : '5GB',
      events: 'Unlimited',
      features: ['5GB di spazio per evento', 'Eventi illimitati', 'Nessun watermark', '5 collaboratori', 'QR senza scadenza'],
      isCurrent: tier === 'PRO',
      isPopular: true,
      icon: Crown,
      gradient: 'from-primary/5 to-secondary/5',
      border: 'border-primary/30',
    },
    ENTERPRISE: {
      name: 'Enterprise',
      price: '€29',
      period: '/mo',
      storage: limits ? formatBytes(limits.storagePerEvent) : '50GB',
      events: 'Unlimited',
      features: ['50GB di spazio per evento', 'Tutto illimitato', 'Nessun watermark', 'Collaboratori illimitati', 'Supporto prioritario'],
      isCurrent: tier === 'ENTERPRISE',
      isPopular: false,
      icon: Building2,
      gradient: 'from-accent/5 to-amber-50',
      border: 'border-accent/30',
    },
  }

  return (
    <div className="min-h-screen bg-cream-100 flex">
      <Sidebar user={{
        name: user?.name,
        email: user?.email,
        image: user?.image,
        tier: (session as any)?.subscriptionTier || 'FREE'
      }} />

      <main className="flex-1 p-6 lg:p-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-charcoal">Impostazioni</h1>
          <p className="text-warm-500 text-sm mt-1">Gestisci il tuo account e l'abbonamento</p>
        </div>

        {/* Profile Card */}
        <section className="bg-cream-100 rounded-2xl border border-warm-300/40 p-6 mb-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-warm-500" />
            Profilo
          </h2>
          <div className="flex items-center gap-4">
            {user?.image ? (
              <img src={user.image} alt="" className="w-16 h-16 rounded-2xl" />
            ) : (
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center text-white text-xl font-semibold">
                {user?.name?.[0] || 'U'}
              </div>
            )}
            <div className="flex-1">
              <p className="font-semibold text-lg text-charcoal">{userData?.name || user?.name || 'User'}</p>
              <p className="text-warm-500 text-sm">{userData?.email || user?.email}</p>
            </div>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
              tier === 'FREE' ? 'bg-warm-100 text-warm-600' :
              tier === 'PRO' ? 'bg-primary/10 text-primary' :
              'bg-accent/10 text-accent'
            }`}>
              <Shield className="w-4 h-4" />
              Piano {tierDisplayInfo[tier].name}
            </div>
          </div>
        </section>

        {/* Subscription Plans */}
        <section className="mb-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-warm-500" />
            Piani di abbonamento
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {(['FREE', 'PRO', 'ENTERPRISE'] as const).map((tierKey) => {
              const plan = tierDisplayInfo[tierKey]
              const Icon = plan.icon
              return (
                <div
                  key={tierKey}
                  className={`relative bg-gradient-to-br ${plan.gradient} rounded-2xl border-2 ${plan.border} p-6 transition-all hover:shadow-lg ${
                    plan.isCurrent ? 'ring-2 ring-primary ring-offset-2' : ''
                  }`}
                >
                  {plan.isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-secondary text-white text-xs font-semibold px-4 py-1 rounded-full shadow-lg">
                      Più popolare
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      plan.isCurrent ? 'bg-primary text-white' : 'bg-white text-warm-600'
                    }`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg text-charcoal">{plan.name}</p>
                      <p className="text-sm text-warm-500">{plan.storage}/evento</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <span className="text-3xl font-bold text-charcoal">{plan.price}</span>
                    <span className="text-warm-500">{plan.period}</span>
                  </div>

                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-warm-600">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {plan.isCurrent ? (
                    <div className="w-full py-2.5 text-center bg-green-100 text-green-700 rounded-xl text-sm font-medium">
                      Piano attuale
                    </div>
                  ) : (
                    <Button
                      className={`w-full ${
                        tierKey === 'PRO' ? 'shadow-lg shadow-primary/20' :
                        tierKey === 'ENTERPRISE' ? 'shadow-lg shadow-accent/20' : ''
                      }`}
                      variant={tierKey === 'FREE' ? 'secondary' : tierKey === 'PRO' ? 'primary' : 'accent'}
                      onClick={() => tierKey !== 'FREE' && handleUpgrade(tierKey)}
                      loading={createCheckoutPro.isPending || createCheckoutEnterprise.isPending}
                    >
                      {tier === 'FREE'
                        ? (tierKey === 'FREE' ? 'Piano attuale' : 'Passa a Pro')
                        : tierKey === 'FREE'
                          ? 'Passa a Free'
                          : tierKey === tier
                            ? 'Piano attuale'
                            : 'Cambia'}
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* Usage Stats */}
        <section className="bg-cream-100 rounded-2xl border border-warm-300/40 p-6">
          <h2 className="font-semibold mb-4">Utilizzo questo mese</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-warm-600">Eventi creati</span>
                <span className="font-mono font-medium">
                  {userData?.eventCount || 0} / {limits?.eventsPerMonth === Infinity ? '∞' : limits?.eventsPerMonth || 3}
                </span>
              </div>
              <div className="h-2 bg-warm-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-secondary transition-all"
                  style={{
                    width: `${Math.min(100, ((userData?.eventCount || 0) / (limits?.eventsPerMonth || 3)) * 100)}%`
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm">
                <span className="text-warm-600">Spazio usato</span>
                <span className="font-mono font-medium">
                  {userData?.totalStorageUsed ? formatBytes(userData.totalStorageUsed) : '0 Bytes'}
                </span>
              </div>
            </div>
            <p className="text-sm text-warm-500 pt-2 border-t border-warm-100">
              {tier === 'FREE' ? 'Passa a Pro per eventi illimitati e più spazio' : 'Goditi i vantaggi del tuo abbonamento!'}
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}
