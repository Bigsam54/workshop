import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

// GET /api/customers/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = await getAuthUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const customer = await prisma.customer.findUnique({
        where: { id: Number(id) },
        include: {
            vehicles: { orderBy: { createdAt: 'desc' } },
            jobCards: {
                include: { vehicle: true, technician: true, payment: true },
                orderBy: { createdAt: 'desc' },
            },
        },
    })

    if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(customer)
}

// PUT /api/customers/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = await getAuthUser(req)
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await req.json()
    const { name, phone, email, location } = body

    const customer = await prisma.customer.update({
        where: { id: Number(id) },
        data: { name, phone, email, location },
    })
    return NextResponse.json(customer)
}
