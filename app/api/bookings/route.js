import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma'


const TELEGRAM_BOT_TOKEN = '8170260938:AAFl8uCP7DNgIXUgGrEBDpr_aR2ZfTWBtKE';
const TELEGRAM_CHAT_ID = '7528680682';

async function sendTelegramNotification(booking, car) {
  try {
    const pickupDate = new Date(booking.startDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const dropoffDate = new Date(booking.endDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const message = `🚗 *New Car Booking*\n\n` +
      `*Car:* ${car.model}\n` +
      `*Pickup Date:* ${pickupDate}\n` +
      `*Drop-off Date:* ${dropoffDate}\n` +
      `*Total Amount:* $${booking.totalAmount}\n` +
      `*Booking ID:* ${booking.id}`;

    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;

    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        photo: car.baseImage,
        caption: message,
        parse_mode: 'Markdown',
      }),
    });

    if (!response.ok) {
      console.error('Failed to send Telegram notification:', await response.text());
    }
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, carId, startDate, endDate, payedAmount, rideType } = body;

    // Validate required fields
    if (!userId || !carId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'User ID, car ID, start date, and end date are required' },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify car exists
    const car = await prisma.car.findUnique({
      where: { id: carId },
    });

    if (!car) {
      return NextResponse.json(
        { error: 'Car not found' },
        { status: 404 }
      );
    }

    // Calculate total amount based on ride type
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const baseRate = rideType === 'chauffeured' ? car.amountPerDay * 1.3 : car.amountPerDay;
    const totalAmount = Math.round(days * baseRate);

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        userId,
        carId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        totalAmount,
        payedAmount: payedAmount || 0,
        rideType: rideType || 'solo',
        status: 'PENDING',
      },
      include: {
        car: true,
        user: true,
      },
    });

    // Create notification record
    await prisma.notification.create({
      data: {
        userId,
        bookingId: booking.id,
        message: `Your booking for ${car.brand} ${car.model} has been created and is pending confirmation.`,
        sent: false,
      },
    });

    // Send Telegram notification
    await sendTelegramNotification(booking, car);

    return NextResponse.json(
      { message: 'Booking created successfully', booking },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Build where clause for PENDING and CONFIRMED bookings
    const where = status
      ? { status }
      : { status: { in: ['PENDING', 'CONFIRMED'] } };

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        car: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(
      { bookings },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
