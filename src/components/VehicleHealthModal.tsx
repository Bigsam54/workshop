'use client'
import { useEffect, useState } from 'react'
import { X, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import { useToast } from '@/components/Toast'

export interface MaintenanceItem {
    key: string; label: string; kmInterval: number | null; monthInterval: number | null
    status: 'overdue' | 'due_soon' | 'ok' | 'unknown'
    percentUsed: number | null; kmSinceService: number | null; monthsSinceService: number | null
    nextDueMileage: number | null; nextDueDate: string | null
}

export interface VehicleDetail {
    id: number; plateNumber: string; make: string; model: string; year: number
    mileage: string | null; lastServiceDate: string | null; lastServiceMileage: number | null
    maintenance: MaintenanceItem[]
}

export const MAINTENANCE_STATUS_META: Record<MaintenanceItem['status'], { label: string; color: string; icon: typeof CheckCircle2 }> = {
    overdue: { label: 'Overdue', color: 'var(--priority-high, #ef4444)', icon: AlertTriangle },
    due_soon: { label: 'Due Soon', color: '#f59e0b', icon: Clock },
    ok: { label: 'OK', color: 'var(--status-completed, #10b981)', icon: CheckCircle2 },
    unknown: { label: 'No Data', color: 'var(--text-muted, #6b7280)', icon: Clock },
}

interface VehicleHealthModalProps {
    vehicleId: number
    onClose: () => void
    onUpdated?: () => void
}

export function VehicleHealthModal({ vehicleId, onClose, onUpdated }: VehicleHealthModalProps) {
    const { toast } = useToast()
    const [vehicleDetail, setVehicleDetail] = useState<VehicleDetail | null>(null)
    const [fetching, setFetching] = useState(false)
    const [editLastServiceDate, setEditLastServiceDate] = useState('')
    const [editLastServiceMileage, setEditLastServiceMileage] = useState('')
    const [saving, setSaving] = useState(false)

    const load = () => {
        setFetching(true)
        fetch(`/api/vehicles/${vehicleId}`).then(r => r.json()).then((data: VehicleDetail) => {
            setVehicleDetail(data)
            setEditLastServiceDate(data.lastServiceDate ? data.lastServiceDate.slice(0, 10) : '')
            setEditLastServiceMileage(data.lastServiceMileage != null ? String(data.lastServiceMileage) : '')
        }).finally(() => setFetching(false))
    }

    useEffect(() => { load() }, [vehicleId])

    const save = async () => {
        setSaving(true)
        const res = await fetch(`/api/vehicles/${vehicleId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                lastServiceDate: editLastServiceDate || null,
                lastServiceMileage: editLastServiceMileage || null,
            })
        })
        if (res.ok) {
            toast('Service record updated', 'success')
            load()
            onUpdated?.()
        } else {
            toast('Failed to update service record', 'error')
        }
        setSaving(false)
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
                <div className="modal-header">
                    <div>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Vehicle Health</h2>
                        <p style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>
                            {vehicleDetail ? `${vehicleDetail.plateNumber} — ${vehicleDetail.make} ${vehicleDetail.model} (${vehicleDetail.year})` : 'Loading...'}
                        </p>
                    </div>
                    <button className="btn btn-secondary btn-icon btn-sm" onClick={onClose}><X size={16} /></button>
                </div>

                {fetching || !vehicleDetail ? (
                    <div className="loading" style={{ padding: 40 }}><div className="spinner" /></div>
                ) : (
                    <>
                        <div className="modal-body">
                            <section style={{ marginBottom: 24, padding: 16, background: 'rgba(99, 102, 241, 0.03)', borderRadius: 12, border: '1px dashed var(--primary-glow)' }}>
                                <h3 style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--primary-light)', marginBottom: 12, fontWeight: 700 }}>Service Anchor</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div className="form-group">
                                        <label className="form-label">Last Service Date</label>
                                        <input className="form-input" type="date" value={editLastServiceDate} onChange={e => setEditLastServiceDate(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Mileage at Last Service (km)</label>
                                        <input className="form-input" type="number" value={editLastServiceMileage} onChange={e => setEditLastServiceMileage(e.target.value)} placeholder="e.g. 45000" />
                                    </div>
                                </div>
                                <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 12 }}>
                                    Current odometer on file: <span className="bold">{vehicleDetail.mileage || 'Not recorded'}</span> (updated automatically at job intake)
                                </div>
                                <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>
                                    {saving ? 'Saving...' : 'Save Service Record'}
                                </button>
                            </section>

                            <h3 style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--primary-light)', marginBottom: 12, fontWeight: 700 }}>Predicted Maintenance ({vehicleDetail.maintenance.length} items)</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {vehicleDetail.maintenance.map(item => {
                                    const meta = MAINTENANCE_STATUS_META[item.status]
                                    const Icon = meta.icon
                                    return (
                                        <div key={item.key} style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)',
                                            background: 'var(--bg-app)'
                                        }}>
                                            <div>
                                                <div className="bold" style={{ fontSize: 13 }}>{item.label}</div>
                                                <div style={{ fontSize: 11, opacity: 0.6 }}>
                                                    {item.status === 'unknown'
                                                        ? 'Enter last service date/mileage to predict'
                                                        : [
                                                            item.kmSinceService != null ? `${item.kmSinceService.toLocaleString()} km since service` : null,
                                                            item.monthsSinceService != null ? `${item.monthsSinceService} mo since service` : null,
                                                        ].filter(Boolean).join(' · ')}
                                                </div>
                                            </div>
                                            <span className="badge" style={{ display: 'flex', alignItems: 'center', gap: 4, color: meta.color, border: `1px solid ${meta.color}`, background: 'transparent', fontSize: 10, padding: '4px 10px', whiteSpace: 'nowrap' }}>
                                                <Icon size={11} /> {meta.label}{item.percentUsed != null ? ` (${item.percentUsed}%)` : ''}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={onClose}>Close</button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
