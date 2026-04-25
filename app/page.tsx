'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { ArrowRight, QrCode, Zap, Shield, Users, Download, Heart, Camera, Star, Sparkles, ChevronRight, Smartphone, ScanLine, Images, Menu, X } from 'lucide-react'
import { useInView } from '@/hooks/useInView'

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const { ref, isInView } = useInView()

  useEffect(() => {
    if (!isInView) return
    let start = 0
    const duration = 1500
    const increment = target / (duration / 16)
    const timer = setInterval(() => {
      start += increment
      if (start >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [isInView, target])

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, isInView } = useInView()
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${className} ${
        isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

export default function HomePage() {
  const { data: session } = useSession()
  const isLoggedIn = !!session?.user
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-100 to-white overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-cream-100/80 backdrop-blur-md border-b border-warm-300/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href={isLoggedIn ? '/dashboard' : '/'} className="font-display font-semibold text-charcoal text-xl group-hover:text-coral transition-colors">
              ForeverPic
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-warm-600 hover:text-charcoal text-sm font-medium transition-colors">Funzionalità</Link>
              <Link href="#how-it-works" className="text-warm-600 hover:text-charcoal text-sm font-medium transition-colors">Come funziona</Link>
              <Link href="#pricing" className="text-warm-600 hover:text-charcoal text-sm font-medium transition-colors">Prezzi</Link>
              <Link href="/signin" className="text-warm-600 hover:text-charcoal text-sm font-medium transition-colors">Accedi</Link>
            </nav>

            <div className="flex items-center gap-3">
              <Link href="/signup" className="hidden md:inline-flex items-center gap-2 bg-coral text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-glow hover:bg-coral/90 transition-all hover:scale-[1.02] active:scale-[0.98]">
                Inizia ora
              </Link>
              {/* Mobile menu button */}
              <button
                className="md:hidden p-2 rounded-xl hover:bg-warm-200 text-warm-600 transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-cream-100 border-b border-warm-300/40 px-4 py-4 space-y-3">
            <Link href="#features" onClick={() => setMobileMenuOpen(false)} className="block text-warm-600 hover:text-charcoal text-sm font-medium py-2">Funzionalità</Link>
            <Link href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block text-warm-600 hover:text-charcoal text-sm font-medium py-2">Come funziona</Link>
            <Link href="#pricing" onClick={() => setMobileMenuOpen(false)} className="block text-warm-600 hover:text-charcoal text-sm font-medium py-2">Prezzi</Link>
            <Link href="/signin" onClick={() => setMobileMenuOpen(false)} className="block text-warm-600 hover:text-charcoal text-sm font-medium py-2">Accedi</Link>
            <Link href="/signup" onClick={() => setMobileMenuOpen(false)} className="block w-full text-center py-3 bg-coral text-white font-semibold rounded-xl shadow-glow">
              Inizia ora
            </Link>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Animated floating shapes */}
        <div className="absolute top-20 left-[10%] w-64 h-64 bg-coral/15 rounded-full blur-3xl pointer-events-none animate-float" />
        <div className="absolute top-40 right-[5%] w-80 h-80 bg-gold/15 rounded-full blur-3xl pointer-events-none animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-coral/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-60 left-[60%] w-40 h-40 bg-success/10 rounded-full blur-2xl pointer-events-none animate-pulse-soft" />

        <div className="relative max-w-7xl mx-auto text-center">
          <Reveal>
            <img
              src="/foreverpic.png"
              alt="ForeverPic"
              className="w-24 h-24 md:w-32 md:h-32 mx-auto mb-6 rounded-2xl shadow-card"
            />
          </Reveal>

          <Reveal delay={50}>
            <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-cream-100 rounded-full shadow-soft border border-warm-300/50 mb-8 hover:shadow-elevated transition-shadow cursor-default">
              <span className="w-2 h-2 bg-success rounded-full animate-pulse-soft" />
              <span className="text-sm font-medium text-warm-700">Ora con upload collaborativi in tempo reale</span>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold text-charcoal mb-6 leading-tight">
              Gallerie foto per<br />
              <span className="bg-gradient-to-r from-coral via-coral/90 to-gold bg-clip-text text-transparent">
                ogni evento
              </span>
            </h1>
          </Reveal>

          <Reveal delay={200}>
            <p className="text-xl text-warm-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              Genera un QR code, condividilo con gli ospiti, raccogli le foto in tempo reale.
              Gli ospiti non hanno bisogno di un account. Pulito, semplice, potente.
            </p>
          </Reveal>

          <Reveal delay={300}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup" className="inline-flex items-center justify-center gap-2 bg-coral text-white text-lg font-semibold px-8 py-3.5 rounded-xl shadow-glow hover:bg-coral/90 transition-all hover:scale-[1.02] active:scale-[0.98] group">
                Crea il tuo evento <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="#demo" className="inline-flex items-center justify-center gap-2 bg-warm-200 text-charcoal text-lg font-semibold px-8 py-3.5 rounded-xl hover:bg-warm-300 transition-all hover:scale-[1.02]">
                <Camera className="w-5 h-5" />
                Vedi la demo
              </Link>
            </div>
          </Reveal>

          {/* Social proof with animated counters */}
          <Reveal delay={400}>
            <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-warm-600">
              <div className="flex items-center gap-3 bg-cream-100 rounded-full px-4 py-2 border border-warm-300/30 shadow-soft">
                <div className="flex -space-x-2">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-coral to-coral/70 flex items-center justify-center text-white text-xs font-bold border-2 border-cream-100">MR</div>
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold to-amber-500 flex items-center justify-center text-white text-xs font-bold border-2 border-cream-100">AL</div>
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-success to-emerald-500 flex items-center justify-center text-white text-xs font-bold border-2 border-cream-100">GS</div>
                </div>
                <span className="font-semibold"><AnimatedCounter target={2400} suffix="+" /> eventi creati</span>
              </div>
              <div className="flex items-center gap-2 bg-cream-100 rounded-full px-4 py-2 border border-warm-300/30 shadow-soft">
                <Heart className="w-4 h-4 text-coral fill-coral animate-pulse-soft" />
                <span className="font-semibold"><AnimatedCounter target={50000} suffix="+" /> foto condivise</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* App Preview — Real UI Mockups */}
      <section id="demo" className="py-20 px-4 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="text-center mb-14">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-charcoal mb-3">Vedi ForeverPic in azione</h2>
              <p className="text-warm-600 text-lg max-w-xl mx-auto">
                Tre semplici passaggi. Nessuna app da installare per gli ospiti.
              </p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Crea il tuo evento',
                desc: 'Scegli nome, data e privacy. Generiamo automaticamente un QR code unico.',
                icon: Sparkles,
                mockup: (
                  <div className="bg-white rounded-xl border border-warm-300/40 p-4 shadow-soft">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 rounded-full bg-coral/20" />
                      <div className="w-3 h-3 rounded-full bg-gold/20" />
                      <div className="w-3 h-3 rounded-full bg-warm-300" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-2.5 bg-warm-200 rounded w-3/4" />
                      <div className="h-2.5 bg-warm-200 rounded w-1/2" />
                      <div className="h-8 bg-gradient-to-r from-coral/10 to-gold/10 rounded-lg mt-2" />
                    </div>
                  </div>
                ),
              },
              {
                step: '02',
                title: 'Condividi il QR',
                desc: 'Stampalo, mostralo su uno schermo o condividilo via WhatsApp. Gli ospiti scansionano e caricano.',
                icon: ScanLine,
                mockup: (
                  <div className="bg-white rounded-xl border border-warm-300/40 p-4 shadow-soft flex flex-col items-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-coral to-gold rounded-xl flex items-center justify-center mb-2">
                      <QrCode className="w-10 h-10 text-white" />
                    </div>
                    <div className="h-2 bg-warm-200 rounded w-16" />
                  </div>
                ),
              },
              {
                step: '03',
                title: 'Raccogli le foto',
                desc: 'Le foto appaiono in tempo reale nella galleria. Reazioni, voti e download inclusi.',
                icon: Images,
                mockup: (
                  <div className="bg-white rounded-xl border border-warm-300/40 p-4 shadow-soft">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="aspect-square bg-coral/10 rounded-lg" />
                      <div className="aspect-square bg-gold/10 rounded-lg" />
                      <div className="aspect-square bg-success/10 rounded-lg" />
                      <div className="aspect-square bg-charcoal/5 rounded-lg flex items-center justify-center">
                        <span className="text-xs text-warm-500 font-medium">+12</span>
                      </div>
                    </div>
                  </div>
                ),
              },
            ].map((item, i) => (
              <Reveal key={i} delay={i * 150}>
                <div className="bg-cream-100 rounded-2xl border border-warm-300/40 p-6 hover:shadow-elevated transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl font-bold font-display text-coral/30">{item.step}</span>
                    <div className="w-10 h-10 bg-gradient-to-br from-coral/10 to-gold/10 rounded-xl flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-coral" />
                    </div>
                  </div>
                  <h3 className="font-display text-xl font-bold text-charcoal mb-2">{item.title}</h3>
                  <p className="text-warm-600 text-sm leading-relaxed mb-5">{item.desc}</p>
                  {item.mockup}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-24 px-4 bg-warm-100/50">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-charcoal mb-4">Perché ForeverPic?</h2>
              <p className="text-warm-600 text-lg max-w-2xl mx-auto">
                Pensato per eventi reali — matrimoni, feste, conferenze, reunion.
              </p>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: QrCode,
                gradient: 'from-coral to-coral/80',
                shadow: 'group-hover:shadow-coral/20',
                title: 'Galleria QR Code',
                desc: 'Genera un QR code per il tuo evento. Gli ospiti scansionano e caricano le foto direttamente — nessuna app da scaricare.'
              },
              {
                icon: Zap,
                gradient: 'from-gold to-amber-500',
                shadow: 'group-hover:shadow-gold/20',
                title: 'Aggiornamenti in tempo reale',
                desc: 'Le foto appaiono in diretta mentre gli ospiti le caricano. Guarda la galleria riempirsi in tempo reale.'
              },
              {
                icon: Shield,
                gradient: 'from-success to-emerald-500',
                shadow: 'group-hover:shadow-success/20',
                title: 'Controllo privacy',
                desc: 'Pubblico, privato o solo su invito. Tu controlli chi vede cosa. I QR possono scadere quando vuoi.'
              },
              {
                icon: Users,
                gradient: 'from-charcoal to-charcoal/80',
                shadow: 'group-hover:shadow-charcoal/10',
                title: 'Collaborativo',
                desc: 'Più ospiti possono caricare simultaneamente. Nessun conflitto, nessuna attesa. Tutti contribuiscono.'
              },
              {
                icon: Download,
                gradient: 'from-coral/80 to-gold/60',
                shadow: 'group-hover:shadow-coral/20',
                title: 'Download facili',
                desc: 'Scarica tutte le foto con un click. Qualità originale, nessuna compressione. Anche in bulk come ZIP.'
              },
              {
                icon: Heart,
                gradient: 'from-coral/70 to-coral',
                shadow: 'group-hover:shadow-coral/20',
                title: 'Reazioni e voti',
                desc: 'Lascia che gli ospiti reagiscano con cuori o votino le preferite. Scopri quali foto piacciono di più.'
              },
            ].map((feature, i) => (
              <Reveal key={i} delay={i * 100}>
                <div className={`group bg-cream-100 p-6 rounded-2xl border border-warm-300/40 hover:shadow-elevated ${feature.shadow} hover:-translate-y-2 transition-all duration-300 cursor-default`}>
                  <div className={`w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-soft`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-display font-semibold text-lg text-charcoal mb-2">{feature.title}</h3>
                  <p className="text-warm-600 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-charcoal mb-4">Come funziona</h2>
              <p className="text-warm-600 text-lg">Tre semplici passi per la tua galleria</p>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Crea l\'evento', desc: 'Registrati gratis, crea il tuo evento, personalizza l\'aspetto', icon: Sparkles },
              { step: '02', title: 'Condividi il QR', desc: 'Stampa il QR code o condividilo digitalmente con i tuoi ospiti', icon: QrCode },
              { step: '03', title: 'Raccogli le foto', desc: 'Guarda le foto apparire in tempo reale mentre gli ospiti le caricano', icon: Camera },
            ].map((item, i) => (
              <Reveal key={i} delay={i * 150}>
                <div className="relative text-center group">
                  <div className="w-20 h-20 bg-gradient-to-br from-coral to-gold rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-glow group-hover:scale-110 group-hover:shadow-elevated transition-all duration-300">
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="font-display text-5xl font-bold text-warm-200 mb-3">{item.step}</div>
                  <h3 className="font-display font-semibold text-xl text-charcoal mb-2">{item.title}</h3>
                  <p className="text-warm-600 text-sm">{item.desc}</p>
                  {i < 2 && (
                    <div className="hidden md:block absolute top-10 left-[65%] w-full">
                      <ChevronRight className="w-8 h-8 text-warm-300 animate-pulse-soft" />
                    </div>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4 bg-warm-100/50">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-charcoal mb-4">Amato dagli organizzatori</h2>
              <p className="text-warm-600 text-lg">Scopri cosa dicono di ForeverPic</p>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'Marco Rossi',
                role: 'Wedding Planner',
                text: 'ForeverPic ha reso facilissimo raccogliere le foto del nostro matrimonio. Gli ospiti hanno adorato scansionare il QR code!',
                stars: 5,
              },
              {
                name: 'Anna Lombardi',
                role: 'Organizzatrice di eventi',
                text: 'L\'abbiamo usato per un evento aziendale con 200+ partecipanti. La galleria in tempo reale è stata un successo.',
                stars: 5,
              },
              {
                name: 'Giulia Bianchi',
                role: 'Festeggiata',
                text: 'Basta cercare le foto tra la gente. Tutti hanno caricato all\'istante. La migliore app per eventi!',
                stars: 5,
              },
            ].map((t, i) => (
              <Reveal key={i} delay={i * 100}>
                <div className="bg-cream-100 rounded-2xl border border-warm-300/40 p-6 hover:shadow-elevated hover:-translate-y-1 transition-all duration-300">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: t.stars }).map((_, s) => (
                      <Star key={s} className="w-4 h-4 text-gold fill-gold" />
                    ))}
                  </div>
                  <p className="text-charcoal text-sm leading-relaxed mb-4">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-coral to-gold flex items-center justify-center text-white text-sm font-bold">
                      {t.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-charcoal">{t.name}</p>
                      <p className="text-xs text-warm-500">{t.role}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Storage Calculator */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <Reveal>
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-charcoal mb-4">Quanto puoi caricare?</h2>
              <p className="text-warm-600 text-lg max-w-2xl mx-auto">
                Fai una stima rapida in base alla qualità delle tue foto.
              </p>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { label: 'Foto basic', mb: 2, desc: 'Social / chat' },
              { label: 'Foto alta qualità', mb: 5, desc: 'Smartphone moderno' },
              { label: 'Foto professionale', mb: 12, desc: 'RAW / Pro camera' },
            ].map((quality) => {
              const freePhotos = Math.floor(500 / quality.mb)
              const proPhotos = Math.floor(5120 / quality.mb)
              return (
                <Reveal key={quality.label} delay={100}>
                  <div className="bg-cream-100 rounded-2xl border border-warm-300/40 p-6 text-center">
                    <p className="text-sm font-medium text-warm-500 mb-1">{quality.desc}</p>
                    <p className="text-lg font-semibold text-charcoal mb-4">{quality.label}</p>
                    <div className="flex items-center justify-center gap-4 mb-4">
                      <div className="text-center">
                        <p className="text-3xl font-bold font-display text-coral">{freePhotos.toLocaleString()}</p>
                        <p className="text-xs text-warm-500">foto (Free)</p>
                      </div>
                      <div className="w-px h-10 bg-warm-300" />
                      <div className="text-center">
                        <p className="text-3xl font-bold font-display text-gold">{proPhotos.toLocaleString()}</p>
                        <p className="text-xs text-warm-500">foto (Pro)</p>
                      </div>
                    </div>
                    <p className="text-xs text-warm-400">~{quality.mb} MB a foto</p>
                  </div>
                </Reveal>
              )
            })}
          </div>
          <p className="text-center text-sm text-warm-500 mt-8">
            I calcoli sono approssimativi. La dimensione reale dipende dal dispositivo e dalle impostazioni.
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-4 bg-warm-100/50">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-charcoal mb-4">Prezzi semplici</h2>
              <p className="text-warm-600 text-lg max-w-2xl mx-auto">
                Inizia gratis. Passa a Pro quando ti serve più spazio e funzioni.
              </p>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free */}
            <Reveal delay={0}>
              <div className="bg-cream-100 rounded-2xl border-2 border-warm-300/40 p-8 hover:shadow-elevated transition-all duration-300 hover:-translate-y-1">
                <div className="text-sm font-semibold text-warm-500 uppercase tracking-wide mb-2">Free</div>
                <div className="text-5xl font-bold font-display text-charcoal mb-1">€0<span className="text-xl font-normal text-warm-500">/mese</span></div>
                <p className="text-warm-500 text-sm mb-6">Perfetto per provarlo</p>
                <ul className="space-y-3 mb-8">
                  {[
                    { check: true, text: '500MB di spazio per evento' },
                    { check: true, text: '~100 foto ad alta qualità' },
                    { check: true, text: '3 eventi al mese' },
                    { check: true, text: 'QR code base' },
                    { check: false, text: 'Filigrana sulle foto' },
                  ].map((item, i) => (
                    <li key={i} className={`flex items-center gap-3 text-sm ${item.check ? 'text-charcoal' : 'text-warm-400'}`}>
                      {item.check ? (
                        <span className="w-5 h-5 rounded-full bg-success/10 text-success flex items-center justify-center text-xs font-bold">✓</span>
                      ) : (
                        <span className="w-5 h-5 rounded-full bg-warm-200 text-warm-400 flex items-center justify-center text-xs">✗</span>
                      )}
                      {item.text}
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className="block w-full text-center py-3 bg-warm-200 text-charcoal font-semibold rounded-xl hover:bg-warm-300 transition-colors">
                  Inizia gratis
                </Link>
              </div>
            </Reveal>
            {/* Pro */}
            <Reveal delay={100}>
              <div className="bg-cream-100 rounded-2xl border-2 border-coral p-8 relative shadow-elevated hover:shadow-glow transition-all duration-300 hover:-translate-y-2">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-coral to-gold text-white text-sm font-semibold px-4 py-1.5 rounded-full shadow-glow animate-pulse-soft">
                  Più popolare
                </div>
                <div className="text-sm font-semibold text-coral uppercase tracking-wide mb-2">Pro</div>
                <div className="text-5xl font-bold font-display text-charcoal mb-1">€9<span className="text-xl font-normal text-warm-500">/mese</span></div>
                <p className="text-warm-500 text-sm mb-6">Per eventi frequenti</p>
                <ul className="space-y-3 mb-8">
                  {[
                    { check: true, text: '5GB di spazio per evento' },
                    { check: true, text: '~1.000 foto ad alta qualità' },
                    { check: true, text: 'Eventi illimitati' },
                    { check: true, text: 'Nessuna filigrana' },
                    { check: true, text: '5 collaboratori' },
                    { check: true, text: 'QR senza scadenza' },
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-charcoal">
                      <span className="w-5 h-5 rounded-full bg-success/10 text-success flex items-center justify-center text-xs font-bold">✓</span>
                      {item.text}
                    </li>
                  ))}
                </ul>
                <Link href="/signup?tier=pro" className="block w-full text-center py-3 bg-coral text-white font-semibold rounded-xl shadow-glow hover:bg-coral/90 transition-all hover:scale-[1.02]">
                  Passa a Pro
                </Link>
              </div>
            </Reveal>
            {/* Enterprise */}
            <Reveal delay={200}>
              <div className="bg-cream-100 rounded-2xl border-2 border-warm-300/40 p-8 hover:shadow-elevated transition-all duration-300 hover:-translate-y-1">
                <div className="text-sm font-semibold text-warm-500 uppercase tracking-wide mb-2">Enterprise</div>
                <div className="text-5xl font-bold font-display text-charcoal mb-1">€29<span className="text-xl font-normal text-warm-500">/mese</span></div>
                <p className="text-warm-500 text-sm mb-6">Per eventi di grandi dimensioni</p>
                <ul className="space-y-3 mb-8">
                  {[
                    { check: true, text: '50GB di spazio per evento' },
                    { check: true, text: 'Tutto illimitato' },
                    { check: true, text: 'Nessuna filigrana' },
                    { check: true, text: 'Collaboratori illimitati' },
                    { check: true, text: 'Supporto prioritario' },
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-charcoal">
                      <span className="w-5 h-5 rounded-full bg-success/10 text-success flex items-center justify-center text-xs font-bold">✓</span>
                      {item.text}
                    </li>
                  ))}
                </ul>
                <Link href="/signup?tier=enterprise" className="block w-full text-center py-3 bg-warm-200 text-charcoal font-semibold rounded-xl hover:bg-warm-300 transition-colors">
                  Inizia Enterprise
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <Reveal>
            <div className="bg-gradient-to-br from-coral via-coral/90 to-gold rounded-3xl p-12 text-white shadow-glow hover:shadow-elevated transition-shadow duration-500 relative overflow-hidden">
              {/* Decorative circles */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />

              <div className="relative">
                <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Pronto a condividere il tuo evento?</h2>
                <p className="text-white/80 text-lg mb-8 max-w-lg mx-auto">
                  Crea il tuo primo evento in meno di un minuto. Nessuna carta di credito richiesta.
                </p>
                <Link href="/signup" className="inline-flex items-center gap-2 bg-white text-coral font-semibold px-8 py-4 rounded-xl hover:bg-cream-100 transition-colors shadow-elevated group">
                  Inizia gratis <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-warm-300/40 bg-warm-100/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Link href="/" className="font-display font-semibold text-charcoal text-lg group-hover:text-coral transition-colors">
              ForeverPic
            </Link>
            <div className="flex items-center gap-6 text-sm text-warm-600">
              <Link href="#" className="hover:text-charcoal transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-charcoal transition-colors">Termini</Link>
              <Link href="#" className="hover:text-charcoal transition-colors">Contatti</Link>
            </div>
            <p className="text-sm text-warm-500">© 2026 ForeverPic</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
