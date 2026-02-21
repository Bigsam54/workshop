import { SignJWT, jwtVerify } from 'jose'
import { NextRequest } from 'next/server'

const secret = new TextEncoder().encode(
    process.env.JWT_SECRET ?? 'workshop-pulse-secret-2024'
)

export interface JWTPayload {
    userId: number
    role: 'ADMIN' | 'SECRETARY'
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
    return verifyToken(token)
}
