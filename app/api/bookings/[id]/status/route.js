import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma'


export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { status, payedAmount } = body;

    // Validate that at least one field is provided
    if (!status && payedAmount === undefined) {
      return NextResponse.json(
        { error: 'At least one field (status or payedAmount) is required' },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (status) {
      const validStatuses = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status. Must be one of: PENDING, CONFIRMED, CANCELLED, COMPLETED' },
          { status: 400 }
        );
      }
    }

    // Check if booking exists
    const existingBooking = await prisma.booking.findUnique({
      where: { id },
      include: {
        car: true,
        user: true,
      },
    });

    if (!existingBooking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Validate payedAmount if provided
    if (payedAmount !== undefined) {
      if (payedAmount < 0) {
        return NextResponse.json(
          { error: 'Paid amount cannot be negative' },
          { status: 400 }
        );
      }
      if (payedAmount > existingBooking.totalAmount) {
        return NextResponse.json(
          { error: 'Paid amount cannot exceed total amount' },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData = {};
    if (status) updateData.status = status;
    if (payedAmount !== undefined) updateData.payedAmount = payedAmount;

    // Update booking
    const booking = await prisma.booking.update({
      where: { id },
      data: updateData,
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
    });

    // Create notification for changes
    let notificationMessage = '';
    if (status && payedAmount !== undefined) {
      notificationMessage = `Your booking has been updated. Status: ${status}. Paid amount: $${payedAmount}.`;
    } else if (status) {
      notificationMessage = `Your booking status has been updated to ${status}.`;
    } else if (payedAmount !== undefined) {
      notificationMessage = `Your payment has been updated. Paid amount: $${payedAmount}.`;
    }

    if (notificationMessage) {
      await prisma.notification.create({
        data: {
          userId: booking.userId,
          bookingId: booking.id,
          message: notificationMessage,
          sent: false,
        },
      });
    }

    return NextResponse.json(
      { message: 'Booking updated successfully', booking },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
