'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Calendar, Settings, CreditCard, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { TierBadge } from '@/components/ui'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { LogoIcon } from '@/components/ui/logo'

interface SidebarProps {
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
    tier?: 'FREE' | 'PRO' | 'ENTERPRISE'
  }
}

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/events', icon: Calendar, label: 'Eventi' },
  { href: '/settings', icon: Settings, label: 'Impostazioni' },
  { href: '/settings#billing', icon: CreditCard, label: 'Fatturazione' },
]

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-cream-100 rounded-xl shadow-soft"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-5 h-5 text-charcoal" /> : <Menu className="w-5 h-5 text-charcoal" />}
      </button>

      {/* Backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-charcoal/40 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-40 w-68 bg-cream-100 border-r border-warm-300/40 flex flex-col transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="h-18 px-6 flex items-center gap-3 border-b border-warm-300/40">
          <LogoIcon size="md" />
          <span className="font-display text-xl font-semibold text-charcoal">ForeverPic</span>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`)
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200',
                  active
                    ? 'bg-coral/10 text-coral shadow-soft'
                    : 'text-warm-600 hover:bg-warm-200/50 hover:text-charcoal'
                )}
              >
                <Icon className={cn('w-5 h-5', active ? 'text-coral' : 'text-warm-500')} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-warm-300/40">
          {user && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-warm-200/50 mb-3">
              {user.image ? (
                <img src={user.image} alt="" className="w-11 h-11 rounded-xl object-cover" />
              ) : (
                <div className="w-11 h-11 rounded-xl bg-coral/10 flex items-center justify-center text-coral font-semibold text-lg">
                  {user.name?.[0] || 'U'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate text-charcoal">{user.name || 'Utente'}</p>
                <div className="flex items-center gap-2 mt-1">
                  <TierBadge tier={user.tier || 'FREE'} />
                </div>
              </div>
            </div>
          )}
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-warm-600 hover:bg-warm-200/50 hover:text-charcoal transition-all"
          >
            <LogOut className="w-5 h-5" />
            Esci
          </button>
        </div>
      </aside>
    </>
  )
}