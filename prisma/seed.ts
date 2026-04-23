import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create test user
  const passwordHash = await bcrypt.hash('password123', 10)
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
      passwordHash,
      subscriptionTier: 'PRO',
    },
  })
  console.log('Created user:', user.email)

  // Create second test user
  const user2 = await prisma.user.upsert({
    where: { email: 'guest@example.com' },
    update: {},
    create: {
      email: 'guest@example.com',
      name: 'Guest User',
      passwordHash: await bcrypt.hash('guest123', 10),
      subscriptionTier: 'FREE',
    },
  })
  console.log('Created user:', user2.email)

  // Create test event
  const event = await prisma.event.create({
    data: {
      name: 'Wedding of Marco e Giulia',
      description: 'Matrimonio celebrato a Firenze',
      date: new Date('2026-06-15T14:00:00Z'),
      privacy: 'PUBLIC',
      ownerId: user.id,
      views: 42,
      storageLimit: 2147483647, // 2GB PRO (max INT)
    },
  })
  console.log('Created event:', event.name)

  // Create second event
  const event2 = await prisma.event.create({
    data: {
      name: 'Festa di Compleanno - Luca',
      description: '30 anni di Luca!',
      date: new Date('2026-05-01T20:00:00Z'),
      privacy: 'PUBLIC',
      ownerId: user.id,
      views: 12,
    },
  })
  console.log('Created event:', event2.name)

  // Create photos (without actual images - just metadata)
  const photo1 = await prisma.photo.create({
    data: {
      url: 'https://example.com/event1-photo1.jpg',
      thumbnail: 'https://example.com/event1-photo1_thumb.jpg',
      key: `event1-photo1-${Date.now()}`,
      size: 2048576,
      width: 1920,
      height: 1080,
      eventId: event.id,
      uploaderId: user.id,
    },
  })

  const photo2 = await prisma.photo.create({
    data: {
      url: 'https://example.com/event1-photo2.jpg',
      thumbnail: 'https://example.com/event1-photo2_thumb.jpg',
      key: `event1-photo2-${Date.now()}`,
      size: 1536000,
      width: 1920,
      height: 1280,
      eventId: event.id,
      uploaderId: user2.id,
    },
  })
  console.log('Created 2 photos')

  // Create reactions
  await prisma.reaction.createMany({
    data: [
      { type: 'LOVE', userId: user.id, photoId: photo2.id },
      { type: 'FIRE', userId: user2.id, photoId: photo1.id },
    ],
  })
  console.log('Created reactions')

  // Create votes
  await prisma.vote.createMany({
    data: [
      { userId: user.id, photoId: photo2.id },
      { userId: user2.id, photoId: photo1.id },
    ],
  })
  console.log('Created votes')

  console.log('\n✅ Seed completed!')
  console.log('\nTest credentials:')
  console.log('  Email: test@example.com')
  console.log('  Password: password123')
  console.log('\nEvent QR Token:', event.qrToken)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
