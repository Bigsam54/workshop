'use client'
import { useState, FormEvent, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/components/Toast'
import { Lock, Phone, ArrowRight, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
    const { login, user } = useAuth()
    const { toast } = useToast()
    const router = useRouter()
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [bgIndex, setBgIndex] = useState(0)

    const bgImages = ['/login1.png', '/login2.png', '/login3.png']

    useEffect(() => {
        const timer = setInterval(() => {
            setBgIndex(prev => (prev + 1) % bgImages.length)
        }, 5000)
        return () => clearInterval(timer)
    }, [bgImages.length])

    useEffect(() => {
        if (user) {
            router.replace(user.role === 'TECH' ? '/my-jobs' : '/dashboard')
        }
    }, [user, router])

    if (user) return null

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const loggedInUser = await login(username, password)
            toast('Welcome back! Logged in successfully.', 'success')
            router.push(loggedInUser.role === 'TECH' ? '/my-jobs' : '/dashboard')
        } catch (err: unknown) {
            toast((err as Error).message || 'Login failed', 'error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-app)' }}>
            {/* Left Side: Elite Branding Hero */}
            <div className="login-hero" style={{
                flex: 1,
                display: 'none',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '80px',
                position: 'relative',
                overflow: 'hidden',
                background: '#020617'
            } as any}>
                {/* Background Image Slider */}
                {bgImages.map((img, idx) => (
                    <div key={idx} style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundImage: `url(${img})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        transition: 'opacity 1.5s ease-in-out',
                        opacity: idx === bgIndex ? 0.4 : 0,
                        zIndex: 0
                    }} />
                ))}


                <div style={{ position: 'relative', zIndex: 2, maxWidth: 480 }}>

                    <h1 style={{
                        fontSize: '3.5rem', fontWeight: 900, letterSpacing: '-0.04em',
                        lineHeight: 1, color: 'white', marginBottom: 24
                    }}>WorkshopPulse Elite</h1>

                    <p style={{
                        fontSize: '1.25rem', color: 'rgba(255,255,255,0.7)',
                        lineHeight: 1.6, marginBottom: 48, fontWeight: 400,
                        textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                    }}>
                        Precision Engineering. Unrivaled Service. <br />
                        The standard of excellence for the discerning Ghanaian motorist.
                    </p>

                    <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: 24, fontWeight: 800, color: '#fbbf24' }}>100%</span>
                            <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.6 }}>Precision</span>
                        </div>
                        <div style={{ width: 1, height: 40, background: 'rgba(255,255,255,0.2)' }} />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: 24, fontWeight: 800, color: '#fbbf24' }}>Elite</span>
                            <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.6 }}>Standards</span>
                        </div>
                    </div>
                </div>

                {/* CSS override for media query to show on large screens */}
                <style>{`
                    @media (min-width: 1024px) {
                        .login-hero { display: flex !important; }
                    }
                `}</style>
            </div>

            {/* Right Side: Authentication Form */}
            <div style={{
                width: '100%', maxWidth: '500px', margin: '0 auto',
                display: 'flex', flexDirection: 'column', justifyContent: 'center',
                padding: '40px', background: 'var(--bg-app)'
            }}>
                <div style={{ maxWidth: 400, width: '100%', margin: '0 auto' }}>
                    {/* Mobile Logo Only */}
                    <div className="mobile-only" style={{ marginBottom: 48 }}>
                        <div style={{
                            width: 56, height: 56, borderRadius: 14,
                            background: 'var(--primary)', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', fontSize: 24,
                            marginBottom: 16
                        }}>⭐</div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>WorkshopPulse</h2>
                    </div>

                    <div style={{ marginBottom: 40 }}>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: 8, letterSpacing: '-0.02em' }}>Login</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Enter your credentials to access the suite.</p>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        <div className="form-group">
                            <label className="form-label" style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: 12, fontWeight: 700, marginBottom: 12, display: 'block', opacity: 0.6 }}>Username</label>
                            <div style={{ position: 'relative' }}>
                                <ArrowRight size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                                <input
                                    className="form-input"
                                    style={{ paddingLeft: 48, height: 56, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '1.1rem' }}
                                    type="text"
                                    placeholder="Workshop"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label" style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: 12, fontWeight: 700, marginBottom: 12, display: 'block', opacity: 0.6 }}>Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                                <input
                                    className="form-input"
                                    style={{ paddingLeft: 48, paddingRight: 48, height: 56, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '1.1rem' }}
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: 16,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        color: 'white',
                                        opacity: 0.4,
                                        cursor: 'pointer',
                                        padding: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <button
                            className="btn btn-primary"
                            style={{
                                height: 60,
                                borderRadius: 14,
                                fontSize: '1.1rem',
                                fontWeight: 800,
                                marginTop: 12,
                                background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                                border: 'none',
                                boxShadow: '0 10px 20px rgba(99, 102, 241, 0.2)'
                            }}
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="spinner" style={{ width: 24, height: 24 }} />
                            ) : (
                                <>Sign In <ArrowRight size={20} style={{ marginLeft: 12 }} /></>
                            )}
                        </button>
                    </form>

                    <div style={{
                        marginTop: 48, padding: 24, borderRadius: 16,
                        background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)',
                    }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Authorized Terminals</div>
                        <div style={{ display: 'grid', gap: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                <span style={{ opacity: 0.6 }}>Super Admin</span>
                                <code style={{ color: '#fbbf24', fontWeight: 700 }}>Workshop</code>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                <span style={{ opacity: 0.6 }}>Secretary Hub</span>
                                <code style={{ color: '#fbbf24', fontWeight: 700 }}>Evelyn</code>
                            </div>
                        </div>
                    </div>

                    <p style={{ textAlign: 'center', marginTop: 40, fontSize: 12, color: 'var(--text-muted)', opacity: 0.5 }}>
                        &copy; {new Date().getFullYear()} WorkshopPulse Precision. <br />All Rights Reserved.
                    </p>
                </div>

                <style>{`
                    @media (min-width: 1024px) {
                        .mobile-only { display: none !important; }
                    }
                `}</style>
            </div>
        </div>
    )
}
