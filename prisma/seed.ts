import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create a demo location with queue
  const location = await prisma.location.upsert({
    where: { id: 'demo-location-1' },
    update: {},
    create: {
      id: 'demo-location-1',
      name: 'Demo Restaurant',
      address: '123 Main Street, Lagos',
      phone: '+2348012345678',
      ownerId: 'demo-owner-123'
    }
  })
  console.log('✓ Created location:', location.name)

  // Create queue
  const queue = await prisma.queue.upsert({
    where: { id: 'demo-queue-1' },
    update: {},
    create: {
      id: 'demo-queue-1',
      name: 'Main Queue',
      description: 'Main service queue',
      locationId: location.id,
      avgServiceTime: 5,
      isActive: true
    }
  })
  console.log('✓ Created queue:', queue.name)

  // Create some test entries
  const names = ['John Doe', 'Jane Smith', 'Bob Wilson', 'Alice Brown', 'Charlie Davis']
  
  for (let i = 0; i < names.length; i++) {
    await prisma.queueEntry.create({
      data: {
        queueId: queue.id,
        ticketNumber: 100 + i + 1,
        name: names[i],
        phone: `+23480${Math.random().toString().slice(2, 10)}`,
        partySize: Math.floor(Math.random() * 4) + 1,
        status: 'WAITING',
        joinedAt: new Date(Date.now() - (names.length - i) * 5 * 60 * 1000) // 5 min apart
      }
    })
  }
  console.log('✓ Created', names.length, 'test entries')

  // Create a second location
  const location2 = await prisma.location.upsert({
    where: { id: 'demo-location-2' },
    update: {},
    create: {
      id: 'demo-location-2',
      name: 'Demo Bank',
      address: '456 Banking Avenue, Victoria Island',
      phone: '+2349087654321',
      ownerId: 'demo-owner-123'
    }
  })

  await prisma.queue.upsert({
    where: { id: 'demo-queue-2' },
    update: {},
    create: {
      id: 'demo-queue-2',
      name: 'Customer Service',
      description: 'General inquiries',
      locationId: location2.id,
      avgServiceTime: 10,
      isActive: true
    }
  })

  await prisma.queue.upsert({
    where: { id: 'demo-queue-3' },
    update: {},
    create: {
      id: 'demo-queue-3',
      name: 'Account Opening',
      description: 'New account applications',
      locationId: location2.id,
      avgServiceTime: 20,
      isActive: true
    }
  })
  console.log('✓ Created second location:', location2.name)

  console.log('✅ Seeding complete!')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
