'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Image, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { cn, formatBytes } from '@/lib/utils'
import { Progress } from '@/components/ui'
import { trpc } from '@/lib/trpc-client'

interface FileWithPreview extends File {
  preview?: string
}

interface UploadZoneProps {
  eventId: string
  onUploadComplete?: (results: { id: string; url: string }[]) => void
  maxSize?: number
  disabled?: boolean
  guestMode?: boolean
  guestName?: string
}

interface UploadingFile {
  file: FileWithPreview
  id: string
  progress: number
  status: 'pending' | 'uploading' | 'complete' | 'error'
  error?: string
  result?: { id: string; url: string }
}

const ACCEPTED_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/heic': ['.heic'],
}

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = document.createElement('img')
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve({ width: 0, height: 0 })
    }
    img.src = url
  })
}

export function UploadZone({ eventId, onUploadComplete, maxSize = 20 * 1024 * 1024, disabled, guestMode, guestName }: UploadZoneProps) {
  const [uploading, setUploading] = useState<UploadingFile[]>([])
  const getUploadUrl = trpc.photo.getUploadUrl.useMutation()
  const confirmUpload = trpc.photo.confirmUpload.useMutation()
  const getGuestUploadUrl = trpc.photo.getGuestUploadUrl.useMutation()
  const confirmGuestUpload = trpc.photo.confirmGuestUpload.useMutation()

  const uploadFile = useCallback(async (uf: UploadingFile) => {
    setUploading((prev) =>
      prev.map((f) => (f.id === uf.id ? { ...f, status: 'uploading', progress: 10 } : f))
    )

    try {
      const dims = await getImageDimensions(uf.file)

      // Get presigned URL (or local upload flag)
      let uploadUrl: string | null, key: string, publicUrl: string | null, localUpload: boolean
      if (guestMode) {
        const res = await getGuestUploadUrl.mutateAsync({
          eventId,
          filename: uf.file.name,
          contentType: uf.file.type,
          size: uf.file.size,
        })
        uploadUrl = res.uploadUrl
        key = res.key
        publicUrl = res.publicUrl
        localUpload = res.localUpload
      } else {
        const res = await getUploadUrl.mutateAsync({
          eventId,
          filename: uf.file.name,
          contentType: uf.file.type,
          size: uf.file.size,
        })
        uploadUrl = res.uploadUrl
        key = res.key
        publicUrl = res.publicUrl
        localUpload = res.localUpload
      }

      setUploading((prev) =>
        prev.map((f) => (f.id === uf.id ? { ...f, progress: 30 } : f))
      )

      let dataUrl: string | undefined

      if (localUpload) {
        // Local upload: convert file to base64 data URL
        dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = () => reject(new Error('Impossibile leggere il file'))
          reader.readAsDataURL(uf.file)
        })
        // Simulate progress for local upload
        for (let p = 30; p <= 90; p += 20) {
          setUploading((prev) =>
            prev.map((f) => (f.id === uf.id ? { ...f, progress: p } : f))
          )
          await new Promise((r) => setTimeout(r, 50))
        }
      } else {
        // Upload to R2 via XHR for progress tracking
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest()

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const pct = 30 + (e.loaded / e.total) * 60
              setUploading((prev) =>
                prev.map((f) => (f.id === uf.id ? { ...f, progress: pct } : f))
              )
            }
          }

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve()
            } else {
              reject(new Error(`Upload failed: ${xhr.status}`))
            }
          }

          xhr.onerror = () => reject(new Error('Network error'))
          xhr.open('PUT', uploadUrl!)
          xhr.setRequestHeader('Content-Type', uf.file.type)
          xhr.send(uf.file)
        })
      }

      setUploading((prev) =>
        prev.map((f) => (f.id === uf.id ? { ...f, progress: 90 } : f))
      )

      // Confirm upload
      let result: { id: string; url: string }
      if (guestMode) {
        if (!guestName) {
          throw new Error('Il nome dell\'ospite è obbligatorio')
        }
        result = await confirmGuestUpload.mutateAsync({
          eventId,
          key,
          size: uf.file.size,
          width: dims.width || 1200,
          height: dims.height || 1200,
          guestName,
          dataUrl,
        })
      } else {
        result = await confirmUpload.mutateAsync({
          eventId,
          key,
          size: uf.file.size,
          width: dims.width || 1200,
          height: dims.height || 1200,
          dataUrl,
        })
      }

      setUploading((prev) =>
        prev.map((f) =>
          f.id === uf.id ? { ...f, status: 'complete', progress: 100, result } : f
        )
      )

      setUploading((currentUploading) => {
        const allComplete = currentUploading.every((f) => f.status === 'complete' || f.id === uf.id)
        if (allComplete) {
          onUploadComplete?.(currentUploading.map((f) => f.result!).filter(Boolean))
        }
        return currentUploading
      })
    } catch (err: any) {
      setUploading((prev) =>
        prev.map((f) =>
          f.id === uf.id ? { ...f, status: 'error', error: err.message } : f
        )
      )
    }
  }, [eventId, onUploadComplete, getUploadUrl, confirmUpload, getGuestUploadUrl, confirmGuestUpload, guestMode, guestName])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadingFile[] = acceptedFiles.map((file) => ({
      file: Object.assign(file, { preview: URL.createObjectURL(file) }) as FileWithPreview,
      id: Math.random().toString(36).slice(2),
      progress: 0,
      status: 'pending' as const,
    }))

    setUploading((prev) => [...prev, ...newFiles])

    // Process each file sequentially
    newFiles.forEach((uf) => uploadFile(uf))
  }, [uploadFile])

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize,
    disabled,
    multiple: true,
  })

  const removeFile = (id: string) => {
    setUploading((prev) => {
      const file = prev.find((f) => f.id === id)
      if (file?.file.preview) {
        URL.revokeObjectURL(file.file.preview)
      }
      return prev.filter((f) => f.id !== id)
    })
  }

  const completedCount = uploading.filter((f) => f.status === 'complete').length
  const totalProgress = uploading.length
    ? uploading.reduce((sum, f) => sum + f.progress, 0) / uploading.length
    : 0

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer',
          isDragActive && !isDragReject && 'border-coral bg-coral/5',
          isDragReject && 'border-coral bg-coral/5',
          !isDragActive && !isDragReject && 'border-warm-300 hover:border-coral/50 hover:bg-warm-100',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          <div
            className={cn(
              'w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300',
              isDragActive ? 'bg-coral/10 scale-110' : 'bg-warm-200'
            )}
          >
            <Upload className={cn('w-7 h-7', isDragActive ? 'text-coral' : 'text-warm-500')} />
          </div>
          <div>
            <p className="font-semibold text-lg text-charcoal">
              {isDragActive ? 'Rilascia le foto qui' : 'Trascina le foto qui o clicca per caricare'}
            </p>
            <p className="text-sm text-warm-500 mt-1">
              JPG, PNG, WebP, HEIC fino a {formatBytes(maxSize)} ciascuna
            </p>
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {uploading.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-charcoal">
              {completedCount} di {uploading.length} caricat{uploading.length > 1 ? 'e' : 'a'}
            </span>
            <span className="text-sm font-mono text-warm-500">{Math.round(totalProgress)}%</span>
          </div>
          <Progress value={totalProgress} size="sm" />

          <div className="max-h-60 overflow-y-auto space-y-2">
            {uploading.map((uf) => (
              <div
                key={uf.id}
                className={cn(
                  'flex items-center gap-3 p-3.5 rounded-xl border transition-colors',
                  uf.status === 'complete' && 'bg-success/5 border-success/20',
                  uf.status === 'error' && 'bg-coral/5 border-coral/20',
                  uf.status === 'uploading' && 'bg-warm-100 border-warm-300',
                  uf.status === 'pending' && 'bg-warm-100 border-warm-300'
                )}
              >
                {/* Preview */}
                {uf.file.preview && (
                  <img src={uf.file.preview} alt="" className="w-12 h-12 rounded-xl object-cover" />
                )}
                {!uf.file.preview && (
                  <div className="w-12 h-12 rounded-xl bg-warm-200 flex items-center justify-center">
                    <Image className="w-5 h-5 text-warm-500" />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-charcoal truncate">{uf.file.name}</p>
                  <p className="text-xs text-warm-500">
                    {formatBytes(uf.file.size)}
                    {uf.error && <span className="text-coral ml-2">{uf.error}</span>}
                  </p>
                </div>

                {/* Status */}
                <div className="flex items-center gap-2">
                  {uf.status === 'uploading' && (
                    <Loader2 className="w-5 h-5 text-coral animate-spin" />
                  )}
                  {uf.status === 'complete' && (
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  )}
                  {uf.status === 'error' && (
                    <AlertCircle className="w-5 h-5 text-coral" />
                  )}
                  <button
                    onClick={() => removeFile(uf.id)}
                    className="p-1.5 rounded-xl hover:bg-warm-200 text-warm-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
