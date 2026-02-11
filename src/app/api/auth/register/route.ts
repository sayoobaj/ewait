import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessName, email, password, phone } = body

    if (!businessName || !email || !password) {
      return NextResponse.json(
        { error: 'Business name, email, and password are required' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name: businessName,
        passwordHash,
        role: 'ADMIN'
      }
    })

    // Create default location for the business
    const location = await prisma.location.create({
      data: {
        name: businessName,
        phone,
        ownerId: user.id
      }
    })

    // Create a default queue
    await prisma.queue.create({
      data: {
        name: 'Main Queue',
        description: 'Default queue',
        locationId: location.id
      }
    })

    return NextResponse.json({
      message: 'Account created successfully',
      userId: user.id
    }, { status: 201 })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    )
  }
}
