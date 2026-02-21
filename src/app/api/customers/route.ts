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
            _count: { select: { jobCards: true } }
        },
        orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(customers)
}

// POST /api/customers
export async function POST(req: NextRequest) {
    const user = await getAuthUser(req)
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { name, phone, email, location } = body

    if (!name || !phone) return NextResponse.json({ error: 'Name and phone required' }, { status: 400 })

    try {
        const customer = await prisma.customer.create({ data: { name, phone, email, location } })
        return NextResponse.json(customer, { status: 201 })
    } catch {
        return NextResponse.json({ error: 'Phone already exists' }, { status: 409 })
    }
}
