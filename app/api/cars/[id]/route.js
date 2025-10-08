import { NextResponse } from "next/server";
import prisma from '../../../../lib/prisma'

// PUT /api/cars/[id]
export async function PUT(request, { params }) {
  try {
    const { id } = params; // 🔑 extract car ID from the URL
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

    // Check if car exists
    const existingCar = await prisma.car.findUnique({
      where: { id },
    });

    if (!existingCar) {
      return NextResponse.json({ error: "Car not found" }, { status: 404 });
    }

    // Update car
    const updatedCar = await prisma.car.update({
      where: { id },
      data: {
        brand: brand ?? existingCar.brand,
        model: model ?? existingCar.model,
        slug: slug ?? existingCar.slug,
        licensePlate: licensePlate ?? existingCar.licensePlate,
        baseImage: baseImage ?? existingCar.baseImage,
        images: Array.isArray(images)
          ? images
          : typeof images === "string"
          ? images.split(",").map((s) => s.trim()).filter(Boolean)
          : existingCar.images,
        amountPerDay: amountPerDay ? parseInt(amountPerDay) : existingCar.amountPerDay,
        carUses: carUses ?? existingCar.carUses,
        seats: seats ? parseInt(seats) : existingCar.seats,
        transmission: transmission ?? existingCar.transmission,
        fuel: fuel ?? existingCar.fuel,
        year: year ? parseInt(year) : existingCar.year,
        luggage: luggage ? parseInt(luggage) : existingCar.luggage,
        doors: doors ? parseInt(doors) : existingCar.doors,
      },
    });

    return NextResponse.json(
      { message: "Car updated successfully", car: updatedCar },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating car:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req, { params }) {
  const { id } = params;

  try {
    const car = await prisma.car.findUnique({
      where: { slug: id },
      // exclude bookings
      include: {
        bookings: false, // won't fetch bookings
      },
    });

    if (!car) {
      return NextResponse.json({ error: "Car not found" }, { status: 404 });
    }

    return NextResponse.json(car);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
