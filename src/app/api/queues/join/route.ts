import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/queues/join - Join a queue
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { queueId, name, phone, email, partySize = 1 } = body

    if (!queueId) {
      return NextResponse.json({ error: 'queueId required' }, { status: 400 })
    }

    // Verify queue exists and is active
    const queue = await prisma.queue.findUnique({
      where: { id: queueId },
      include: { location: true }
    })

    if (!queue) {
      return NextResponse.json({ error: 'Queue not found' }, { status: 404 })
    }

    if (!queue.isActive) {
      return NextResponse.json({ error: 'Queue is not accepting entries' }, { status: 400 })
    }

    // Get the next ticket number
    const lastEntry = await prisma.queueEntry.findFirst({
      where: { queueId },
      orderBy: { ticketNumber: 'desc' }
    })
    const ticketNumber = (lastEntry?.ticketNumber || 0) + 1

    // Create the entry
    const entry = await prisma.queueEntry.create({
      data: {
        queueId,
        ticketNumber,
        name,
        phone,
        email,
        partySize,
        status: 'WAITING'
      }
    })

    // Calculate position and wait time
    const position = await prisma.queueEntry.count({
      where: {
        queueId,
        status: 'WAITING',
        joinedAt: { lte: entry.joinedAt }
      }
    })

    const estimatedWaitMinutes = (position - 1) * queue.avgServiceTime

    return NextResponse.json({
      id: entry.id,
      ticketNumber: entry.ticketNumber,
      position,
      estimatedWaitMinutes,
      queueName: queue.name,
      locationName: queue.location.name
    }, { status: 201 })
  } catch (error) {
    console.error('Join queue error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
