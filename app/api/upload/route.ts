import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    console.log('[upload] === START ===')

    // Step 1: Parse form data
    let file: File | null = null
    let eventId: string | null = null
    let key: string | null = null
    try {
      const formData = await req.formData()
      file = formData.get('file') as File | null
      eventId = formData.get('eventId') as string | null
      key = formData.get('key') as string | null
      console.log('[upload] Parsed formData:', { hasFile: !!file, eventId, key })
    } catch (e) {
      console.error('[upload] Failed to parse formData:', e)
      return NextResponse.json({ error: 'Invalid form data', details: (e as Error).message }, { status: 400 })
    }

    if (!file || !eventId || !key) {
      return NextResponse.json({ error: 'Missing file, eventId or key' }, { status: 400 })
    }

    // Step 2: Lazy import auth (avoid top-level failures)
    let session: any = null
    try {
      const { auth } = await import('@/lib/auth')
      session = await auth()
      console.log('[upload] Auth OK, userId:', session?.user?.id ?? 'none')
    } catch (e) {
      console.error('[upload] Auth failed:', e)
      // Continue without auth — public events should still work
    }

    // Step 3: Lazy import prisma
    let event: any = null
    try {
      const { prisma } = await import('@/lib/prisma')
      event = await prisma.event.findUnique({
        where: { id: eventId },
        include: { owner: true, collaborators: { select: { id: true } } },
      })
      console.log('[upload] Prisma OK, event found:', !!event)
    } catch (e) {
      console.error('[upload] Prisma failed:', e)
      return NextResponse.json({ error: 'Database error', details: (e as Error).message }, { status: 500 })
    }

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Step 4: Check access
    const isPublic = event.privacy === 'PUBLIC'
    const isOwner = session?.user?.id === event.ownerId
    const isCollaborator = event.collaborators?.some((c: any) => c.id === session?.user?.id)

    console.log('[upload] Access:', { isPublic, isOwner, isCollaborator })

    if (!isPublic && !isOwner && !isCollaborator) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Step 5: Read file
    let buffer: Buffer
    try {
      const arrayBuffer = await file.arrayBuffer()
      buffer = Buffer.from(arrayBuffer)
      console.log('[upload] File read OK, size:', buffer.byteLength)
    } catch (e) {
      console.error('[upload] File read failed:', e)
      return NextResponse.json({ error: 'File read failed', details: (e as Error).message }, { status: 500 })
    }

    // Step 6: Upload to R2
    let publicUrl: string
    try {
      const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3')
      const accountId = process.env.R2_ACCOUNT_ID
      const accessKeyId = process.env.R2_ACCESS_KEY_ID
      const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
      const bucket = process.env.R2_BUCKET_NAME
      const publicUrlBase = process.env.R2_PUBLIC_URL

      console.log('[upload] R2 env check:', {
        hasAccountId: !!accountId,
        hasAccessKey: !!accessKeyId,
        hasSecret: !!secretAccessKey,
        hasBucket: !!bucket,
        hasPublicUrl: !!publicUrlBase,
      })

      if (!accountId || !accessKeyId || !secretAccessKey) {
        return NextResponse.json({ error: 'R2 credentials missing' }, { status: 503 })
      }
      if (!bucket || !publicUrlBase) {
        return NextResponse.json({ error: 'R2 bucket/public URL missing' }, { status: 503 })
      }

      const r2 = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: { accessKeyId, secretAccessKey },
      })

      await r2.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: buffer,
          ContentType: file.type,
        })
      )

      publicUrl = `${publicUrlBase}/${key}`
      console.log('[upload] R2 upload OK:', publicUrl)
    } catch (e) {
      console.error('[upload] R2 upload failed:', e)
      return NextResponse.json({ error: 'R2 upload failed', details: (e as Error).message }, { status: 500 })
    }

    return NextResponse.json({ success: true, key, url: publicUrl })
  } catch (error) {
    console.error('[upload] UNEXPECTED ERROR:', error)
    return NextResponse.json(
      { error: 'Unexpected error', details: (error as Error).message },
      { status: 500 }
    )
  }
}
