export const metadata = {
  title: 'Termini di Servizio — ForeverPic',
  description: 'Termini di servizio di ForeverPic',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-cream-100 py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-display text-3xl font-bold text-charcoal mb-8">Termini di Servizio</h1>
        <div className="prose prose-warm text-warm-700 space-y-4">
          <p>Ultimo aggiornamento: 23 aprile 2026</p>
          <p>
            Benvenuto su ForeverPic. Utilizzando il nostro servizio, accetti i seguenti termini.
          </p>
          <h2 className="font-display text-xl font-semibold text-charcoal mt-6">1. Descrizione del servizio</h2>
          <p>
            ForeverPic è una piattaforma per la condivisione di foto durante eventi tramite codice QR.
            Gli utenti possono creare eventi, generare QR code e raccogliere foto dai partecipanti.
          </p>
          <h2 className="font-display text-xl font-semibold text-charcoal mt-6">2. Account e registrazione</h2>
          <p>
            Per creare eventi è necessario registrarsi. Sei responsabile della sicurezza del tuo account.
          </p>
          <h2 className="font-display text-xl font-semibold text-charcoal mt-6">3. Contenuti</h2>
          <p>
            Non è consentito caricare contenuti illegali, offensivi o che violano diritti di terzi.
            Ci riserviamo il diritto di rimuovere contenuti che violano queste regole.
          </p>
          <h2 className="font-display text-xl font-semibold text-charcoal mt-6">4. Limitazioni di servizio (Beta)</h2>
          <p>
            Durante la fase beta, gli eventi e le foto associate saranno automaticamente eliminate
            dopo 7 giorni dalla creazione. Questo per gestire lo storage in modo sostenibile.
          </p>
          <h2 className="font-display text-xl font-semibold text-charcoal mt-6">5. Modifiche ai termini</h2>
          <p>
            Ci riserviamo il diritto di modificare questi termini in qualsiasi momento.
            Le modifiche saranno comunicate agli utenti registrati.
          </p>
        </div>
      </div>
    </div>
  )
}
