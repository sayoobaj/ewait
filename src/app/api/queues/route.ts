import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/queues - List all queues or get by code
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const locationId = searchParams.get('locationId')

  try {
    if (code) {
      // Find queue by code (using ID as code for simplicity)
      const queue = await prisma.queue.findUnique({
        where: { id: code },
        include: {
          location: true,
          _count: { select: { entries: { where: { status: 'WAITING' } } } }
        }
      })

      if (!queue) {
        return NextResponse.json({ error: 'Queue not found' }, { status: 404 })
      }

      return NextResponse.json({
        ...queue,
        waitingCount: queue._count.entries
      })
    }

    if (locationId) {
      const queues = await prisma.queue.findMany({
        where: { locationId, isActive: true },
        include: {
          _count: { select: { entries: { where: { status: 'WAITING' } } } }
        }
      })

      return NextResponse.json(queues.map(q => ({
        ...q,
        waitingCount: q._count.entries
      })))
    }

    return NextResponse.json({ error: 'Provide code or locationId' }, { status: 400 })
  } catch (error) {
    console.error('Queue API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/queues - Create a new queue
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, locationId, avgServiceTime } = body

    if (!name || !locationId) {
      return NextResponse.json({ error: 'Name and locationId required' }, { status: 400 })
    }

    const queue = await prisma.queue.create({
      data: {
        name,
        description,
        locationId,
        avgServiceTime: avgServiceTime || 5
      }
    })

    return NextResponse.json(queue, { status: 201 })
  } catch (error) {
    console.error('Create queue error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
