export const metadata = {
  title: 'Privacy Policy — ForeverPic',
  description: 'Informativa sulla privacy di ForeverPic',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-cream-100 py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-display text-3xl font-bold text-charcoal mb-8">Privacy Policy</h1>
        <div className="prose prose-warm text-warm-700 space-y-4">
          <p>Ultimo aggiornamento: 23 aprile 2026</p>
          <p>
            ForeverPic rispetta la tua privacy. Questa informativa spiega come raccogliamo,
            utilizziamo e proteggiamo i tuoi dati personali.
          </p>
          <h2 className="font-display text-xl font-semibold text-charcoal mt-6">1. Dati raccolti</h2>
          <p>Raccogliamo i seguenti dati:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Dati di registrazione:</strong> nome, email, password (hashata)</li>
            <li><strong>Dati evento:</strong> nome evento, descrizione, data, foto caricate</li>
            <li><strong>Dati tecnici:</strong> indirizzo IP, tipo di browser, cookie essenziali</li>
          </ul>
          <h2 className="font-display text-xl font-semibold text-charcoal mt-6">2. Utilizzo dei dati</h2>
          <p>I dati vengono utilizzati per:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Fornire il servizio di condivisione foto</li>
            <li>Gestire gli eventi e le gallerie</li>
            <li>Comunicare aggiornamenti importanti</li>
            <li>Migliorare il servizio</li>
          </ul>
          <h2 className="font-display text-xl font-semibold text-charcoal mt-6">3. Conservazione</h2>
          <p>
            Durante la fase beta, gli eventi e le foto vengono conservati per 7 giorni,
            dopodiché vengono automaticamente eliminati. I dati dell'account vengono conservati
            fino alla richiesta di cancellazione.
          </p>
          <h2 className="font-display text-xl font-semibold text-charcoal mt-6">4. Diritti dell'utente</h2>
          <p>
            Hai il diritto di accedere, rettificare, cancellare i tuoi dati personali.
            Per esercitare questi diritti, contattaci all'indirizzo email indicato.
          </p>
          <h2 className="font-display text-xl font-semibold text-charcoal mt-6">5. Cookie</h2>
          <p>
            Utilizziamo cookie essenziali per il funzionamento del sito e cookie analitici
            facoltativi. Puoi gestire le preferenze dal banner cookie.
          </p>
        </div>
      </div>
    </div>
  )
}
