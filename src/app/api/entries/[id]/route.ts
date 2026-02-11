import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/entries/[id] - Get entry status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const entry = await prisma.queueEntry.findUnique({
      where: { id },
      include: {
        queue: {
          include: { location: true }
        }
      }
    })

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    // Calculate current position if still waiting
    let position = 0
    let peopleAhead = 0
    let estimatedWaitMinutes = 0

    if (entry.status === 'WAITING') {
      position = await prisma.queueEntry.count({
        where: {
          queueId: entry.queueId,
          status: 'WAITING',
          joinedAt: { lte: entry.joinedAt }
        }
      })
      peopleAhead = position - 1
      estimatedWaitMinutes = peopleAhead * entry.queue.avgServiceTime
    }

    return NextResponse.json({
      id: entry.id,
      ticketNumber: entry.ticketNumber,
      status: entry.status,
      position,
      peopleAhead,
      estimatedWaitMinutes,
      joinedAt: entry.joinedAt,
      calledAt: entry.calledAt,
      queueName: entry.queue.name,
      locationName: entry.queue.location.name
    })
  } catch (error) {
    console.error('Get entry error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/entries/[id] - Update entry status (for admin)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status } = body

    const updateData: Record<string, unknown> = { status }

    if (status === 'CALLED') {
      updateData.calledAt = new Date()
    } else if (status === 'COMPLETED') {
      updateData.servedAt = new Date()
    } else if (status === 'CANCELLED' || status === 'NO_SHOW') {
      updateData.cancelledAt = new Date()
    }

    const entry = await prisma.queueEntry.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(entry)
  } catch (error) {
    console.error('Update entry error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
