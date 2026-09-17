import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { computeMaintenanceStatus } from '@/lib/maintenance'

// GET /api/vehicles/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = await getAuthUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const vehicle = await prisma.vehicle.findUnique({ where: { id: Number(id) } })
    if (!vehicle) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const currentMileage = vehicle.mileage ? parseInt(vehicle.mileage, 10) : null
    const maintenance = computeMaintenanceStatus({
        lastServiceDate: vehicle.lastServiceDate,
        lastServiceMileage: vehicle.lastServiceMileage,
        currentMileage: currentMileage != null && !isNaN(currentMileage) ? currentMileage : null,
    })

    return NextResponse.json({ ...vehicle, maintenance })
}

// PUT /api/vehicles/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = await getAuthUser(req)
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await req.json()
    const { lastServiceDate, lastServiceMileage, mileage, notes, history, previousWork } = body

    const data: Record<string, unknown> = {}
    if (lastServiceDate !== undefined) data.lastServiceDate = lastServiceDate ? new Date(lastServiceDate) : null
    if (lastServiceMileage !== undefined) {
        data.lastServiceMileage = lastServiceMileage === '' || lastServiceMileage == null
            ? null
            : Number(lastServiceMileage)
    }
    if (mileage !== undefined) data.mileage = mileage
    if (notes !== undefined) data.notes = notes
    if (history !== undefined) data.history = history
    if (previousWork !== undefined) data.previousWork = previousWork

    const vehicle = await prisma.vehicle.update({ where: { id: Number(id) }, data })
    return NextResponse.json(vehicle)
}
