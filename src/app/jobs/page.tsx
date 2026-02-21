'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { AppSidebar } from '@/components/AppSidebar'
import { StatusBadge, PriorityBadge, formatDate } from '@/components/ui'
import { Plus, Search, Filter } from 'lucide-react'

const STATUS_FILTERS = ['ALL', 'NEW', 'DIAGNOSING', 'IN_PROGRESS', 'WAITING_PARTS', 'COMPLETED', 'PAID']

interface Job {
    id: number; jobCode: string; status: string; priority: string
    complaint: string
    customer: { name: string }
    vehicle: { plateNumber: string; make: string; model: string }
    technician?: { name: string }
    createdAt: string
}

export default function JobsPage() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const [jobs, setJobs] = useState<Job[]>([])
    const [fetching, setFetching] = useState(true)
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [search, setSearch] = useState('')

    const fetchJobs = useCallback(() => {
        const params = statusFilter !== 'ALL' ? `?status=${statusFilter}` : ''
        fetch(`/api/jobs${params}`).then(r => r.json()).then(setJobs).finally(() => setFetching(false))
    }, [statusFilter])

    useEffect(() => { if (!loading && !user) router.replace('/login') }, [user, loading, router])
    useEffect(() => { if (user) { setFetching(true); fetchJobs() } }, [user, fetchJobs])

    const filtered = jobs.filter(j =>
        search ? (
            j.jobCode.toLowerCase().includes(search.toLowerCase()) ||
            j.customer.name.toLowerCase().includes(search.toLowerCase()) ||
            j.vehicle.plateNumber.toLowerCase().includes(search.toLowerCase())
        ) : true
    )

    return (
        <div className="app-layout">
            <AppSidebar />
            <main className="main-content">
                <div className="page-content">
                    <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                        <div>
                            <h1>Job Cards Catalog</h1>
                            <p style={{ opacity: 0.7 }}>Managing {jobs.length} active and historic workshop service records</p>
                        </div>
                        <Link href="/jobs/new" className="btn btn-primary"><Plus size={16} /> New Job Card</Link>
                    </div>

                    {/* Filter & Search Bar */}
                    <div style={{ display: 'flex', gap: 16, marginBottom: 24, alignItems: 'center', background: 'var(--bg-card)', padding: '16px 20px', borderRadius: 10, border: '1px solid var(--border)' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                            <input
                                className="form-input"
                                style={{ paddingLeft: 44, background: 'var(--bg-app)', border: 'none' }}
                                placeholder="Search by job ID, plate number, or customer name..."
                                value={search} onChange={e => setSearch(search = e.target.value)}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <Filter size={16} style={{ opacity: 0.5, marginRight: 4 }} />
                            {STATUS_FILTERS.slice(0, 4).map(s => (
                                <button
                                    key={s}
                                    onClick={() => setStatusFilter(s)}
                                    className={`btn btn-xs ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`}
                                >
                                    {s === 'ALL' ? 'Everything' : s.replace('_', ' ')}
                                </button>
                            ))}
                            <select
                                className="form-select"
                                style={{ width: 140, height: 32, fontSize: 12, padding: '0 10px' }}
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value)}
                            >
                                <option value="ALL">All Statuses</option>
                                {STATUS_FILTERS.slice(4).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="card">
                        {fetching ? (
                            <div className="loading"><div className="spinner" /></div>
                        ) : filtered.length === 0 ? (
                            <div className="card-body" style={{ textAlign: 'center', padding: '100px 0' }}>
                                <div style={{ fontSize: '3rem', marginBottom: 16, opacity: 0.2 }}>📋</div>
                                <h2 style={{ marginBottom: 4 }}>No job cards found</h2>
                                <p style={{ opacity: 0.5 }}>Try adjusting your search or filters</p>
                            </div>
                        ) : (
                            <div className="table-wrapper">
                                <table>
                                    <thead><tr>
                                        <th>Service Code</th><th>Client</th><th>Vehicle Identity</th><th>Problem Summary</th><th>Current Status</th><th></th>
                                    </tr></thead>
                                    <tbody>
                                        {filtered.map(job => (
                                            <tr key={job.id} style={{ cursor: 'pointer' }} onClick={() => router.push(`/jobs/${job.id}`)}>
                                                <td><span className="bold" style={{ color: 'var(--primary-light)' }}>{job.jobCode}</span><div style={{ fontSize: 10, opacity: 0.5 }}>{formatDate(job.createdAt)}</div></td>
                                                <td><span className="bold">{job.customer.name}</span></td>
                                                <td>
                                                    <span className="bold">{job.vehicle.plateNumber}</span>
                                                    <div style={{ fontSize: 11, opacity: 0.6 }}>{job.vehicle.make} {job.vehicle.model}</div>
                                                </td>
                                                <td><div style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 }}>{job.complaint}</div></td>
                                                <td><StatusBadge status={job.status} /></td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <button className="btn btn-secondary btn-xs">Manage</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
