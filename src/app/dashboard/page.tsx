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
                    <div className="page-header" style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h1 style={{ margin: 0 }}>Dashboard</h1>
                            <p style={{ margin: '4px 0 0', opacity: 0.7 }}>Full workshop performance overview</p>
                        </div>
                        <Link href="/jobs" className="btn btn-primary"><Plus size={16} /> New Job Card</Link>
                    </div>

                    {/* KPI Cards */}
                    <div className="stats-grid">
                        <div className="stat-card" style={{ '--accent': 'var(--primary)' } as React.CSSProperties}>
                            <div className="stat-card-icon"><Briefcase size={20} /></div>
                            <div className="stat-card-label">Jobs Today</div>
                            <div className="stat-card-value">{kpis?.jobsToday ?? 0}</div>
                            <div className="stat-card-sub">New registrations today</div>
                        </div>
                        <div className="stat-card" style={{ '--accent': 'var(--status-progress)' } as React.CSSProperties}>
                            <div className="stat-card-icon"><Clock size={20} /></div>
                            <div className="stat-card-label">Open Jobs</div>
                            <div className="stat-card-value">{kpis?.openJobs ?? 0}</div>
                            <div className="stat-card-sub">Active in workshop</div>
                        </div>
                        <div className="stat-card" style={{ '--accent': 'var(--status-completed)' } as React.CSSProperties}>
                            <div className="stat-card-icon"><CheckCircle size={20} /></div>
                            <div className="stat-card-label">Completed Weekly</div>
                            <div className="stat-card-value">{kpis?.completedThisWeek ?? 0}</div>
                            <div className="stat-card-sub">Ready for pickup</div>
                        </div>
                        <div className="stat-card" style={{ '--accent': 'var(--status-paid)' } as React.CSSProperties}>
                            <div className="stat-card-icon"><TrendingUp size={20} /></div>
                            <div className="stat-card-label">Revenue Monthly</div>
                            <div className="stat-card-value">{formatCurrency(kpis?.revenueThisMonth ?? 0)}</div>
                            <div className="stat-card-sub">Total payments received</div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
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
                                    <table>
                                        <thead><tr>
                                            <th>Code</th><th>Customer</th><th>Vehicle</th><th>Status</th><th>Date</th>
                                        </tr></thead>
                                        <tbody>
                                            {recentJobs.map(job => (
                                                <tr key={job.id} style={{ cursor: 'pointer' }} onClick={() => router.push(`/jobs/${job.id}`)}>
                                                    <td><span className="bold">{job.jobCode}</span></td>
                                                    <td>{job.customer.name}</td>
                                                    <td>{job.vehicle.plateNumber} <div style={{ fontSize: 11, opacity: 0.6 }}>{job.vehicle.make} {job.vehicle.model}</div></td>
                                                    <td><StatusBadge status={job.status} /></td>
                                                    <td style={{ fontSize: 12 }}>{formatDate(job.createdAt)}</td>
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
