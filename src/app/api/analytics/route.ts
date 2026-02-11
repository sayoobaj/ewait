import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/analytics - Get analytics for user's locations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '7')
    const locationId = searchParams.get('locationId')

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get user's locations
    const locations = await prisma.location.findMany({
      where: { ownerId: user.id },
      select: { id: true, name: true }
    })

    const locationIds = locationId ? [locationId] : locations.map(l => l.id)

    // Get aggregated stats
    const [totalStats, dailyStats, recentEntries, topQueues] = await Promise.all([
      // Total counts
      prisma.queueEntry.groupBy({
        by: ['status'],
        where: {
          queue: { locationId: { in: locationIds } },
          joinedAt: { gte: startDate }
        },
        _count: true
      }),

      // Daily breakdown
      prisma.dailyStats.findMany({
        where: {
          locationId: { in: locationIds },
          date: { gte: startDate }
        },
        orderBy: { date: 'asc' }
      }),

      // Recent activity
      prisma.queueEntry.findMany({
        where: {
          queue: { locationId: { in: locationIds } }
        },
        orderBy: { joinedAt: 'desc' },
        take: 10,
        include: {
          queue: { select: { name: true } }
        }
      }),

      // Top queues by volume
      prisma.queueEntry.groupBy({
        by: ['queueId'],
        where: {
          queue: { locationId: { in: locationIds } },
          joinedAt: { gte: startDate }
        },
        _count: true,
        orderBy: { _count: { queueId: 'desc' } },
        take: 5
      })
    ])

    // Calculate summary
    const summary = {
      totalJoins: totalStats.reduce((sum, s) => sum + s._count, 0),
      completed: totalStats.find(s => s.status === 'COMPLETED')?._count || 0,
      noShows: totalStats.find(s => s.status === 'NO_SHOW')?._count || 0,
      cancelled: totalStats.find(s => s.status === 'CANCELLED')?._count || 0,
      waiting: totalStats.find(s => s.status === 'WAITING')?._count || 0,
    }

    // Get queue names for top queues
    const queueIds = topQueues.map(q => q.queueId)
    const queues = await prisma.queue.findMany({
      where: { id: { in: queueIds } },
      select: { id: true, name: true }
    })
    const queueMap = new Map(queues.map(q => [q.id, q.name]))

    return NextResponse.json({
      summary,
      dailyStats,
      recentEntries: recentEntries.map(e => ({
        id: e.id,
        ticketNumber: e.ticketNumber,
        name: e.name,
        status: e.status,
        joinedAt: e.joinedAt,
        queueName: e.queue.name
      })),
      topQueues: topQueues.map(q => ({
        queueId: q.queueId,
        queueName: queueMap.get(q.queueId) || 'Unknown',
        count: q._count
      })),
      locations,
      period: { days, startDate }
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
