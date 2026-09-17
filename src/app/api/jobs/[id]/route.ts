import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

// GET /api/jobs/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = await getAuthUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const job = await prisma.jobCard.findUnique({
        where: { id: Number(id) },
        include: {
            customer: true,
            vehicle: true,
            technician: { select: { id: true, name: true, username: true } },
            statusLogs: {
                include: { user: { select: { name: true, role: true } } },
                orderBy: { timestamp: 'asc' },
            },
            jobParts: {
                include: { part: true },
            },
            payment: true,
        },
    })

    if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Restore full financial visibility for all staff roles (Admin & Secretary)
    // No more zeroing out laborCost or unitPrice for Secretaries
    return NextResponse.json(job)
}

// PUT /api/jobs/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = await getAuthUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const jobId = Number(id)
    const body = await req.json()

    const { status, diagnosis, workDone, assignedTo, priority, laborCost } = body

    const current = await prisma.jobCard.findUnique({ where: { id: jobId } })
    if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const updateData: Record<string, unknown> = {}
    if (diagnosis !== undefined) updateData.diagnosis = diagnosis
    if (workDone !== undefined) updateData.workDone = workDone
    if (status !== undefined) updateData.status = status

    // Allow both Admin and Secretary to update key job details in the restored system
    if (user.role === 'ADMIN' || user.role === 'SECRETARY') {
        if (assignedTo !== undefined) updateData.assignedTo = assignedTo ? Number(assignedTo) : null
        if (priority !== undefined) updateData.priority = priority
        if (laborCost !== undefined) updateData.laborCost = Number(laborCost)
    }

    if (status === 'COMPLETED' && current.status !== 'COMPLETED') {
        updateData.completedAt = new Date()
    }

    const updatedJob = await prisma.jobCard.update({ where: { id: jobId }, data: updateData })

    // Completing a job is the moment a service was actually performed, so use it
    // to anchor predictive maintenance: record the date and odometer reading.
    if (status === 'COMPLETED' && current.status !== 'COMPLETED') {
        const vehicle = await prisma.vehicle.findUnique({ where: { id: current.vehicleId } })
        const mileageNum = vehicle?.mileage ? parseInt(vehicle.mileage, 10) : null
        await prisma.vehicle.update({
            where: { id: current.vehicleId },
            data: {
                lastServiceDate: new Date(),
                lastServiceMileage: mileageNum != null && !isNaN(mileageNum) ? mileageNum : undefined,
            },
        })
    }

    if (status && status !== current.status) {
        await prisma.jobStatusLog.create({
            data: { jobId, status, changedBy: user.userId },
        })
    }

    return NextResponse.json(updatedJob)
}
