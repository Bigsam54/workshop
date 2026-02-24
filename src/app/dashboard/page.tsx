'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { AppSidebar } from '@/components/AppSidebar'
import { StatusBadge, formatCurrency, formatDate } from '@/components/ui'
import { Briefcase, CheckCircle, TrendingUp, Clock, AlertTriangle, Plus, Users, Package } from 'lucide-react'

interface KPIs {
    jobsToday: number
    openJobs: number
    completedThisWeek: number
    revenueThisMonth: number
}

interface JobCard {
    id: number; jobCode: string; status: string; priority: string
    customer: { name: string }
    vehicle: { plateNumber: string; make: string; model: string }
    technician?: { name: string }
    createdAt: string
    payment?: { amount: number; status: string }
}

interface LowStockPart {
    id: number; name: string; stockQty: number; lowStockLevel: number
}

export default function DashboardPage() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const [data, setData] = useState<{ kpis: KPIs; recentJobs: JobCard[]; lowStockParts: LowStockPart[] } | null>(null)
    const [fetching, setFetching] = useState(true)

    useEffect(() => {
        if (!loading && (!user || (user.role !== 'ADMIN' && user.role !== 'SECRETARY'))) router.replace('/login')
    }, [user, loading, router])

    useEffect(() => {
        if (user) {
            fetch('/api/dashboard').then(r => r.json()).then(setData).finally(() => setFetching(false))
        }
    }, [user])

    if (loading || fetching) return (
        <div className="app-layout">
            <AppSidebar />
            <main className="main-content"><div className="loading"><div className="spinner" /></div></main>
        </div>
    )

    const kpis = data?.kpis
    const recentJobs = data?.recentJobs || []
    const lowStock = data?.lowStockParts || []

    return (
        <div className="app-layout">
            <AppSidebar />
            <main className="main-content">
                <div className="page-content">
                    <div className="page-header" style={{
                        marginBottom: 32,
                        height: 200,
                        backgroundImage: 'url(/dashboard1.png)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        borderRadius: 24,
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        alignItems: 'flex-start',
                        padding: '24px',
                        position: 'relative',
                        overflow: 'hidden',
                        boxShadow: '0 10px 40px -10px rgba(0,0,0,0.6)'
                    }}>
                        <div style={{ position: 'relative', zIndex: 2 }}>
                            <Link href="/jobs/new" className="btn btn-primary" style={{
                                padding: '14px 28px', borderRadius: 14, fontWeight: 800,
                                background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                                border: 'none', boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
                                letterSpacing: '0.05em'
                            }}>
                                <Plus size={20} style={{ marginRight: 10 }} /> NEW WORK ORDER
                            </Link>
                        </div>
                    </div>

                    {/* KPI Cards: Consolidated to one line and interactive */}
                    <div className="stats-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: 20,
                        marginBottom: 32
                    }}>
                        <div
                            className="card stat-card"
                            style={{ padding: '20px', cursor: 'pointer', transition: 'transform 0.2s', border: '1px solid rgba(255,255,255,0.05)' }}
                            onClick={() => router.push('/jobs?filter=today')}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary-light)' }}><Briefcase size={20} /></div>
                            <div className="stat-label" style={{ fontSize: 13, fontWeight: 500, opacity: 0.7 }}>Jobs Today</div>
                            <div className="stat-value" style={{ fontSize: '1.75rem', fontWeight: 900 }}>{kpis?.jobsToday ?? 0}</div>
                            <div className="stat-meta" style={{ fontSize: 11, opacity: 0.5 }}>New registrations today</div>
                        </div>
                        <div
                            className="card stat-card"
                            style={{ padding: '20px', cursor: 'pointer', transition: 'transform 0.2s', border: '1px solid rgba(255,255,255,0.05)' }}
                            onClick={() => router.push('/jobs?status=IN_PROGRESS')}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--secondary)' }}><Clock size={20} /></div>
                            <div className="stat-label" style={{ fontSize: 13, fontWeight: 500, opacity: 0.7 }}>Open Jobs</div>
                            <div className="stat-value" style={{ fontSize: '1.75rem', fontWeight: 900 }}>{kpis?.openJobs ?? 0}</div>
                            <div className="stat-meta" style={{ fontSize: 11, opacity: 0.5 }}>Active in workshop</div>
                        </div>
                        <div
                            className="card stat-card"
                            style={{ padding: '20px', cursor: 'pointer', transition: 'transform 0.2s', border: '1px solid rgba(255,255,255,0.05)' }}
                            onClick={() => router.push('/jobs?status=COMPLETED')}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--status-completed)' }}><CheckCircle size={20} /></div>
                            <div className="stat-label" style={{ fontSize: 13, fontWeight: 500, opacity: 0.7 }}>Completed Weekly</div>
                            <div className="stat-value" style={{ fontSize: '1.75rem', fontWeight: 900 }}>{kpis?.completedThisWeek ?? 0}</div>
                            <div className="stat-meta" style={{ fontSize: 11, opacity: 0.5 }}>Ready for pickup</div>
                        </div>
                        <div
                            className="card stat-card"
                            style={{
                                padding: '20px',
                                border: '1px solid rgba(251, 191, 36, 0.2)',
                                cursor: 'pointer',
                                transition: 'transform 0.2s'
                            }}
                            onClick={() => router.push('/reports')}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <div className="stat-icon" style={{ background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24' }}><TrendingUp size={20} /></div>
                                <div className="stat-label" style={{ fontSize: 13, fontWeight: 500, opacity: 0.7 }}>Revenue Monthly</div>
                                <div className="stat-value" style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fbbf24' }}>{formatCurrency(kpis?.revenueThisMonth ?? 0)}</div>
                                <div className="stat-meta" style={{ fontSize: 11, opacity: 0.5 }}>Total payments received</div>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: 24 }}>
                        {/* Recent Jobs */}
                        <div className="card">
                            <div className="card-header">
                                <h2>Recent Job Cards</h2>
                                <Link href="/jobs" className="text-muted" style={{ fontSize: 13 }}>View All Catalog</Link>
                            </div>
                            {recentJobs.length === 0 ? (
                                <div className="card-body" style={{ textAlign: 'center', padding: '60px 0', opacity: 0.5 }}>No active job cards found</div>
                            ) : (
                                <div className="table-wrapper">
                                    <table style={{ borderSpacing: 0, width: '100%' }}>
                                        <thead><tr>
                                            <th style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>Code</th>
                                            <th style={{ padding: '12px 16px' }}>Customer</th>
                                            <th style={{ padding: '12px 16px' }}>Vehicle</th>
                                            <th style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>Status</th>
                                            <th style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>Date</th>
                                        </tr></thead>
                                        <tbody>
                                            {recentJobs.map(job => (
                                                <tr key={job.id} style={{ cursor: 'pointer' }} onClick={() => router.push(`/jobs/${job.id}`)}>
                                                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}><span className="bold">{job.jobCode}</span></td>
                                                    <td style={{ padding: '12px 16px' }}>{job.customer.name}</td>
                                                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                                                        <div className="bold" style={{ fontSize: 13 }}>{job.vehicle.plateNumber}</div>
                                                        <div style={{ fontSize: 11, opacity: 0.6 }}>{job.vehicle.make} {job.vehicle.model}</div>
                                                    </td>
                                                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}><StatusBadge status={job.status} /></td>
                                                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap', fontSize: 12 }}>{formatDate(job.createdAt)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Side Panel */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            <div className="card">
                                <div className="card-header"><h2>Workshop Quick Entry</h2></div>
                                <div className="card-body" style={{ display: 'grid', gap: 10 }}>
                                    <Link href="/jobs" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}><Plus size={14} />Create Job Card</Link>
                                    <Link href="/customers" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}><Users size={14} />Add Client</Link>
                                    <Link href="/inventory" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}><Package size={14} />Update Stock</Link>
                                </div>
                            </div>

                            {lowStock.length > 0 && (
                                <div className="card" style={{ borderLeft: '4px solid var(--priority-high)' }}>
                                    <div className="card-header"><h2 style={{ color: 'var(--priority-high)', display: 'flex', alignItems: 'center', gap: 8 }}><AlertTriangle size={16} /> Critical Stock</h2></div>
                                    <div className="card-body" style={{ padding: '0 20px 20px' }}>
                                        {lowStock.slice(0, 5).map(p => (
                                            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-light)' }}>
                                                <span style={{ fontSize: 13 }}>{p.name}</span>
                                                <span className="bold" style={{ color: 'var(--priority-high)' }}>{p.stockQty}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
