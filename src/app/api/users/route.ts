import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import bcrypt from 'bcryptjs'

const VALID_ROLES = ['ADMIN', 'SECRETARY', 'TECH']

// GET /api/users — list all users (for tech dropdown, and Team Management page)
export async function GET(req: NextRequest) {
    const user = await getAuthUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const users = await prisma.user.findMany({
        select: { id: true, name: true, username: true, role: true, active: true, createdAt: true },
        orderBy: { name: 'asc' },
    })
    return NextResponse.json(users)
}

// POST /api/users — create a new staff account (Admin only)
export async function POST(req: NextRequest) {
    const user = await getAuthUser(req)
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { name, username, password, role } = body

    if (!name || !username || !password || !role) {
        return NextResponse.json({ error: 'Name, username, password and role are required' }, { status: 400 })
    }
    if (!VALID_ROLES.includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }
    if (password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { username } })
    if (existing) return NextResponse.json({ error: `Username "${username}" is already taken` }, { status: 409 })

    const passwordHash = await bcrypt.hash(password, 10)
    const newUser = await prisma.user.create({
        data: { name, username, passwordHash, role },
        select: { id: true, name: true, username: true, role: true, active: true, createdAt: true },
    })
    return NextResponse.json(newUser, { status: 201 })
}
