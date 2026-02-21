import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

// GET /api/parts
export async function GET(req: NextRequest) {
    const user = await getAuthUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const parts = await prisma.part.findMany({
        orderBy: { name: 'asc' },
    })
    return NextResponse.json(parts)
}

// POST /api/parts
export async function POST(req: NextRequest) {
    const user = await getAuthUser(req)
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { name, sku, unitPrice, stockQty, lowStockLevel } = body

    if (!name || !sku || unitPrice == null) {
        return NextResponse.json({ error: 'Name, SKU, and unit price required' }, { status: 400 })
    }

    try {
        const part = await prisma.part.create({
            data: {
                name,
                sku: sku.toUpperCase(),
                unitPrice: Number(unitPrice),
                stockQty: Number(stockQty || 0),
                lowStockLevel: Number(lowStockLevel || 5),
            },
        })
        return NextResponse.json(part, { status: 201 })
    } catch {
        return NextResponse.json({ error: 'SKU already exists' }, { status: 409 })
    }
}
