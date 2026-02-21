import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

// GET /api/parts/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = await getAuthUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const part = await prisma.part.findUnique({ where: { id: Number(id) } })
    if (!part) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(part)
}

// PUT /api/parts/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = await getAuthUser(req)
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const body = await req.json()
    const part = await prisma.part.update({
        where: { id: Number(id) },
        data: {
            name: body.name,
            sku: body.sku?.toUpperCase(),
            unitPrice: Number(body.unitPrice),
            lowStockLevel: Number(body.lowStockLevel),
        },
    })
    return NextResponse.json(part)
}
