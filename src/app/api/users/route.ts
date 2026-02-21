import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

// GET /api/users — list all users (for tech dropdown etc.)
export async function GET(req: NextRequest) {
    const user = await getAuthUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const users = await prisma.user.findMany({
        select: { id: true, name: true, phone: true, role: true, createdAt: true },
        orderBy: { name: 'asc' },
    })
    return NextResponse.json(users)
}
