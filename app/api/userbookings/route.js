import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import prisma from '../../../lib/prisma'


export async function GET(request) {
  try {
    // Verify user session
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      )
    }

    // Get userId from query parameters
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    // Verify the userId matches the session user
    if (!userId || userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden. Invalid user ID.' },
        { status: 403 }
      )
    }

    // Fetch bookings from database
    // Example using Prisma - adjust based on your database setup
    const bookings = await prisma.booking.findMany({
      where: {
        userId: userId,
      },
      include: {
        car: {
          select: {
            id: true,
            brand: true,
            model: true,
            baseImage: true,
            amountPerDay: true,  
            slug: true,
            luggage: true,
            transmission: true,
            fuel: true,
            seats: true,
            doors: true,
            year: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc', // Most recent first
      },
    })

    // Transform the data if needed
    const formattedBookings = bookings.map((booking) => ({
      id: booking.id,
      status: booking.status,
      startDate: booking.startDate.toISOString(),
      endDate: booking.endDate.toISOString(),
      totalAmount: booking.totalAmount,
      createdAt: booking.createdAt.toISOString(),
      car: booking.car ? {
        id: booking.car.id,
        brand: booking.car.brand,
        model: booking.car.model,
        baseImage: booking.car.baseImage,
        amountPerDay: booking.car.amountPerDay,
        slug: booking.car.slug, 
        luggage: booking.car.luggage,
        transmission: booking.car.transmission,
        fuel: booking.car.fuel,
        seats: booking.car.seats,
        doors: booking.car.doors,
        year: booking.car.year,
      } : null,
    }))

    return NextResponse.json(
      {
        success: true,
        bookings: formattedBookings,
        total: formattedBookings.length,
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch bookings. Please try again later.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}