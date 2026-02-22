'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { AppSidebar } from '@/components/AppSidebar'
import { formatCurrency, formatDate } from '@/components/ui'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { DollarSign, Briefcase, Package, Users, TrendingUp } from 'lucide-react'

interface ReportData {
    revenueByMonth: Array<{
        amount: number;
        paidAt: string;
        method: string;
        job?: { jobCode: string; customer: { name: string } }
    }>
    jobsByStatus: Array<{ status: string; _count: { id: number } }>
    topParts: Array<{ partId: number; _sum: { qty: number }; part?: { name: string } }>
    techPerformance: Array<{ assignedTo: number; _count: { id: number }; technician?: { name: string } }>
}

const STATUS_COLORS: Record<string, string> = {
    NEW: '#6366f1', DIAGNOSING: '#8b5cf6', IN_PROGRESS: '#f59e0b',
    WAITING_PARTS: '#ef4444', COMPLETED: '#10b981', PAID: '#0891b2',
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const YEARS = [2024, 2025, 2026]

export default function ReportsPage() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const [data, setData] = useState<ReportData | null>(null)
    const [fetching, setFetching] = useState(true)

    const now = new Date()
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
    const [selectedYear, setSelectedYear] = useState(now.getFullYear())
    const [selectedDay, setSelectedDay] = useState<string | number>('ALL')

    useEffect(() => {
        if (!loading && (!user || user.role !== 'ADMIN')) router.replace('/login')
    }, [user, loading, router])

    const fetchReports = useCallback(() => {
        setFetching(true)
        fetch(`/api/reports?month=${selectedMonth}&year=${selectedYear}&day=${selectedDay}`)
            .then(r => r.json())
            .then(setData)
            .finally(() => setFetching(false))
    }, [selectedMonth, selectedYear, selectedDay])

    useEffect(() => { if (user && user.role === 'ADMIN') fetchReports() }, [user, fetchReports])

    if (fetching && !data) return <div className="app-layout"><AppSidebar /><main className="main-content"><div className="loading"><div className="spinner" /></div></main></div>

    // Process revenue data: group by day
    const revenueData = (data?.revenueByMonth || []).reduce((acc: Array<{ date: string; revenue: number }>, p) => {
        const dObj = new Date(p.paidAt)
        const date = selectedDay === 'ALL'
            ? dObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
            : dObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

        const existing = acc.find(d => d.date === date)
        if (existing) existing.revenue += p.amount
        else acc.push({ date, revenue: p.amount })
        return acc
    }, []).reverse()

    const totalRevenue = (data?.revenueByMonth || []).reduce((s, p) => s + p.amount, 0)
    const totalJobs = (data?.jobsByStatus || []).reduce((s, j) => s + j._count.id, 0)
    const paidJobsCount = (data?.revenueByMonth || []).length

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
                    <div className="page-header" style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h1>Business Intelligence</h1>
                            <p style={{ opacity: 0.7 }}>Workshop financial and operational performance metrics</p>
                        </div>

                        <div style={{ display: 'flex', gap: 12 }}>
                            <select
                                className="form-select"
                                style={{ width: 120 }}
                                value={selectedDay}
                                onChange={e => setSelectedDay(e.target.value)}
                            >
                                <option value="ALL">All Days</option>
                                {[...Array(31)].map((_, i) => (
                                    <option key={i + 1} value={i + 1}>Day {i + 1}</option>
                                ))}
                            </select>
                            <select
                                className="form-select"
                                style={{ width: 140 }}
                                value={selectedMonth}
                                onChange={e => setSelectedMonth(Number(e.target.value))}
                            >
                                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                            </select>
                            <select
                                className="form-select"
                                style={{ width: 100 }}
                                value={selectedYear}
                                onChange={e => setSelectedYear(Number(e.target.value))}
                            >
                                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Performance Tiles: Consolidated to one line */}
                    <div className="stats-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: 20,
                        marginBottom: 32
                    }}>
                        <div className="stat-card" style={{ '--accent': 'var(--primary)' } as React.CSSProperties}>
                            <div className="stat-card-icon"><DollarSign size={20} /></div>
                            <div className="stat-card-label">Revenue Target</div>
                            <div className="stat-card-value">{formatCurrency(totalRevenue)}</div>
                            <div className="stat-card-sub">Accumulated across {paidJobsCount} payments</div>
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
                                {fetching ? (
                                    <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>Refreshing trend...</div>
                                ) : revenueData.length === 0 ? (
                                    <div className="empty-state">No payment records found for this period</div>
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
                                <ResponsiveContainer width="100%" height={280}>
                                    <PieChart>
                                        <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5}>
                                            {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                        </Pie>
                                        <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Financial Ledger Section */}
                    <div className="card" style={{ marginBottom: 24 }}>
                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2>Financial Ledger</h2>
                            <div style={{ fontSize: 12, opacity: 0.5 }}>{fetching ? 'Syncing...' : `${data?.revenueByMonth.length} transactions`}</div>
                        </div>
                        <div className="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Client & Job</th>
                                        <th>Method</th>
                                        <th style={{ textAlign: 'right' }}>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data?.revenueByMonth.map((p, i) => (
                                        <tr key={i}>
                                            <td>
                                                <div className="bold">{new Date(p.paidAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</div>
                                                <div style={{ fontSize: 10, opacity: 0.5 }}>{new Date(p.paidAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                            </td>
                                            <td>
                                                <div className="bold">{p.job?.customer.name}</div>
                                                <div style={{ fontSize: 11, color: 'var(--primary-light)' }}>{p.job?.jobCode}</div>
                                            </td>
                                            <td><span className="badge badge-secondary" style={{ fontSize: 10 }}>{p.method}</span></td>
                                            <td style={{ textAlign: 'right' }}><span className="bold">{formatCurrency(p.amount)}</span></td>
                                        </tr>
                                    ))}
                                    {data?.revenueByMonth.length === 0 && (
                                        <tr>
                                            <td colSpan={4} style={{ textAlign: 'center', padding: '40px 0', opacity: 0.5 }}>No revenue records found for this period</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
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
