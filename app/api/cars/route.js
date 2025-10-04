import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      brand,
      model,
      slug,
      licensePlate,
      baseImage,
      images,
      amountPerDay,
      carUses,
      seats,
      transmission,
      fuel,
      year,
      luggage,
      doors,
    } = body;

    if (!brand || !model || !licensePlate || !baseImage || !amountPerDay) {
      return NextResponse.json(
        { error: 'Brand, model, license plate, base image, and amount per day are required' },
        { status: 400 }
      );
    }

    // Check if car with license plate already exists
    const existingCar = await prisma.car.findUnique({
      where: { licensePlate },
    });

    if (existingCar) {
      return NextResponse.json(
        { error: 'Car with this license plate already exists' },
        { status: 409 }
      );
    }

    // Create car
    const car = await prisma.car.create({
      data: {
        brand,
        model,
        slug,
        licensePlate,
        baseImage,
        images: images || [],
        amountPerDay: parseInt(amountPerDay),
        carUses: carUses || [],
        seats: parseInt(seats),
        transmission,
        fuel,
        year: parseInt(year),
        luggage: luggage ? parseInt(luggage) : 0,
        doors: parseInt(doors),
      },
    });

    return NextResponse.json(
      { message: 'Car added successfully', car },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding car:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const carUse = searchParams.get('carUse');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 24;
    const skip = (page - 1) * limit;

    // Build where clause
    const where = carUse && carUse !== 'ALL_USE' 
      ? { carUses: { has: carUse } }
      : {};

    // Fetch cars with pagination
    const [cars, totalCount] = await Promise.all([
      prisma.car.findMany({
        where,
        skip,
        take: limit,
        include: {
          bookings: false, // won't fetch bookings
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.car.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json(
      {
        cars,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching cars:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
