import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const isConfigured = !!(
  process.env.R2_ACCOUNT_ID &&
  process.env.R2_ACCOUNT_ID !== 'your-cloudflare-account-id' &&
  process.env.R2_ACCESS_KEY_ID &&
  process.env.R2_SECRET_ACCESS_KEY &&
  process.env.R2_BUCKET_NAME
)

let r2: S3Client | null = null
if (isConfigured) {
  r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  })
}

const BUCKET = process.env.R2_BUCKET_NAME!

export function isR2Configured(): boolean {
  return isConfigured
}

export async function generateUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 300 // 5 minutes
): Promise<string> {
  if (!r2) throw new Error('R2 not configured')
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  })

  return getSignedUrl(r2, command, { expiresIn })
}

export async function generateDownloadUrl(
  key: string,
  expiresIn = 3600
): Promise<string> {
  if (!r2) throw new Error('R2 not configured')
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  })

  return getSignedUrl(r2, command, { expiresIn })
}

export async function deleteObject(key: string): Promise<void> {
  if (!r2) return // Silently skip if R2 not configured
  const command = new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: key,
  })

  await r2.send(command)
}

export function getPublicUrl(key: string): string {
  if (!isConfigured) return key // For local upload, key IS the data URL
  return `${process.env.R2_PUBLIC_URL}/${key}`
}

export function generatePhotoKey(eventId: string, userId: string, filename: string): string {
  const timestamp = Date.now()
  const ext = filename.split('.').pop()
  return `events/${eventId}/photos/${userId}/${timestamp}-${Math.random().toString(36).slice(2)}.${ext}`
}

export async function getWatermarkedUrl(key: string): Promise<string> {
  if (!r2) throw new Error('R2 not configured')

  const wmKey = `wm/${key}`

  // Check if watermarked version already exists
  try {
    await r2.send(new HeadObjectCommand({ Bucket: BUCKET, Key: wmKey }))
    return `${process.env.R2_PUBLIC_URL}/${wmKey}`
  } catch {
    // Doesn't exist, create it
  }

  // Fetch original
  const original = await r2.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }))
  const body = await original.Body?.transformToByteArray()
  if (!body) throw new Error('Failed to fetch original image')
  const buffer = Buffer.from(body)

  // Get image dimensions for responsive watermark
  const sharp = (await import('sharp')).default
  const metadata = await sharp(buffer).metadata()
  const width = metadata.width || 800
  const fontSize = Math.max(16, Math.round(width / 25))
  const svgWidth = Math.round(width * 0.4)
  const svgHeight = Math.round(fontSize * 2.5)

  // Apply watermark with Sharp
  const watermarkSvg = Buffer.from(
    `<svg width="${svgWidth}" height="${svgHeight}"><text x="50%" y="50%" font-family="sans-serif" font-size="${fontSize}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle" opacity="0.55">ForeverPic</text></svg>`
  )

  const watermarked = await sharp(buffer)
    .composite([{ input: watermarkSvg, gravity: 'southeast' }])
    .toBuffer()

  // Upload watermarked version
  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: wmKey,
      Body: watermarked,
      ContentType: original.ContentType || 'image/jpeg',
    })
  )

  return `${process.env.R2_PUBLIC_URL}/${wmKey}`
}
