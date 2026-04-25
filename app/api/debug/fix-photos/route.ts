import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPublicUrl } from '@/lib/r2'

export async function POST() {
  try {
    // Find all photos with the old private S3 endpoint URL
    const photos = await prisma.photo.findMany({
      where: {
        url: {
          contains: 'r2.cloudflarestorage.com',
        },
      },
      select: { id: true, key: true, url: true },
    })

    const updated = []
    for (const photo of photos) {
      const newUrl = getPublicUrl(photo.key)
      if (newUrl !== photo.url) {
        await prisma.photo.update({
          where: { id: photo.id },
          data: { url: newUrl, thumbnail: newUrl },
        })
        updated.push({ id: photo.id, oldUrl: photo.url.slice(0, 80), newUrl: newUrl.slice(0, 80) })
      }
    }

    return NextResponse.json({
      fixed: updated.length,
      photos: updated,
    })
  } catch (e) {
    return NextResponse.json({ error: 'Fix failed', details: (e as Error).message }, { status: 500 })
  }
}
