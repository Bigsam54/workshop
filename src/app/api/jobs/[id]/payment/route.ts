import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

// POST /api/jobs/[id]/payment — mark a job as paid
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = await getAuthUser(req)
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const jobId = Number(id)
    const { method, amount, reference } = await req.json()

    if (!method || !amount) return NextResponse.json({ error: 'Method and amount required' }, { status: 400 })

    const existing = await prisma.payment.findUnique({ where: { jobId } })

    let payment
    if (existing) {
        payment = await prisma.payment.update({
            where: { jobId },
            data: { method, amount: Number(amount), status: 'PAID', paidAt: new Date(), reference },
        })
    } else {
        payment = await prisma.payment.create({
            data: { jobId, method, amount: Number(amount), status: 'PAID', paidAt: new Date(), reference },
        })
    }

    // Update job status to COMPLETED + set completedAt + log
    await prisma.jobCard.update({
        where: { id: jobId },
        data: { status: 'COMPLETED', completedAt: new Date() }
    })
    await prisma.jobStatusLog.create({ data: { jobId, status: 'COMPLETED', changedBy: user.userId } })

    return NextResponse.json(payment, { status: 201 })
}
