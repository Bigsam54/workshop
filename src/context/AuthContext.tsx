'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface User {
    id: number
    name: string
    role: string
    username: string
}

interface AuthContextType {
    user: User | null
    loading: boolean
    login: (username: string, password: string) => Promise<void>
    logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/auth/me')
            .then(r => r.ok ? r.json() : null)
            .then(data => { if (data?.user) setUser(data.user) })
            .finally(() => setLoading(false))
    }, [])

    const login = async (username: string, password: string) => {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        })
        if (!res.ok) {
            const data = await res.json()
            throw new Error(data.error || 'Login failed')
        }
        const data = await res.json()
        setUser(data.user)
    }

    const logout = async () => {
        await fetch('/api/auth/me', { method: 'POST' })
        setUser(null)
    }

    return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}
