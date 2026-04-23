'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Lock, Globe, Users } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Input, Textarea } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { trpc } from '@/lib/trpc-client'

interface CreateEventModalProps {
  open: boolean
  onClose: () => void
  onEventCreated?: (event: { id: string; name: string }) => void
}

export function CreateEventModal({ open, onClose, onEventCreated }: CreateEventModalProps) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [privacy, setPrivacy] = useState<'PUBLIC' | 'PRIVATE' | 'INVITE_ONLY'>('PUBLIC')
  const [qrExpirationDays, setQrExpirationDays] = useState(30)
  const [error, setError] = useState<string | null>(null)

  const utils = trpc.useUtils()

  const createEvent = trpc.event.create.useMutation({
    onSuccess: (event) => {
      console.log('Event created with ID:', event.id)
      utils.event.list.invalidate()
      if (onEventCreated) {
        onEventCreated({ id: event.id, name: event.name })
      } else {
        router.push(`/manage/${event.id}`)
      }
      onClose()
    },
    onError: (err) => {
      console.error('Create event error:', err)
      setError(err.message)
    },
  })

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    setError(null)

    console.log('[CreateEventModal] handleSubmit called', { name, date, privacy, qrExpirationDays })

    if (!name.trim()) {
      setError('Il nome dell\'evento è obbligatorio')
      return
    }
    if (!date) {
      setError('La data dell\'evento è obbligatoria')
      return
    }

    console.log('[CreateEventModal] Submitting event.create mutation', {
      name: name.trim(),
      date,
      privacy,
      qrExpirationDays: qrExpirationDays || undefined,
    })

    createEvent.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      date,
      privacy,
      qrExpirationDays: qrExpirationDays || undefined,
    })
  }

  const privacyOptions = [
    { value: 'PUBLIC', label: 'Pubblico', description: 'Chiunque abbia il link può visualizzare', icon: Globe },
    { value: 'PRIVATE', label: 'Privato', description: 'Solo tu puoi visualizzare', icon: Lock },
    { value: 'INVITE_ONLY', label: 'Su invito', description: 'Solo gli ospiti invitati possono caricare', icon: Users },
  ]

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <div className="p-8">
        <h2 className="font-display text-2xl font-bold text-charcoal mb-6">Crea nuovo evento</h2>

        {error && (
          <div className="mb-6 p-4 bg-coral/5 border border-coral/20 rounded-xl text-coral text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <Input
            label="Nome evento"
            placeholder="Matrimonio di Marco e Sofia"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Textarea
            label="Descrizione (opzionale)"
            placeholder="Unisciti a noi per celebrare..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />

          <Input
            label="Data evento"
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          {/* Privacy */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-charcoal">Privacy</label>
            <div className="grid grid-cols-3 gap-3">
              {privacyOptions.map(({ value, label, description, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPrivacy(value as typeof privacy)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    privacy === value
                      ? 'border-coral bg-coral/5'
                      : 'border-warm-300 hover:border-coral/30 hover:bg-warm-100'
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-2 ${privacy === value ? 'text-coral' : 'text-warm-500'}`} />
                  <p className="font-semibold text-sm text-charcoal">{label}</p>
                  <p className="text-xs text-warm-500 mt-0.5">{description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* QR Expiration */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-charcoal">
              Scadenza QR Code
            </label>
            <select
              value={qrExpirationDays}
              onChange={(e) => setQrExpirationDays(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl border border-warm-300 bg-white focus:outline-none focus:ring-2 focus:ring-coral/50 focus:border-coral"
            >
              <option value={7}>Dopo 7 giorni</option>
              <option value={30}>Dopo 30 giorni</option>
              <option value={90}>Dopo 90 giorni</option>
              <option value={365}>Dopo 1 anno</option>
              <option value={0}>Non scade mai</option>
            </select>
            <p className="text-xs text-warm-500">
              Piano Free: max 30 giorni. Pro/Enterprise: illimitato.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
              Annulla
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              loading={createEvent.isPending}
            >
              <Calendar className="w-4 h-4" />
              Crea evento
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}