'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Lock, Globe, Users, Image as ImageIcon, X } from 'lucide-react'
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
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isUploadingCover, setIsUploadingCover] = useState(false)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const utils = trpc.useUtils()
  const updateEvent = trpc.event.update.useMutation()

  const createEvent = trpc.event.create.useMutation({
    onSuccess: async (event) => {
      console.log('Event created with ID:', event.id)
      utils.event.list.invalidate()

      // Upload cover image if selected
      if (coverFile) {
        setIsUploadingCover(true)
        try {
          const key = `events/${event.id}/cover`
          const formData = new FormData()
          formData.append('file', coverFile)
          formData.append('eventId', event.id)
          formData.append('key', key)

          const res = await fetch('/api/upload', { method: 'POST', body: formData })
          const data = await res.json()
          if (res.ok && data.url) {
            await updateEvent.mutateAsync({ id: event.id, coverImage: data.url })
          }
        } catch (err: any) {
          console.error('Cover upload error:', err)
        } finally {
          setIsUploadingCover(false)
        }
      }

      if (onEventCreated) {
        onEventCreated({ id: event.id, name: event.name })
      } else {
        router.push(`/manage/${event.id}`)
      }
      onClose()
      // Reset form
      setName('')
      setDescription('')
      setDate('')
      setPrivacy('PUBLIC')
      setQrExpirationDays(30)
      setCoverFile(null)
      setCoverPreview(null)
    },
    onError: (err) => {
      console.error('Create event error:', err)
      setError(err.message)
    },
  })

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCoverFile(file)
      setCoverPreview(URL.createObjectURL(file))
    }
  }

  const removeCover = () => {
    setCoverFile(null)
    if (coverPreview) {
      URL.revokeObjectURL(coverPreview)
      setCoverPreview(null)
    }
    if (coverInputRef.current) {
      coverInputRef.current.value = ''
    }
  }

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Il nome dell\'evento è obbligatorio')
      return
    }
    if (!date) {
      setError('La data dell\'evento è obbligatoria')
      return
    }

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

          {/* Cover Image */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-charcoal">Immagine di copertina (opzionale)</label>
            {coverPreview ? (
              <div className="relative rounded-xl overflow-hidden aspect-video bg-warm-200">
                <img src={coverPreview} alt="Anteprima copertina" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={removeCover}
                  className="absolute top-2 right-2 p-1.5 bg-charcoal/60 text-white rounded-lg hover:bg-charcoal/80 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                className="w-full h-32 border-2 border-dashed border-warm-300 rounded-xl flex flex-col items-center justify-center text-warm-500 hover:border-coral hover:text-coral transition-colors"
              >
                <ImageIcon className="w-6 h-6 mb-2" />
                <span className="text-sm font-medium">Clicca per scegliere un'immagine</span>
                <span className="text-xs text-warm-400 mt-1">JPG, PNG, WebP</span>
              </button>
            )}
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverSelect}
            />
          </div>

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
              loading={createEvent.isPending || isUploadingCover}
            >
              <Calendar className="w-4 h-4" />
              {isUploadingCover ? 'Caricamento copertina...' : 'Crea evento'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
