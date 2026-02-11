import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/queues/[queueId] - Get queue with entries
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ queueId: string }> }
) {
  try {
    const { queueId } = await params

    const queue = await prisma.queue.findUnique({
      where: { id: queueId },
      include: {
        location: true,
        entries: {
          where: {
            status: { in: ['WAITING', 'CALLED', 'SERVING'] }
          },
          orderBy: [
            { status: 'asc' }, // CALLED first, then WAITING
            { joinedAt: 'asc' }
          ]
        }
      }
    })

    if (!queue) {
      return NextResponse.json({ error: 'Queue not found' }, { status: 404 })
    }

    return NextResponse.json({
      ...queue,
      waitingCount: queue.entries.filter(e => e.status === 'WAITING').length,
      calledEntry: queue.entries.find(e => e.status === 'CALLED' || e.status === 'SERVING')
    })
  } catch (error) {
    console.error('Get queue error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/queues/[queueId] - Update queue settings
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ queueId: string }> }
) {
  try {
    const { queueId } = await params
    const body = await request.json()
    const { name, description, isActive, avgServiceTime } = body

    const queue = await prisma.queue.update({
      where: { id: queueId },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
        ...(avgServiceTime !== undefined && { avgServiceTime })
      }
    })

    return NextResponse.json(queue)
  } catch (error) {
    console.error('Update queue error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
