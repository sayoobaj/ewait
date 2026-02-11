import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/queues/[queueId]/call-next - Call the next person in queue
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ queueId: string }> }
) {
  try {
    const { queueId } = await params

    // First, mark any currently CALLED entries as NO_SHOW (they didn't show up)
    await prisma.queueEntry.updateMany({
      where: { queueId, status: 'CALLED' },
      data: { status: 'NO_SHOW', cancelledAt: new Date() }
    })

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
