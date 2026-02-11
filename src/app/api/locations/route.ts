import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/locations - List locations for an owner
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ownerId = searchParams.get('ownerId')

    if (!ownerId) {
      return NextResponse.json({ error: 'ownerId required' }, { status: 400 })
    }

    const locations = await prisma.location.findMany({
      where: { ownerId },
      include: {
        queues: {
          include: {
            _count: { select: { entries: { where: { status: 'WAITING' } } } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(locations.map(loc => ({
      ...loc,
      queues: loc.queues.map(q => ({
        ...q,
        waitingCount: q._count.entries
      }))
    })))
  } catch (error) {
    console.error('Locations API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/locations - Create a new location
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, address, phone, ownerId, createDefaultQueue = true } = body

    if (!name || !ownerId) {
      return NextResponse.json({ error: 'name and ownerId required' }, { status: 400 })
    }

    const location = await prisma.location.create({
      data: {
        name,
        address,
        phone,
        ownerId,
        ...(createDefaultQueue && {
          queues: {
            create: {
              name: 'Main Queue',
              description: 'Default queue',
              avgServiceTime: 5
            }
          }
        })
      },
      include: { queues: true }
    })

    return NextResponse.json(location, { status: 201 })
  } catch (error) {
    console.error('Create location error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
