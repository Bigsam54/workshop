import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

// POST /api/vehicles
export async function POST(req: NextRequest) {
    const user = await getAuthUser(req)
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { customerId, plateNumber, make, model, year, previousWork, history, notes, lastServiceDate, lastServiceMileage } = body

    if (!customerId || !plateNumber || !make || !model || !year) {
        return NextResponse.json({ error: 'All fields required' }, { status: 400 })
    }

    try {
        const vehicle = await prisma.vehicle.create({
            data: {
                customerId: Number(customerId),
                plateNumber: plateNumber.toUpperCase(),
                make,
                model,
                year: Number(year),
                previousWork,
                history,
                notes,
                lastServiceDate: lastServiceDate ? new Date(lastServiceDate) : undefined,
                lastServiceMileage: lastServiceMileage ? Number(lastServiceMileage) : undefined,
            }
        })
        return NextResponse.json(vehicle, { status: 201 })
    } catch {
        return NextResponse.json({ error: 'Plate number already exists' }, { status: 409 })
    }
}
