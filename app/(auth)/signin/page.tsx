'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Eye, EyeOff, Loader2, Chrome, ArrowRight, Camera } from 'lucide-react'
import { Logo, LogoIcon } from '@/components/ui'

export default function SignInPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = e.currentTarget
    const email = (form.elements.namedItem('email') as HTMLInputElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError('Email o password non validi')
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  async function handleGoogle() {
    await signIn('google', { callbackUrl: '/dashboard' })
  }

  return (
    <div className="min-h-screen flex bg-cream-100">
      {/* Left - Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 mb-10 group">
            <LogoIcon size="md" className="group-hover:scale-105 transition-transform" />
            <Logo size="md" />
          </Link>

          <h1 className="font-display text-3xl font-bold text-charcoal mb-2">Bentornato</h1>
          <p className="text-warm-600 mb-8">Accedi per gestire i tuoi eventi</p>

          {error && (
            <div className="mb-6 p-4 bg-coral/5 border border-coral/20 rounded-xl text-coral text-sm flex items-center gap-2">
              <span className="w-2 h-2 bg-coral rounded-full" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-charcoal mb-1.5">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-warm-300 bg-white focus:outline-none focus:ring-2 focus:ring-coral/50 focus:border-coral transition-all"
                placeholder="tu@esempio.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-charcoal mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-warm-300 bg-white focus:outline-none focus:ring-2 focus:ring-coral/50 focus:border-coral transition-all pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-500 hover:text-charcoal transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <Link href="/forgot-password" className="text-sm text-coral hover:underline font-semibold">
                Password dimenticata?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-coral text-white font-semibold rounded-xl hover:bg-coral/90 transition-all shadow-glow disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Accedi'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-warm-300" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-cream-100 px-4 text-sm text-warm-500">Oppure continua con</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-warm-300 rounded-xl hover:bg-warm-200 transition-all text-sm font-semibold text-charcoal"
          >
            <Chrome className="w-5 h-5" />
            Accedi con Google
          </button>

          <p className="mt-8 text-center text-sm text-warm-600">
            Non hai un account?{' '}
            <Link href="/signup" className="text-coral hover:underline font-semibold">
              Registrati gratis
            </Link>
          </p>
        </div>
      </div>

      {/* Right - Visual */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        {/* Background gradient — warm coral to gold */}
        <div className="absolute inset-0 bg-gradient-to-br from-coral via-coral/90 to-gold" />

        {/* Decorative elements */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl" />

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12 text-white">
          <div className="mb-8">
            <LogoIcon size="lg" className="scale-150" />
          </div>
          <h2 className="font-display text-4xl font-bold text-center mb-4 leading-tight">
            Condividi momenti,<br />non file
          </h2>
          <p className="text-white/80 text-center text-lg max-w-md mb-8">
            Crea la galleria del tuo evento in secondi e lascia che gli ospiti carichino foto con un semplice scan QR.
          </p>

          {/* Feature highlights */}
          <div className="space-y-3 text-left">
            {[
              'QR code generati istantaneamente',
              'Nessuna app da scaricare per gli ospiti',
              'Raccolta foto in tempo reale',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-white/90">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-xs font-bold">✓</span>
                </div>
                <span className="text-sm font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}