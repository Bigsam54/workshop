import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({
        where: { id: auth.userId },
        select: { id: true, name: true, username: true, role: true },
    })
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    return NextResponse.json({ user })
}

export async function POST() {
    const response = NextResponse.json({ ok: true })
    response.cookies.set('token', '', { maxAge: 0, path: '/' })
    return response
}
