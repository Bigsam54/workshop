import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import bcrypt from 'bcryptjs'

const VALID_ROLES = ['ADMIN', 'SECRETARY', 'TECH']

// PUT /api/users/[id] — edit name/role/password, or activate/deactivate (Admin only)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = await getAuthUser(req)
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const targetId = Number(id)
    const body = await req.json()
    const { name, role, password, active } = body

    if (targetId === user.userId) {
        if (active === false) return NextResponse.json({ error: 'You cannot deactivate your own account' }, { status: 400 })
        if (role !== undefined && role !== 'ADMIN') return NextResponse.json({ error: 'You cannot change your own role' }, { status: 400 })
    }

    const target = await prisma.user.findUnique({ where: { id: targetId } })
    if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (role !== undefined && !VALID_ROLES.includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }
    if (password !== undefined && password !== '' && password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const data: Record<string, unknown> = {}
    if (name !== undefined) data.name = name
    if (role !== undefined) data.role = role
    if (active !== undefined) data.active = Boolean(active)
    if (password) data.passwordHash = await bcrypt.hash(password, 10)

    const updated = await prisma.user.update({
        where: { id: targetId },
        data,
        select: { id: true, name: true, username: true, role: true, active: true, createdAt: true },
    })
    return NextResponse.json(updated)
}
