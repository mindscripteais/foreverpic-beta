import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

function getR2Client() {
  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'R2 not configured. Missing: ' +
        [!accountId && 'R2_ACCOUNT_ID', !accessKeyId && 'R2_ACCESS_KEY_ID', !secretAccessKey && 'R2_SECRET_ACCESS_KEY']
          .filter(Boolean)
          .join(', ')
    )
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  })
}

export async function POST(req: Request) {
  try {
    console.log('[upload] Request received')

    const session = await auth()
    console.log('[upload] Session:', session?.user?.id ?? 'none')

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const eventId = formData.get('eventId') as string | null
    const key = formData.get('key') as string | null
    const guestName = formData.get('guestName') as string | null

    console.log('[upload] Fields:', { hasFile: !!file, eventId, key, guestName })

    if (!file || !eventId || !key) {
      return NextResponse.json({ error: 'Missing file, eventId or key' }, { status: 400 })
    }

    // Verify event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { owner: true, collaborators: { select: { id: true } } },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Check access
    const isPublic = event.privacy === 'PUBLIC'
    const isOwner = session?.user?.id === event.ownerId
    const isCollaborator = event.collaborators.some((c) => c.id === session?.user?.id)

    console.log('[upload] Access check:', { isPublic, isOwner, isCollaborator, userId: session?.user?.id })

    if (!isPublic && !isOwner && !isCollaborator) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Lazy-init R2 client (fails gracefully if env vars missing)
    const r2 = getR2Client()
    const bucket = process.env.R2_BUCKET_NAME
    const publicUrlBase = process.env.R2_PUBLIC_URL

    if (!bucket || !publicUrlBase) {
      return NextResponse.json(
        { error: 'R2 storage not fully configured', details: 'Missing R2_BUCKET_NAME or R2_PUBLIC_URL' },
        { status: 503 }
      )
    }

    // Convert file to buffer and upload to R2
    console.log('[upload] Reading file...', file.name, file.type, file.size)
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    console.log('[upload] Buffer size:', buffer.byteLength)

    console.log('[upload] Uploading to R2...', key)
    await r2.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      })
    )
    console.log('[upload] R2 upload complete')

    const publicUrl = `${publicUrlBase}/${key}`

    return NextResponse.json({ success: true, key, url: publicUrl })
  } catch (error) {
    console.error('[upload] CRITICAL ERROR:', error)
    return NextResponse.json(
      { error: 'Upload failed', details: (error as Error).message },
      { status: 500 }
    )
  }
}
