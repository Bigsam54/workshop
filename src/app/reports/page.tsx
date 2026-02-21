'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { AppSidebar } from '@/components/AppSidebar'
import { formatCurrency, formatDate } from '@/components/ui'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { DollarSign, Briefcase, Package, Users, TrendingUp } from 'lucide-react'

interface ReportData {
    revenueByMonth: Array<{ amount: number; paidAt: string; method: string }>
    jobsByStatus: Array<{ status: string; _count: { id: number } }>
    topParts: Array<{ partId: number; _sum: { qty: number }; part?: { name: string } }>
    techPerformance: Array<{ assignedTo: number; _count: { id: number }; technician?: { name: string } }>
}

const STATUS_COLORS: Record<string, string> = {
    NEW: '#6366f1', DIAGNOSING: '#8b5cf6', IN_PROGRESS: '#f59e0b',
    WAITING_PARTS: '#ef4444', COMPLETED: '#10b981', PAID: '#0891b2',
}

export default function ReportsPage() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const [data, setData] = useState<ReportData | null>(null)
    const [fetching, setFetching] = useState(true)

    useEffect(() => {
        if (!loading && (!user || user.role !== 'ADMIN')) router.replace('/login')
    }, [user, loading, router])
    useEffect(() => { if (user && user.role === 'ADMIN') fetch('/api/reports').then(r => r.json()).then(setData).finally(() => setFetching(false)) }, [user])

    if (fetching) return <div className="app-layout"><AppSidebar /><main className="main-content"><div className="loading"><div className="spinner" /></div></main></div>

    // Process revenue data: group by day
    const revenueData = (data?.revenueByMonth || []).reduce((acc: Array<{ date: string; revenue: number }>, p) => {
        const date = formatDate(p.paidAt)
        const existing = acc.find(d => d.date === date)
        if (existing) existing.revenue += p.amount
        else acc.push({ date, revenue: p.amount })
        return acc
    }, [])

    const totalRevenue = (data?.revenueByMonth || []).reduce((s, p) => s + p.amount, 0)
    const totalJobs = (data?.jobsByStatus || []).reduce((s, j) => s + j._count.id, 0)
    const paidJobs = (data?.jobsByStatus || []).find(j => j.status === 'PAID')?._count.id || 0

    const pieData = (data?.jobsByStatus || []).map(j => ({
        name: j.status.replace('_', ' '),
        value: j._count.id,
        color: STATUS_COLORS[j.status] || '#6366f1',
    }))

    return (
        <div className="app-layout">
            <AppSidebar />
            <main className="main-content">
                <div className="page-content">
                    <div className="page-header" style={{ marginBottom: 28 }}>
                        <h1>Business Intelligence</h1>
                        <p style={{ opacity: 0.7 }}>Workshop financial and operational performance metrics</p>
                    </div>

                    {/* Performance Tiles */}
                    <div className="stats-grid" style={{ marginBottom: 32 }}>
                        <div className="stat-card" style={{ '--accent': 'var(--primary)' } as React.CSSProperties}>
                            <div className="stat-card-icon"><DollarSign size={20} /></div>
                            <div className="stat-card-label">Revenue Target</div>
                            <div className="stat-card-value">{formatCurrency(totalRevenue)}</div>
                            <div className="stat-card-sub">Accumulated across {paidJobs} payments</div>
                        </div>
                        <div className="stat-card" style={{ '--accent': 'var(--status-completed)' } as React.CSSProperties}>
                            <div className="stat-card-icon"><Briefcase size={20} /></div>
                            <div className="stat-card-label">Workload Volume</div>
                            <div className="stat-card-value">{totalJobs} Service Cards</div>
                            <div className="stat-card-sub">Total created this period</div>
                        </div>
                        <div className="stat-card" style={{ '--accent': '#f59e0b' } as React.CSSProperties}>
                            <div className="stat-card-icon"><Package size={20} /></div>
                            <div className="stat-card-label">Primary Inventory Part</div>
                            <div className="stat-card-value" style={{ fontSize: '1.1rem', height: 40, marginTop: 8 }}>{data?.topParts?.[0]?.part?.name || '—'}</div>
                            <div className="stat-card-sub">Used {data?.topParts?.[0]?._sum?.qty || 0} times</div>
                        </div>
                        <div className="stat-card" style={{ '--accent': '#8b5cf6' } as React.CSSProperties}>
                            <div className="stat-card-icon"><Users size={20} /></div>
                            <div className="stat-card-label">Top Performer</div>
                            <div className="stat-card-value" style={{ fontSize: '1.1rem', height: 40, marginTop: 8 }}>{data?.techPerformance?.[0]?.technician?.name || '—'}</div>
                            <div className="stat-card-sub">Managed {data?.techPerformance?.[0]?._count?.id || 0} job cards</div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24, marginBottom: 24 }}>
                        <div className="card">
                            <div className="card-header"><h2>Revenue Inflow Trend</h2></div>
                            <div className="card-body">
                                {revenueData.length === 0 ? (
                                    <div className="empty-state">No payment records found</div>
                                ) : (
                                    <ResponsiveContainer width="100%" height={280}>
                                        <BarChart data={revenueData}>
                                            <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `₵${v}`} />
                                            <Tooltip
                                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                                                itemStyle={{ color: 'var(--primary-light)' }}
                                                formatter={(v: any) => [formatCurrency(Number(v) || 0), 'Revenue']}
                                            />
                                            <Bar dataKey="revenue" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={28} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header"><h2>Job Distribution</h2></div>
                            <div className="card-body">
                                {pieData.length === 0 ? (
                                    <div className="empty-state">No active job cards</div>
                                ) : (
                                    <ResponsiveContainer width="100%" height={280}>
                                        <PieChart>
                                            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5}>
                                                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                            </Pie>
                                            <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                                            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                        <div className="card">
                            <div className="card-header"><h2>Top Inventory Consumption</h2></div>
                            <div className="table-wrapper">
                                <table>
                                    <thead><tr><th>Item</th><th style={{ textAlign: 'right' }}>Usage</th></tr></thead>
                                    <tbody>
                                        {(data?.topParts || []).slice(0, 6).map((p, i) => (
                                            <tr key={p.partId}>
                                                <td><div className="bold">{p.part?.name || `Part #${p.partId}`}</div></td>
                                                <td style={{ textAlign: 'right' }}><span className="bold" style={{ color: 'var(--primary-light)' }}>{p._sum.qty}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header"><h2>Staff Efficiency</h2></div>
                            <div className="table-wrapper">
                                <table>
                                    <thead><tr><th>Member</th><th style={{ textAlign: 'right' }}>Orders Managed</th></tr></thead>
                                    <tbody>
                                        {(data?.techPerformance || []).map((t, i) => (
                                            <tr key={t.assignedTo}>
                                                <td><div className="bold">{t.technician?.name || `Staff #${t.assignedTo}`}</div></td>
                                                <td style={{ textAlign: 'right' }}><span className="bold" style={{ color: 'var(--primary-light)' }}>{t._count.id}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
