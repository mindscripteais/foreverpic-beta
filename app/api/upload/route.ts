import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

const BUCKET = process.env.R2_BUCKET_NAME!

export async function POST(req: Request) {
  try {
    const session = await auth()
    const formData = await req.formData()

    const file = formData.get('file') as File | null
    const eventId = formData.get('eventId') as string | null
    const key = formData.get('key') as string | null
    const guestName = formData.get('guestName') as string | null

    if (!file || !eventId || !key) {
      return NextResponse.json({ error: 'Missing file, eventId or key' }, { status: 400 })
    }

    // Verify event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { owner: true, collaborators: true },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Check access
    const isPublic = event.privacy === 'PUBLIC'
    const isOwner = session?.user?.id === event.ownerId
    const isCollaborator = event.collaborators.some((c: { id: string }) => c.id === session?.user?.id)

    if (!isPublic && !isOwner && !isCollaborator) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Convert file to buffer and upload to R2
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    await r2.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      })
    )

    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`

    return NextResponse.json({ success: true, key, url: publicUrl })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed', details: (error as Error).message },
      { status: 500 }
    )
  }
}
