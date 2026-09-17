import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

// GET /api/customers
export async function GET(req: NextRequest) {
    const user = await getAuthUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''

    const customers = await prisma.customer.findMany({
        where: search ? {
            OR: [
                { name: { contains: search } },
                { phone: { contains: search } },
                { email: { contains: search } },
            ]
        } : {},
        include: {
            vehicles: true,
            jobCards: {
                select: {
                    id: true,
                    status: true,
                    createdAt: true,
                    payment: {
                        select: { amount: true, status: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            },
            _count: { select: { jobCards: true } }
        },
        orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(customers)
}

// POST /api/customers
export async function POST(req: NextRequest) {
    const user = await getAuthUser(req)
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SECRETARY')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, phone, email, location, vehicle } = body

    if (!name || !phone) return NextResponse.json({ error: 'Name and phone required' }, { status: 400 })

    try {
        // 1. Check if phone already exists
        const existingCustomer = await prisma.customer.findUnique({ where: { phone } })
        if (existingCustomer) return NextResponse.json({ error: `Phone number ${phone} is already registered to ${existingCustomer.name}` }, { status: 409 })

        // 2. Check if vehicle plate already exists
        if (vehicle?.plateNumber) {
            const existingVehicle = await prisma.vehicle.findUnique({
                where: { plateNumber: vehicle.plateNumber },
                include: { customer: true }
            })
            if (existingVehicle) return NextResponse.json({ error: `Plate ${vehicle.plateNumber} is already assigned to ${existingVehicle.customer.name}` }, { status: 409 })
        }

        const customer = await prisma.customer.create({
            data: {
                name,
                phone,
                email,
                location,
                vehicles: vehicle?.plateNumber ? {
                    create: {
                        plateNumber: vehicle.plateNumber,
                        make: vehicle.make,
                        model: vehicle.model,
                        year: isNaN(Number(vehicle.year)) ? new Date().getFullYear() : Number(vehicle.year),
                        previousWork: vehicle.previousWork,
                        history: vehicle.history,
                        notes: vehicle.notes,
                        lastServiceDate: vehicle.lastServiceDate ? new Date(vehicle.lastServiceDate) : undefined,
                        lastServiceMileage: vehicle.lastServiceMileage ? Number(vehicle.lastServiceMileage) : undefined,
                    }
                } : undefined
            } as any,
            include: { vehicles: true }
        })
        return NextResponse.json(customer, { status: 201 })
    } catch (err: any) {
        console.error('Registration Error:', err)
        return NextResponse.json({
            error: `Master Terminal Error: ${err.message || 'System Failure'}`,
            details: err.message,
            stack: err.stack
        }, { status: 500 })
    }
}
