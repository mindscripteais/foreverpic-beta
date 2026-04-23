import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { deleteObject } from '@/lib/r2'

// This route is called by Vercel Cron every day at 3 AM
export async function GET(req: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Find all events that have passed their auto-delete date
    const expiredEvents = await prisma.event.findMany({
      where: {
        autoDeleteAt: { lt: new Date() },
      },
      include: {
        photos: { select: { id: true, key: true } },
      },
    })

    let deletedPhotos = 0
    let deletedEvents = 0

    for (const event of expiredEvents) {
      // Delete photos from R2
      for (const photo of event.photos) {
        await deleteObject(photo.key)
        deletedPhotos++
      }

      // Delete event (cascades to photos in DB)
      await prisma.event.delete({
        where: { id: event.id },
      })
      deletedEvents++
    }

    return NextResponse.json({
      success: true,
      deletedEvents,
      deletedPhotos,
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
