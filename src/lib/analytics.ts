import { prisma } from './prisma'

// Track page view
export async function trackPageView(data: {
  path: string
  referrer?: string
  userAgent?: string
  ip?: string
  locationId?: string
  queueId?: string
  sessionId?: string
  userId?: string
}) {
  try {
    await prisma.pageView.create({ data })
  } catch (error) {
    console.error('Analytics pageview error:', error)
  }
}

// Track event
export async function trackEvent(
  event: string,
  data?: {
    locationId?: string
    queueId?: string
    entryId?: string
    userId?: string
    metadata?: Record<string, unknown>
  }
) {
  try {
    await prisma.analyticsEvent.create({
      data: {
        event,
        ...data
      }
    })
  } catch (error) {
    console.error('Analytics event error:', error)
  }
}

// Event types
export const Events = {
  // Queue events
  QUEUE_JOIN: 'queue_join',
  QUEUE_LEAVE: 'queue_leave',
  QUEUE_CALL: 'queue_call',
  QUEUE_COMPLETE: 'queue_complete',
  QUEUE_NO_SHOW: 'queue_no_show',
  
  // Business events
  LOCATION_CREATE: 'location_create',
  QUEUE_CREATE: 'queue_create',
  
  // User events
  USER_REGISTER: 'user_register',
  USER_LOGIN: 'user_login',
  
  // Payment events
  PAYMENT_INIT: 'payment_init',
  PAYMENT_SUCCESS: 'payment_success',
  PAYMENT_FAILED: 'payment_failed',
}

// Get stats for a location
export async function getLocationStats(locationId: string, days = 7) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const [events, dailyStats] = await Promise.all([
    prisma.analyticsEvent.groupBy({
      by: ['event'],
      where: {
        locationId,
        createdAt: { gte: startDate }
      },
      _count: true
    }),
    prisma.dailyStats.findMany({
      where: {
        locationId,
        date: { gte: startDate }
      },
      orderBy: { date: 'asc' }
    })
  ])

  return { events, dailyStats }
}

// Update daily stats (call at end of day or on events)
export async function updateDailyStats(locationId: string, date?: Date) {
  const targetDate = date || new Date()
  const startOfDay = new Date(targetDate)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(targetDate)
  endOfDay.setHours(23, 59, 59, 999)

  const entries = await prisma.queueEntry.findMany({
    where: {
      queue: { locationId },
      joinedAt: { gte: startOfDay, lte: endOfDay }
    },
    include: { queue: true }
  })

  const stats = {
    totalJoins: entries.length,
    totalServed: entries.filter(e => e.status === 'COMPLETED').length,
    totalNoShows: entries.filter(e => e.status === 'NO_SHOW').length,
    totalCancelled: entries.filter(e => e.status === 'CANCELLED').length,
  }

  // Calculate average wait time
  const completedWithTimes = entries.filter(e => e.status === 'COMPLETED' && e.calledAt)
  let avgWaitMinutes = null
  if (completedWithTimes.length > 0) {
    const totalWait = completedWithTimes.reduce((sum, e) => {
      const wait = (e.calledAt!.getTime() - e.joinedAt.getTime()) / 60000
      return sum + wait
    }, 0)
    avgWaitMinutes = totalWait / completedWithTimes.length
  }

  // Find peak hour
  const hourCounts = new Map<number, number>()
  entries.forEach(e => {
    const hour = e.joinedAt.getHours()
    hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1)
  })
  let peakHour = null
  let maxCount = 0
  hourCounts.forEach((count, hour) => {
    if (count > maxCount) {
      maxCount = count
      peakHour = hour
    }
  })

  await prisma.dailyStats.upsert({
    where: {
      date_locationId: { date: startOfDay, locationId }
    },
    create: {
      date: startOfDay,
      locationId,
      ...stats,
      avgWaitMinutes,
      peakHour
    },
    update: {
      ...stats,
      avgWaitMinutes,
      peakHour
    }
  })
}
