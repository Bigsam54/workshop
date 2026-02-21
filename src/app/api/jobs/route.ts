import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

function generateJobCode() {
    const n = Math.floor(Math.random() * 90000) + 10000
    return `JOB-${n}`
}

// GET /api/jobs
export async function GET(req: NextRequest) {
    const user = await getAuthUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const techId = searchParams.get('techId')
    const mine = searchParams.get('mine')

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (techId) where.assignedTo = Number(techId)
    if (mine === '1') where.assignedTo = user.userId

    const jobs = await prisma.jobCard.findMany({
        where,
        include: {
            customer: true,
            vehicle: true,
            technician: { select: { id: true, name: true } },
            payment: true,
            _count: { select: { jobParts: true } },
        },
        orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(jobs)
}

// POST /api/jobs
export async function POST(req: NextRequest) {
    const user = await getAuthUser(req)
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { customerId, vehicleId, assignedTo, complaint, priority } = body

    if (!customerId || !vehicleId || !complaint) {
        return NextResponse.json({ error: 'Required fields missing' }, { status: 400 })
    }

    let jobCode = generateJobCode()
    // ensure unique
    let exists = await prisma.jobCard.findUnique({ where: { jobCode } })
    while (exists) {
        jobCode = generateJobCode()
        exists = await prisma.jobCard.findUnique({ where: { jobCode } })
    }

    const job = await prisma.jobCard.create({
        data: {
            jobCode,
            customerId: Number(customerId),
            vehicleId: Number(vehicleId),
            assignedTo: assignedTo ? Number(assignedTo) : null,
            complaint,
            priority: priority || 'MEDIUM',
            status: 'NEW',
        },
        include: { customer: true, vehicle: true, technician: true },
    })

    // Auto-log initial status
    await prisma.jobStatusLog.create({
        data: { jobId: job.id, status: 'NEW', changedBy: user.userId },
    })

    return NextResponse.json(job, { status: 201 })
}
