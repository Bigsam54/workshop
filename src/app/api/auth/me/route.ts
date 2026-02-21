import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
    const user = await getAuthUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ user })
}

export async function POST() {
    const response = NextResponse.json({ ok: true })
    response.cookies.set('token', '', { maxAge: 0, path: '/' })
    return response
}
