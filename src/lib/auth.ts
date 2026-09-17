import { SignJWT, jwtVerify } from 'jose'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

const secret = new TextEncoder().encode(
    process.env.JWT_SECRET ?? 'workshop-pulse-secret-2024'
)

export interface JWTPayload {
    userId: number
    role: 'ADMIN' | 'SECRETARY' | 'TECH'
    name: string
}

export async function signToken(payload: JWTPayload): Promise<string> {
    return new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('8h')
        .sign(secret)
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
    try {
        const { payload } = await jwtVerify(token, secret)
        return payload as unknown as JWTPayload
    } catch {
        return null
    }
}

export async function getAuthUser(req: NextRequest): Promise<JWTPayload | null> {
    const token = req.cookies.get('token')?.value
    if (!token) return null
    const payload = await verifyToken(token)
    if (!payload) return null

    // Re-check active status on every request so a deactivated account is
    // locked out immediately, rather than only on its next login attempt.
    const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { active: true } })
    if (!user || !user.active) return null

    return payload
}
