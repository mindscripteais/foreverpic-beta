import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { deleteObject, isR2Configured } from '@/lib/r2'
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'

// This route is called by Vercel Cron every day at 3 AM
export async function GET(req: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    let deletedPhotos = 0
    let deletedEvents = 0
    let orphanR2Files = 0

    // 1. Delete expired events
    const expiredEvents = await prisma.event.findMany({
      where: {
        autoDeleteAt: { lt: new Date() },
      },
      include: {
        photos: { select: { id: true, key: true } },
      },
    })

    for (const event of expiredEvents) {
      for (const photo of event.photos) {
        await deleteObject(photo.key)
        await deleteObject(`wm/${photo.key}`)
        deletedPhotos++
      }
      await prisma.event.delete({ where: { id: event.id } })
      deletedEvents++
    }

    // 2. Clean up orphan R2 files (files without DB record)
    if (isR2Configured()) {
      try {
        const accountId = process.env.R2_ACCOUNT_ID
        const accessKeyId = process.env.R2_ACCESS_KEY_ID
        const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
        const bucket = process.env.R2_BUCKET_NAME

        if (accountId && accessKeyId && secretAccessKey && bucket) {
          const r2 = new S3Client({
            region: 'auto',
            endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
            credentials: { accessKeyId, secretAccessKey },
          })

          // Get all photo keys from DB
          const dbPhotos = await prisma.photo.findMany({ select: { key: true } })
          const dbKeys = new Set(dbPhotos.map((p) => p.key))

          // List R2 objects
          let continuationToken: string | undefined
          const r2Keys: string[] = []

          do {
            const response = await r2.send(
              new ListObjectsV2Command({
                Bucket: bucket,
                Prefix: 'events/',
                ContinuationToken: continuationToken,
                MaxKeys: 1000,
              })
            )
            if (response.Contents) {
              for (const obj of response.Contents) {
                if (obj.Key) r2Keys.push(obj.Key)
              }
            }
            continuationToken = response.NextContinuationToken
          } while (continuationToken)

          // Delete orphans (R2 files not in DB, skip watermarked versions if original exists)
          for (const key of r2Keys) {
            if (key.startsWith('wm/')) {
              const originalKey = key.slice(3)
              if (!dbKeys.has(originalKey)) {
                await deleteObject(key)
                orphanR2Files++
              }
            } else if (!dbKeys.has(key)) {
              await deleteObject(key)
              orphanR2Files++
            }
          }
        }
      } catch (r2Err) {
        console.error('R2 orphan cleanup error:', r2Err)
      }
    }

    return NextResponse.json({
      success: true,
      deletedEvents,
      deletedPhotos,
      orphanR2Files,
      checkedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Cleanup cron error:', error)
    return NextResponse.json(
      { error: 'Cleanup failed', details: (error as Error).message },
      { status: 500 }
    )
  }
}
