'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { AppSidebar } from '@/components/AppSidebar'
import { useToast } from '@/components/Toast'
import { VehicleHealthModal, MAINTENANCE_STATUS_META, MaintenanceItem } from '@/components/VehicleHealthModal'
import { AlertTriangle, Clock, Phone, Wrench, CheckCircle2 } from 'lucide-react'

interface AlertVehicle {
    id: number; plateNumber: string; make: string; model: string; year: number
    mileage: string | null; lastServiceDate: string | null; lastServiceMileage: number | null
    customer: { id: number; name: string; phone: string }
    worstStatus: 'overdue' | 'due_soon'
    dueItems: MaintenanceItem[]
}

export default function MaintenancePage() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const { toast } = useToast()
    const [vehicles, setVehicles] = useState<AlertVehicle[]>([])
    const [overdueCount, setOverdueCount] = useState(0)
    const [dueSoonCount, setDueSoonCount] = useState(0)
    const [fetching, setFetching] = useState(true)
    const [filter, setFilter] = useState<'all' | 'overdue' | 'due_soon'>('all')
    const [healthVehicleId, setHealthVehicleId] = useState<number | null>(null)
    const [markingId, setMarkingId] = useState<number | null>(null)

    const fetchAlerts = useCallback(() => {
        fetch('/api/maintenance-alerts').then(r => r.json()).then(data => {
            setVehicles(data.vehicles || [])
            setOverdueCount(data.overdueCount || 0)
            setDueSoonCount(data.dueSoonCount || 0)
        }).finally(() => setFetching(false))
    }, [])

    useEffect(() => {
        if (!loading && (!user || (user.role !== 'ADMIN' && user.role !== 'SECRETARY'))) router.replace('/login')
    }, [user, loading, router])
    useEffect(() => { if (user) fetchAlerts() }, [user, fetchAlerts])

    const markServiced = async (v: AlertVehicle) => {
        if (!confirm(`Mark ${v.plateNumber} as serviced today? This clears all its maintenance items and resets the schedule from today's date/mileage.`)) return
        setMarkingId(v.id)
        const mileageNum = v.mileage ? parseInt(v.mileage, 10) : null
        const res = await fetch(`/api/vehicles/${v.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                lastServiceDate: new Date().toISOString().slice(0, 10),
                lastServiceMileage: mileageNum != null && !isNaN(mileageNum) ? mileageNum : null,
            })
        })
        if (res.ok) {
            toast(`${v.plateNumber} marked as serviced`, 'success')
            fetchAlerts()
        } else {
            toast('Failed to update service record', 'error')
        }
        setMarkingId(null)
    }

    const filteredVehicles = vehicles.filter(v => filter === 'all' || v.worstStatus === filter)

    return (
        <div className="app-layout">
            <AppSidebar />
            <main className="main-content">
                <div className="page-content">
                    <div className="page-header" style={{ marginBottom: 24 }}>
                        <h1>Predictive Maintenance</h1>
                        <p style={{ opacity: 0.7 }}>Vehicles with maintenance items due soon or overdue, based on last service date and mileage</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 24 }}>
                        <button
                            className="card stat-card"
                            onClick={() => setFilter('all')}
                            style={{ padding: 20, cursor: 'pointer', textAlign: 'left', border: filter === 'all' ? '1px solid var(--primary-glow)' : '1px solid rgba(255,255,255,0.05)' }}
                        >
                            <div className="stat-label" style={{ fontSize: 13, opacity: 0.7 }}>Total Vehicles Flagged</div>
                            <div className="stat-value" style={{ fontSize: '1.75rem', fontWeight: 900 }}>{vehicles.length}</div>
                        </button>
                        <button
                            className="card stat-card"
                            onClick={() => setFilter('overdue')}
                            style={{ padding: 20, cursor: 'pointer', textAlign: 'left', border: filter === 'overdue' ? '1px solid var(--priority-high)' : '1px solid rgba(220,38,38,0.2)' }}
                        >
                            <div className="stat-icon" style={{ background: 'rgba(220, 38, 38, 0.1)', color: 'var(--priority-high)' }}><AlertTriangle size={20} /></div>
                            <div className="stat-label" style={{ fontSize: 13, opacity: 0.7 }}>Overdue</div>
                            <div className="stat-value" style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--priority-high)' }}>{overdueCount}</div>
                        </button>
                        <button
                            className="card stat-card"
                            onClick={() => setFilter('due_soon')}
                            style={{ padding: 20, cursor: 'pointer', textAlign: 'left', border: filter === 'due_soon' ? '1px solid #f59e0b' : '1px solid rgba(245,158,11,0.2)' }}
                        >
                            <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}><Clock size={20} /></div>
                            <div className="stat-label" style={{ fontSize: 13, opacity: 0.7 }}>Due Soon</div>
                            <div className="stat-value" style={{ fontSize: '1.75rem', fontWeight: 900, color: '#f59e0b' }}>{dueSoonCount}</div>
                        </button>
                    </div>

                    {fetching ? <div className="loading"><div className="spinner" /></div> : (
                        filteredVehicles.length === 0 ? (
                            <div className="card" style={{ padding: '80px 0', textAlign: 'center' }}>
                                <div style={{ fontSize: '3rem', marginBottom: 16, opacity: 0.2 }}>✅</div>
                                <h2>Nothing needs attention</h2>
                                <p style={{ opacity: 0.5 }}>No vehicles matching this filter currently need maintenance</p>
                            </div>
                        ) : (
                            <div className="card">
                                <div className="table-wrapper">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Vehicle</th>
                                                <th>Owner</th>
                                                <th style={{ minWidth: 280 }}>Items Due</th>
                                                <th style={{ textAlign: 'right' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredVehicles.map(v => (
                                                <tr key={v.id}>
                                                    <td>
                                                        <div className="bold" style={{ fontSize: 14 }}>{v.plateNumber}</div>
                                                        <div style={{ fontSize: 11, opacity: 0.6 }}>{v.make} {v.model} ({v.year})</div>
                                                    </td>
                                                    <td>
                                                        <div className="bold" style={{ fontSize: 13 }}>{v.customer.name}</div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, opacity: 0.6 }}>
                                                            <Phone size={10} /> {v.customer.phone}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                                            {v.dueItems.map(item => {
                                                                const meta = MAINTENANCE_STATUS_META[item.status]
                                                                return (
                                                                    <span key={item.key} className="badge" style={{ color: meta.color, border: `1px solid ${meta.color}`, background: 'transparent', fontSize: 10, padding: '3px 8px' }}>
                                                                        {item.label} ({item.percentUsed}%)
                                                                    </span>
                                                                )
                                                            })}
                                                        </div>
                                                    </td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                                            <button className="btn btn-secondary btn-xs" onClick={() => setHealthVehicleId(v.id)}>
                                                                <Wrench size={12} style={{ marginRight: 4 }} /> Details
                                                            </button>
                                                            <button className="btn btn-primary btn-xs" onClick={() => markServiced(v)} disabled={markingId === v.id}>
                                                                <CheckCircle2 size={12} style={{ marginRight: 4 }} /> {markingId === v.id ? 'Saving...' : 'Mark as Serviced'}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )
                    )}
                </div>
            </main>

            {healthVehicleId && (
                <VehicleHealthModal vehicleId={healthVehicleId} onClose={() => setHealthVehicleId(null)} onUpdated={fetchAlerts} />
            )}
        </div>
    )
}
