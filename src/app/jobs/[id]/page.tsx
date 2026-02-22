'use client'
import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/components/Toast'
import { AppSidebar } from '@/components/AppSidebar'
import { StatusBadge, PriorityBadge, formatCurrency, formatDate, formatDateTime, STATUS_FLOW, STATUS_LABELS } from '@/components/ui'
import { ArrowLeft, Plus, Trash2, CheckCircle, Printer, Save, X, DollarSign, Wrench } from 'lucide-react'

interface JobDetail {
    id: number; jobCode: string; status: string; priority: string
    complaint: string; diagnosis: string | null; workDone: string | null; laborCost: number
    createdAt: string; updatedAt: string; completedAt: string | null
    customer: { id: number; name: string; phone: string }
    vehicle: { plateNumber: string; make: string; model: string; year: number }
    technician?: { id: number; name: string }
    statusLogs: Array<{ id: number; status: string; timestamp: string; user: { name: string } }>
    jobParts: Array<{ id: number; qty: number; unitPrice: number; part: { id: number; name: string; sku: string } }>
    payment?: { id: number; method: string; amount: number; status: string; paidAt: string | null; reference: string | null }
}

interface Part { id: number; name: string; stockQty: number; unitPrice: number }

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const { user, loading } = useAuth()
    const router = useRouter()
    const { toast } = useToast()
    const [job, setJob] = useState<JobDetail | null>(null)
    const [fetching, setFetching] = useState(true)
    const [parts, setParts] = useState<Part[]>([])
    const [addPartId, setAddPartId] = useState('')
    const [addQty, setAddQty] = useState('1')
    const [showPayModal, setShowPayModal] = useState(false)
    const [payMethod, setPayMethod] = useState('CASH')
    const [payAmount, setPayAmount] = useState('')
    const [payRef, setPayRef] = useState('')
    const [saving, setSaving] = useState(false)
    const [diagnosis, setDiagnosis] = useState('')
    const [workDone, setWorkDone] = useState('')
    const [laborCost, setLaborCost] = useState('0')

    const fetchJob = () => {
        fetch(`/api/jobs/${id}`).then(r => r.ok ? r.json() : null).then(data => {
            setJob(data)
            if (data) {
                setDiagnosis(data.diagnosis || '')
                setWorkDone(data.workDone || '')
                setLaborCost(String(data.laborCost || 0))
            }
        }).finally(() => setFetching(false))
    }

    useEffect(() => { if (!loading && !user) router.replace('/login') }, [user, loading, router])
    useEffect(() => { if (user) { fetchJob(); fetch('/api/parts').then(r => r.json()).then(setParts) } }, [user, id])

    const changeStatus = async (status: string) => {
        setSaving(true)
        const res = await fetch(`/api/jobs/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
        if (res.ok) { toast(`Status now ${STATUS_LABELS[status]}`, 'success'); fetchJob() }
        setSaving(false)
    }

    const saveDetails = async () => {
        setSaving(true)
        const res = await fetch(`/api/jobs/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ diagnosis, workDone, laborCost: Number(laborCost) })
        })
        if (res.ok) { toast('Job card updated', 'success'); fetchJob() }
        setSaving(false)
    }

    const addPart = async () => {
        if (!addPartId) return
        setSaving(true)
        const res = await fetch(`/api/jobs/${id}/parts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ partId: addPartId, qty: Number(addQty) }) })
        if (res.ok) { toast('Part added to card', 'success'); setAddPartId(''); setAddQty('1'); fetchJob() }
        setSaving(false)
    }

    const removePart = async (jobPartId: number) => {
        if (!confirm('Remove this part?')) return
        const res = await fetch(`/api/jobs/${id}/parts?jobPartId=${jobPartId}`, { method: 'DELETE' })
        if (res.ok) { toast('Part removed', 'success'); fetchJob() }
    }

    const recordPayment = async () => {
        setSaving(true)
        const res = await fetch(`/api/jobs/${id}/payment`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ method: payMethod, amount: Number(payAmount), reference: payRef }) })
        if (res.ok) { toast('Payment verified', 'success'); setShowPayModal(false); fetchJob() }
        setSaving(false)
    }

    if (fetching || loading) return <div className="app-layout"><AppSidebar /><main className="main-content"><div className="loading"><div className="spinner" /></div></main></div>
    if (!job) return <div className="app-layout"><AppSidebar /><main className="main-content"><div className="empty-state">Job not found</div></main></div>

    const partsTotal = job.jobParts.reduce((s, jp) => s + jp.qty * jp.unitPrice, 0)
    const grandTotal = partsTotal + job.laborCost

    return (
        <div className="app-layout">
            <AppSidebar />
            <main className="main-content">
                <div className="page-content">
                    {/* Header Actions */}
                    <div className="page-header" style={{
                        marginBottom: 32,
                        padding: '24px',
                        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(2, 6, 23, 0.8) 100%)',
                        borderRadius: 20,
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 24,
                        position: 'relative',
                        overflow: 'hidden',
                        boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)'
                    }}>
                        {/* Background Visual Anchors */}
                        <div style={{
                            position: 'absolute', top: 0, right: 0, bottom: 0, width: '40%',
                            display: 'flex', gap: 0, zIndex: 0, opacity: 0.35
                        }}>
                            <div style={{ flex: 1, backgroundImage: 'url(/dashboard1.png)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, #0f172a 0%, transparent 100%)' }} />
                        </div>

                        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 20 }}>
                            <button className="btn btn-secondary btn-icon" style={{
                                width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)'
                            }} onClick={() => router.back()}><ArrowLeft size={18} /></button>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.02em' }}>{job.jobCode}</h1>
                                    <StatusBadge status={job.status} />
                                    <PriorityBadge priority={job.priority} />
                                </div>
                                <div style={{ opacity: 0.6, fontSize: 13, marginTop: 4, fontWeight: 500 }}>
                                    {job.vehicle.make} {job.vehicle.model} ({job.vehicle.plateNumber}) · <span style={{ color: '#fbbf24' }}>{job.customer.name}</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 12 }}>
                            <button className="btn btn-primary" style={{ padding: '0 24px', height: 48, borderRadius: 12 }} onClick={saveDetails} disabled={saving}><Save size={18} style={{ marginRight: 8 }} /> SAVE UPDATES</button>
                            {job.status === 'PAID' && (
                                <button className="btn btn-secondary" style={{
                                    padding: '0 20px', height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8,
                                    background: 'var(--status-completed)', color: '#fff', border: 'none', fontWeight: 700
                                }} onClick={() => window.open(`/jobs/${id}/print?type=receipt`)}>
                                    <Printer size={18} /> PRINT RECEIPT
                                </button>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                            {/* Diagnosis & Repair */}
                            <div className="card">
                                <div className="card-header"><h2>Technical Notes</h2></div>
                                <div className="card-body">
                                    <div className="form-group">
                                        <label className="form-label">Diagnosis Findings</label>
                                        <textarea className="form-textarea" value={diagnosis} onChange={e => setDiagnosis(e.target.value)} placeholder="Describe what was found during inspection (e.g., Scan code P0304 - Misfire detected)." />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Work Performed</label>
                                        <textarea className="form-textarea" value={workDone} onChange={e => setWorkDone(e.target.value)} placeholder="Detail the repairs completed (e.g., Replaced spark plugs and cleared codes)." />
                                    </div>
                                    <div style={{ maxWidth: 200 }}>
                                        <label className="form-label">Labor Charges (GH₵)</label>
                                        <input className="form-input" type="number" value={laborCost} onChange={e => setLaborCost(e.target.value)} />
                                    </div>
                                </div>
                            </div>

                            {/* Inventory Consumption */}
                            <div className="card">
                                <div className="card-header">
                                    <h2>Parts Consumption</h2>
                                    {job.status !== 'PAID' && (
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <select className="form-select form-select-sm" value={addPartId} onChange={e => setAddPartId(e.target.value)}>
                                                <option value="">Select Part...</option>
                                                {parts.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stockQty})</option>)}
                                            </select>
                                            <button className="btn btn-primary btn-sm" onClick={addPart} disabled={!addPartId}><Plus size={14} /></button>
                                        </div>
                                    )}
                                </div>
                                <div className="table-wrapper">
                                    <table>
                                        <thead><tr><th>Part</th><th>Qty</th><th>Unit Price</th><th>Total</th><th></th></tr></thead>
                                        <tbody>
                                            {job.jobParts.map(jp => (
                                                <tr key={jp.id}>
                                                    <td>{jp.part.name}</td>
                                                    <td>{jp.qty}</td>
                                                    <td>{formatCurrency(jp.unitPrice)}</td>
                                                    <td className="bold">{formatCurrency(jp.qty * jp.unitPrice)}</td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        {job.status !== 'PAID' && <button className="btn btn-icon btn-xs" style={{ color: 'var(--priority-high)' }} onClick={() => removePart(jp.id)}><Trash2 size={12} /></button>}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Side Panel: Lifecycle & Billing */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                            {/* Actions & Lifecycle */}
                            <div className="card">
                                <div className="card-header"><h2>Job Lifecycle</h2></div>
                                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {STATUS_FLOW.filter(s => s !== job.status && s !== 'PAID').map(s => (
                                        <button key={s} className="btn btn-secondary" onClick={() => changeStatus(s)} style={{ justifyContent: 'flex-start' }}>
                                            <Wrench size={14} style={{ marginRight: 10, opacity: 0.6 }} /> Move to {STATUS_LABELS[s]}
                                        </button>
                                    ))}
                                    {job.status === 'COMPLETED' && (
                                        <button className="btn btn-primary" onClick={() => { setPayAmount(String(grandTotal)); setShowPayModal(true) }} style={{ justifyContent: 'center', marginTop: 10 }}>
                                            <DollarSign size={16} /> Finalize Payment
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Billing Overview */}
                            <div className="card" style={{ background: 'var(--bg-surface)', borderColor: 'var(--primary-dark)' }}>
                                <div className="card-header"><h2>Billing Overview</h2></div>
                                <div className="card-body">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, opacity: 0.8 }}><span>Subtotal (Parts)</span><span>{formatCurrency(partsTotal)}</span></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15, opacity: 0.8 }}><span>Labor</span><span>{formatCurrency(job.laborCost)}</span></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', paddingTop: 15, borderTop: '1px solid var(--border)' }}>
                                        <span className="bold">Total Due</span>
                                        <span className="bold" style={{ color: 'var(--primary-light)' }}>{formatCurrency(grandTotal)}</span>
                                    </div>
                                    {job.payment && (
                                        <div style={{ marginTop: 24, padding: 16, background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--status-completed)', borderRadius: 8 }}>
                                            <div style={{ color: 'var(--status-completed)', fontWeight: 800, fontSize: 13, marginBottom: 4 }}>PAID IN FULL</div>
                                            <div style={{ fontSize: 11, opacity: 0.7 }}>Method: {job.payment.method} · Ref: {job.payment.reference || 'N/A'}</div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Status Logs */}
                            <div className="card">
                                <div className="card-header"><h2>Activity Log</h2></div>
                                <div className="card-body">
                                    <div className="timeline">
                                        {job.statusLogs.map((log, i) => (
                                            <div key={log.id} className="timeline-item">
                                                <div className={`timeline-dot ${i === job.statusLogs.length - 1 ? 'completed' : ''}`} />
                                                <div className="timeline-content">
                                                    <div className="bold" style={{ fontSize: 13 }}>{STATUS_LABELS[log.status]}</div>
                                                    <div style={{ fontSize: 11, opacity: 0.6 }}>{formatDateTime(log.timestamp)} · {log.user.name}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Payment Record Modal */}
            {showPayModal && (
                <div className="modal-overlay" onClick={() => setShowPayModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Complete Transaction</h2>
                            <button className="btn btn-secondary btn-icon btn-sm" onClick={() => setShowPayModal(false)}><X size={16} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group" style={{ textAlign: 'center', marginBottom: 32 }}>
                                <label className="form-label" style={{ opacity: 0.6 }}>Amount to Collect</label>
                                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--primary-light)' }}>{formatCurrency(grandTotal)}</div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                <div className="form-group">
                                    <label className="form-label">Payment Method</label>
                                    <select className="form-select" value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                                        <option value="CASH">Physical Cash</option>
                                        <option value="MOMO">Mobile Money</option>
                                        <option value="BANK">Wire Transfer</option>
                                        <option value="SPLIT">Split Channel</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Ref / Receipt #</label>
                                    <input className="form-input" value={payRef} onChange={e => setPayRef(e.target.value)} />
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowPayModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={recordPayment} disabled={saving}>Confirm Record</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
