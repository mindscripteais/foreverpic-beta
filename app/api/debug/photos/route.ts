import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const eventId = searchParams.get('eventId')

  if (!eventId) {
    return NextResponse.json({ error: 'Missing eventId' }, { status: 400 })
  }

  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        photos: {
          select: { id: true, url: true, thumbnail: true, key: true, size: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    return NextResponse.json({
      eventId: event.id,
      eventName: event.name,
      photoCount: event.photos.length,
      photos: event.photos.map((p) => ({
        id: p.id,
        url: p.url,
        thumbnail: p.thumbnail,
        key: p.key,
        size: p.size,
        createdAt: p.createdAt,
      })),
    })
  } catch (e) {
    return NextResponse.json({ error: 'DB error', details: (e as Error).message }, { status: 500 })
  }
}
