import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendQueueNotification } from '@/lib/sms'

// POST /api/queues/[queueId]/call-next - Call the next person in queue
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ queueId: string }> }
) {
  try {
    const { queueId } = await params

    // Get queue info for SMS
    const queue = await prisma.queue.findUnique({
      where: { id: queueId },
      include: { location: true }
    })

    // First, mark any currently CALLED entries as NO_SHOW (they didn't show up)
    const noShowEntries = await prisma.queueEntry.findMany({
      where: { queueId, status: 'CALLED' }
    })
    
    await prisma.queueEntry.updateMany({
      where: { queueId, status: 'CALLED' },
      data: { status: 'NO_SHOW', cancelledAt: new Date() }
    })

    // Send no-show SMS
    for (const entry of noShowEntries) {
      if (entry.phone) {
        sendQueueNotification(entry.phone, 'noShow', {
          ticketNumber: entry.ticketNumber
        }).catch(console.error) // Fire and forget
      }
    }

    // Find the next waiting entry
    const nextEntry = await prisma.queueEntry.findFirst({
      where: { queueId, status: 'WAITING' },
      orderBy: { joinedAt: 'asc' }
    })

    if (!nextEntry) {
      return NextResponse.json({ 
        message: 'No one waiting',
        entry: null 
      })
    }

    // Mark as called
    const calledEntry = await prisma.queueEntry.update({
      where: { id: nextEntry.id },
      data: { status: 'CALLED', calledAt: new Date() }
    })

    // Send "your turn" SMS
    if (calledEntry.phone && queue) {
      sendQueueNotification(calledEntry.phone, 'yourTurn', {
        ticketNumber: calledEntry.ticketNumber,
        locationName: queue.location.name
      }).catch(console.error) // Fire and forget
    }

    // Notify next person in line that they're almost up
    const secondInLine = await prisma.queueEntry.findFirst({
      where: { queueId, status: 'WAITING' },
      orderBy: { joinedAt: 'asc' }
    })

    if (secondInLine?.phone) {
      sendQueueNotification(secondInLine.phone, 'almostTurn', {
        ticketNumber: secondInLine.ticketNumber,
        peopleAhead: 1
      }).catch(console.error)
    }

    // Get remaining count
    const waitingCount = await prisma.queueEntry.count({
      where: { queueId, status: 'WAITING' }
    })

    return NextResponse.json({
      message: 'Called next customer',
      entry: calledEntry,
      waitingCount
    })
  } catch (error) {
    console.error('Call next error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
