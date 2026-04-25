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
  'video/mp4': ['.mp4'],
  'video/quicktime': ['.mov'],
  'video/webm': ['.webm'],
}

function getMediaDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    if (file.type.startsWith('video/')) {
      const video = document.createElement('video')
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(url)
        resolve({ width: video.videoWidth, height: video.videoHeight })
      }
      video.onerror = () => {
        URL.revokeObjectURL(url)
        resolve({ width: 1920, height: 1080 })
      }
      video.src = url
    } else {
      const img = document.createElement('img')
      img.onload = () => {
        URL.revokeObjectURL(url)
        resolve({ width: img.naturalWidth, height: img.naturalHeight })
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
        resolve({ width: 0, height: 0 })
      }
      img.src = url
    }
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
      const dims = await getMediaDimensions(uf.file)

      // Get upload key and validate limits
      let key: string
      if (guestMode) {
        const res = await getGuestUploadUrl.mutateAsync({
          eventId,
          filename: uf.file.name,
          contentType: uf.file.type,
          size: uf.file.size,
        })
        key = res.key
      } else {
        const res = await getUploadUrl.mutateAsync({
          eventId,
          filename: uf.file.name,
          contentType: uf.file.type,
          size: uf.file.size,
        })
        key = res.key
      }

      setUploading((prev) =>
        prev.map((f) => (f.id === uf.id ? { ...f, progress: 30 } : f))
      )

      // Upload to R2 via server-side API (avoids CORS issues)
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        const formData = new FormData()
        formData.append('file', uf.file)
        formData.append('eventId', eventId)
        formData.append('key', key)
        if (guestName) formData.append('guestName', guestName)

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
            let msg = `Upload failed: ${xhr.status}`
            try {
              const data = JSON.parse(xhr.responseText)
              if (data.error) msg = data.error
            } catch {}
            reject(new Error(msg))
          }
        }

        xhr.onerror = () => reject(new Error('Network error'))
        xhr.open('POST', '/api/upload')
        xhr.send(formData)
      })

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
          type: uf.file.type.startsWith('video/') ? 'VIDEO' : 'PHOTO',
        })
      } else {
        result = await confirmUpload.mutateAsync({
          eventId,
          key,
          size: uf.file.size,
          width: dims.width || 1200,
          height: dims.height || 1200,
          type: uf.file.type.startsWith('video/') ? 'VIDEO' : 'PHOTO',
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
              {isDragActive ? 'Rilascia qui' : 'Trascina foto o video qui o clicca per caricare'}
            </p>
            <p className="text-sm text-warm-500 mt-1">
              JPG, PNG, WebP, MP4, MOV fino a {formatBytes(maxSize)} ciascuno
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
