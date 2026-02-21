'use client'
import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/components/Toast'
import { Lock, Phone, ArrowRight } from 'lucide-react'

export default function LoginPage() {
    const { login, user } = useAuth()
    const { toast } = useToast()
    const router = useRouter()
    const [phone, setPhone] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)

    if (user) {
        router.replace('/dashboard')
        return null
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            await login(phone, password)
            toast('Welcome back! Logged in successfully.', 'success')
            router.push('/dashboard')
        } catch (err: unknown) {
            toast((err as Error).message || 'Login failed', 'error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--bg-app)',
            padding: 24,
            position: 'relative'
        }}>
            {/* Background pattern */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '400px', background: 'linear-gradient(180deg, #ecfeff 0%, rgba(236, 254, 255, 0) 100%)', zIndex: 0 }} />

            <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>
                {/* Logo & Branding */}
                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                    <div style={{
                        width: 72, height: 72, borderRadius: 20, margin: '0 auto 20px',
                        background: 'linear-gradient(135deg, var(--primary), #0e7490)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 32, boxShadow: '0 12px 24px -6px rgba(8, 145, 178, 0.4)',
                        color: 'white'
                    }}>⚙️</div>
                    <h1 style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-0.05em', marginBottom: 4, color: '#0f172a' }}>WorkshopPulse</h1>
                    <p style={{ fontSize: 15, color: 'var(--text-secondary)', fontWeight: 500 }}>Management Suite for Auto Professionals</p>
                </div>

                <div className="card" style={{ padding: 8, borderRadius: 24, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.08)' }}>
                    <div className="card-body" style={{ padding: 32 }}>
                        <div style={{ marginBottom: 28 }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 4 }}>System Access</h2>
                            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Authenticate to manage workshop resources</p>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 20 }}>
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Staff Phone ID</label>
                                <div style={{ position: 'relative' }}>
                                    <Phone size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.6 }} />
                                    <input
                                        className="form-input"
                                        style={{ paddingLeft: 44, borderRadius: 12, height: 48, background: '#f8fafc' }}
                                        type="tel"
                                        placeholder="020XXXXXXX"
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group" style={{ marginBottom: 8 }}>
                                <label className="form-label" style={{ fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Security Password</label>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.6 }} />
                                    <input
                                        className="form-input"
                                        style={{ paddingLeft: 44, borderRadius: 12, height: 48, background: '#f8fafc' }}
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <button className="btn btn-primary" style={{ height: 48, borderRadius: 12, justifyContent: 'center', fontSize: 15, fontWeight: 700 }} type="submit" disabled={loading}>
                                {loading ? 'Validating...' : 'Log into Workshop'} <ArrowRight size={18} style={{ marginLeft: 8 }} />
                            </button>
                        </form>

                        <div className="divider" style={{ margin: '32px 0' }} />

                        <div style={{ background: '#f1f5f9', borderRadius: 16, padding: 20 }}>
                            <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, textAlign: 'center' }}>Staff Access Tokens</div>
                            <div style={{ display: 'grid', gap: 8 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, padding: '4px 0' }}>
                                    <span style={{ fontWeight: 600, color: '#334155' }}>Admin Terminal</span>
                                    <code style={{ fontSize: 11, color: 'var(--primary)', background: '#fff', padding: '2px 6px', borderRadius: 4 }}>0201000001</code>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, padding: '4px 0' }}>
                                    <span style={{ fontWeight: 600, color: '#334155' }}>Secretary Hub</span>
                                    <code style={{ fontSize: 11, color: 'var(--primary)', background: '#fff', padding: '2px 6px', borderRadius: 4 }}>0201000002</code>
                                </div>
                            </div>
                            <p style={{ marginTop: 12, fontSize: 10, color: '#94a3b8', textAlign: 'center' }}>Default Password: <strong style={{ color: '#64748b' }}>admin123 / sec123</strong></p>
                        </div>
                    </div>
                </div>

                <p style={{ textAlign: 'center', marginTop: 32, fontSize: 12, color: 'var(--text-muted)' }}>
                    &copy; {new Date().getFullYear()} WorkshopPulse. Precision Engineered for Maintenance.
                </p>
            </div>
        </div>
    )
}
