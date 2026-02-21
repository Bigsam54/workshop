import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

// POST /api/jobs/[id]/parts — add a part to a job card
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = await getAuthUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const jobId = Number(id)
    const { partId, qty } = await req.json()

    if (!partId || !qty || qty < 1) {
        return NextResponse.json({ error: 'Part and quantity required' }, { status: 400 })
    }

    const part = await prisma.part.findUnique({ where: { id: Number(partId) } })
    if (!part) return NextResponse.json({ error: 'Part not found' }, { status: 404 })

    if (part.stockQty < qty) {
        return NextResponse.json({ error: `Insufficient stock. Available: ${part.stockQty}` }, { status: 400 })
    }

    const [jobPart] = await prisma.$transaction([
        prisma.jobPart.create({
            data: { jobId, partId: Number(partId), qty: Number(qty), unitPrice: part.unitPrice },
            include: { part: true },
        }),
        prisma.part.update({
            where: { id: Number(partId) },
            data: { stockQty: { decrement: Number(qty) } },
        }),
        prisma.inventoryMovement.create({
            data: {
                partId: Number(partId),
                type: 'OUT',
                qty: Number(qty),
                note: `Used in job #${jobId}`,
                createdBy: user.userId,
            },
        }),
    ])

    return NextResponse.json(jobPart, { status: 201 })
}

// DELETE /api/jobs/[id]/parts
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = await getAuthUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: jobId } = await params
    const { searchParams } = new URL(req.url)
    const jobPartId = searchParams.get('jobPartId')
    if (!jobPartId) return NextResponse.json({ error: 'jobPartId required' }, { status: 400 })

    const jobPart = await prisma.jobPart.findUnique({ where: { id: Number(jobPartId) }, include: { part: true } })
    if (!jobPart) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await prisma.$transaction([
        prisma.jobPart.delete({ where: { id: Number(jobPartId) } }),
        prisma.part.update({ where: { id: jobPart.partId }, data: { stockQty: { increment: jobPart.qty } } }),
        prisma.inventoryMovement.create({
            data: { partId: jobPart.partId, type: 'IN', qty: jobPart.qty, note: `Returned from job #${jobId}`, createdBy: user.userId },
        }),
    ])

    return NextResponse.json({ ok: true })
}
