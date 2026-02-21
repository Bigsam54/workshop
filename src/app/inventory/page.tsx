'use client'
import { useEffect, useState, FormEvent, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/components/Toast'
import { AppSidebar } from '@/components/AppSidebar'
import { formatCurrency } from '@/components/ui'
import { Plus, X, AlertTriangle, RefreshCw, Package } from 'lucide-react'

interface Part {
    id: number; name: string; sku: string; unitPrice: number; stockQty: number; lowStockLevel: number
}

export default function InventoryPage() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const { toast } = useToast()
    const [parts, setParts] = useState<Part[]>([])
    const [fetching, setFetching] = useState(true)
    const [showAddPart, setShowAddPart] = useState(false)
    const [showAdjust, setShowAdjust] = useState(false)
    const [selectedPart, setSelectedPart] = useState<Part | null>(null)
    const [saving, setSaving] = useState(false)

    // Add part form fields
    const [pName, setPName] = useState(''); const [pSku, setPSku] = useState('')
    const [pPrice, setPPrice] = useState(''); const [pQty, setPQty] = useState('0')
    const [pLowStock, setPLowStock] = useState('5')

    // Adjust form fields
    const [adjType, setAdjType] = useState('IN'); const [adjQty, setAdjQty] = useState('1'); const [adjNote, setAdjNote] = useState('')

    const fetchParts = useCallback(() => {
        fetch('/api/parts').then(r => r.json()).then(setParts).finally(() => setFetching(false))
    }, [])

    useEffect(() => {
        if (!loading && (!user || (user.role !== 'ADMIN' && user.role !== 'SECRETARY'))) router.replace('/login')
    }, [user, loading, router])

    useEffect(() => { if (user) fetchParts() }, [user, fetchParts])

    const addPart = async (e: FormEvent) => {
        e.preventDefault()
        setSaving(true)
        const res = await fetch('/api/parts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: pName, sku: pSku, unitPrice: Number(pPrice), stockQty: Number(pQty), lowStockLevel: Number(pLowStock) })
        })
        if (res.ok) {
            toast('Part added successfully', 'success')
            setShowAddPart(false)
            setPName(''); setPSku(''); setPPrice(''); setPQty('0'); fetchParts()
        } else {
            const d = await res.json()
            toast(d.error || 'Failed to save part', 'error')
        }
        setSaving(false)
    }

    const adjustStock = async (e: FormEvent) => {
        e.preventDefault()
        if (!selectedPart) return
        setSaving(true)
        const res = await fetch('/api/inventory/adjust', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ partId: selectedPart.id, type: adjType, qty: Number(adjQty), note: adjNote })
        })
        if (res.ok) {
            toast('Stock levels updated', 'success')
            setShowAdjust(false)
            setAdjQty('1'); setAdjNote(''); setAdjType('IN'); fetchParts()
        } else {
            const d = await res.json()
            toast(d.error || 'Failed to update stock', 'error')
        }
        setSaving(false)
    }

    const lowStockParts = parts.filter(p => p.stockQty <= p.lowStockLevel)

    return (
        <div className="app-layout">
            <AppSidebar />
            <main className="main-content">
                <div className="page-content">
                    <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                        <div>
                            <h1>Inventory Management</h1>
                            <p style={{ opacity: 0.7 }}>Monitoring {parts.length} distinct spare part catalog items</p>
                        </div>
                        <button className="btn btn-primary" onClick={() => setShowAddPart(true)}><Plus size={16} /> Add Inventory Item</button>
                    </div>

                    {lowStockParts.length > 0 && (
                        <div className="card" style={{ background: 'rgba(220, 38, 38, 0.1)', borderColor: 'var(--priority-high)', borderLeftWidth: 6, marginBottom: 24 }}>
                            <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <AlertTriangle color="var(--priority-high)" />
                                <div>
                                    <div className="bold" style={{ color: 'var(--priority-high)' }}>Critical Stock Alert</div>
                                    <div style={{ fontSize: '0.9rem' }}>{lowStockParts.length} items are below minimum threshold. Please restock immediately.</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {fetching ? <div className="loading"><div className="spinner" /></div> : (
                        <div className="card">
                            <div className="table-wrapper">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Item Description</th>
                                            <th>SKU ID</th>
                                            <th>Unit Price</th>
                                            <th>Available Stock</th>
                                            <th>Status</th>
                                            <th style={{ textAlign: 'right' }}>Management</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {parts.map(p => {
                                            const isLow = p.stockQty <= p.lowStockLevel
                                            return (
                                                <tr key={p.id}>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                            <div style={{ width: 34, height: 34, background: 'var(--bg-app)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                <Package size={14} color="var(--primary-light)" />
                                                            </div>
                                                            <span className="bold">{p.name}</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ fontFamily: 'monospace', fontSize: 13, opacity: 0.8 }}>{p.sku}</td>
                                                    <td><span className="bold" style={{ color: 'var(--primary-light)' }}>{formatCurrency(p.unitPrice)}</span></td>
                                                    <td>
                                                        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: isLow ? 'var(--priority-high)' : 'var(--text-main)' }}>{p.stockQty}</span>
                                                        <span style={{ fontSize: 11, opacity: 0.5, marginLeft: 6 }}>min {p.lowStockLevel}</span>
                                                    </td>
                                                    <td>
                                                        <span className={`badge ${isLow ? 'badge-priority-high' : 'badge-status-completed'}`}>
                                                            {isLow ? 'Restock Required' : 'On Shelf'}
                                                        </span>
                                                    </td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        <button className="btn btn-secondary btn-xs" onClick={() => { setSelectedPart(p); setAdjType('IN'); setShowAdjust(true) }}>
                                                            <RefreshCw size={12} /> Stock Log
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Modals */}
            {showAddPart && (
                <div className="modal-overlay" onClick={() => setShowAddPart(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>New Inventory Entry</h2>
                            <button className="btn btn-secondary btn-icon btn-sm" onClick={() => setShowAddPart(false)}><X size={16} /></button>
                        </div>
                        <form onSubmit={addPart}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Part Name / Brand / Specifications</label>
                                    <input className="form-input" value={pName} onChange={e => setPName(e.target.value)} required placeholder="e.g. Shell Helix Ultra 5W-40 4L" />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div className="form-group">
                                        <label className="form-label">SKU Number</label>
                                        <input className="form-input" value={pSku} onChange={e => setPSku(e.target.value)} placeholder="SKU-123" required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Retail Price (GH₵)</label>
                                        <input className="form-input" type="number" value={pPrice} onChange={e => setPPrice(e.target.value)} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Starting Stock</label>
                                        <input className="form-input" type="number" value={pQty} onChange={e => setPQty(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Minimum Level</label>
                                        <input className="form-input" type="number" value={pLowStock} onChange={e => setPLowStock(e.target.value)} />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowAddPart(false)}>Close</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Processing...' : 'Register Item'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showAdjust && selectedPart && (
                <div className="modal-overlay" onClick={() => setShowAdjust(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h2>Stock Update</h2>
                                <p style={{ fontSize: 12, opacity: 0.6 }}>Adjusting: {selectedPart.name}</p>
                            </div>
                            <button className="btn btn-secondary btn-icon btn-sm" onClick={() => setShowAdjust(false)}><X size={16} /></button>
                        </div>
                        <form onSubmit={adjustStock}>
                            <div className="modal-body">
                                <div style={{ background: 'var(--bg-app)', padding: 16, borderRadius: 8, marginBottom: 20, textAlign: 'center' }}>
                                    <div style={{ opacity: 0.6, fontSize: 12, marginBottom: 4 }}>Current Physical Quantity</div>
                                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-light)' }}>{selectedPart.stockQty}</div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Action</label>
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        {(['IN', 'OUT', 'ADJUST'] as const).map(t => (
                                            <button key={t} type="button"
                                                className={`btn btn-sm ${adjType === t ? 'btn-primary' : 'btn-secondary'}`}
                                                onClick={() => setAdjType(t)}
                                                style={{ flex: 1, padding: '10px 0', justifyContent: 'center' }}
                                            >
                                                {t === 'IN' ? 'Stock In' : t === 'OUT' ? 'Stock Out' : 'Set Total'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Amount</label>
                                    <input className="form-input" type="number" value={adjQty} onChange={e => setAdjQty(e.target.value)} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Note / Reference</label>
                                    <input className="form-input" value={adjNote} onChange={e => setAdjNote(e.target.value)} placeholder="e.g. Supplier delivery or damage write-off" />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowAdjust(false)}>Dismiss</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Confirm Logs'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
