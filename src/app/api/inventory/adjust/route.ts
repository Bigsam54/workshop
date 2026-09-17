import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

// POST /api/inventory/adjust
export async function POST(req: NextRequest) {
    const user = await getAuthUser(req)
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { partId, type, qty, note } = body

    if (!partId || !type || !qty) {
        return NextResponse.json({ error: 'partId, type, qty required' }, { status: 400 })
    }

    const part = await prisma.part.findUnique({ where: { id: Number(partId) } })
    if (!part) return NextResponse.json({ error: 'Part not found' }, { status: 404 })

    let newQty = part.stockQty
    if (type === 'IN') newQty += Number(qty)
    else if (type === 'OUT') {
        if (part.stockQty < Number(qty)) {
            return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 })
        }
        newQty -= Number(qty)
    } else if (type === 'ADJUST') {
        newQty = Number(qty)
    }

    const [movement] = await prisma.$transaction([
        prisma.inventoryMovement.create({
            data: { partId: Number(partId), type, qty: Number(qty), previousQty: part.stockQty, newQty, note, createdBy: user.userId },
        }),
        prisma.part.update({ where: { id: Number(partId) }, data: { stockQty: newQty } }),
    ])

    return NextResponse.json({ movement, newQty }, { status: 201 })
}

// GET /api/inventory/adjust — list movements
export async function GET(req: NextRequest) {
    const user = await getAuthUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const partId = searchParams.get('partId')

    const movements = await prisma.inventoryMovement.findMany({
        where: partId ? { partId: Number(partId) } : {},
        include: { part: true, createdByUser: { select: { name: true } } },
        orderBy: { timestamp: 'desc' },
        take: 100,
    })
    return NextResponse.json(movements)
}
