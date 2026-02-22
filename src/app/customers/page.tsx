'use client'
import { useEffect, useState, FormEvent, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/components/Toast'
import { AppSidebar } from '@/components/AppSidebar'
import { formatDate } from '@/components/ui'
import { ClientRegistrationDrawer } from '@/components/ClientRegistrationDrawer'
import { Plus, Search, X, Car, User, Mail, MapPin, TrendingUp } from 'lucide-react'

interface Customer {
    id: number; name: string; phone: string; email: string | null; location: string | null; createdAt: string
    vehicles: Array<{ plateNumber: string; make: string; model: string }>
    jobCards: Array<{
        id: number;
        status: string;
        createdAt: string;
        payment: { amount: number; status: string } | null
    }>
    _count: { jobCards: number }
}

export default function CustomersPage() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const { toast } = useToast()
    const [customers, setCustomers] = useState<Customer[]>([])
    const [fetching, setFetching] = useState(true)
    const [search, setSearch] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [showVehicleModal, setShowVehicleModal] = useState(false)
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

    const [vPlate, setVPlate] = useState(''); const [vMake, setVMake] = useState('')
    const [vModel, setVModel] = useState(''); const [vYear, setVYear] = useState('')
    const [vPrevWork, setVPrevWork] = useState(''); const [vHistory, setVHistory] = useState('')
    const [vNotes, setVNotes] = useState('')

    const [saving, setSaving] = useState(false)

    const fetchCustomers = useCallback(() => {
        const q = search ? `?search=${encodeURIComponent(search)}` : ''
        fetch(`/api/customers${q}`).then(r => r.json()).then(setCustomers).finally(() => setFetching(false))
    }, [search])

    useEffect(() => {
        if (!loading && (!user || (user.role !== 'ADMIN' && user.role !== 'SECRETARY'))) router.replace('/login')
    }, [user, loading, router])
    useEffect(() => { if (user) { setFetching(true); fetchCustomers() } }, [user, fetchCustomers])

    const handleRegistrationSuccess = () => {
        fetchCustomers()
    }

    const calculateLifetimeSpend = (c: Customer) => {
        return c.jobCards.reduce((acc, job) => {
            if (job.payment?.status === 'PAID') return acc + job.payment.amount
            return acc
        }, 0)
    }

    const getLastVisit = (c: Customer) => {
        if (c.jobCards.length === 0) return 'Never'
        return formatDate(c.jobCards[0].createdAt)
    }

    const addVehicle = async (e: FormEvent) => {
        e.preventDefault()
        if (!selectedCustomer) return
        setSaving(true)
        const res = await fetch('/api/vehicles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customerId: selectedCustomer.id,
                plateNumber: vPlate,
                make: vMake,
                model: vModel,
                year: Number(vYear),
                previousWork: vPrevWork,
                history: vHistory,
                notes: vNotes
            })
        })
        if (res.ok) {
            toast('Vehicle added successfully', 'success')
            setShowVehicleModal(false);
            setVPlate(''); setVMake(''); setVModel(''); setVYear('')
            setVPrevWork(''); setVHistory(''); setVNotes('')
            fetchCustomers()
        } else {
            const d = await res.json()
            toast(d.error || 'Failed to update vehicle log', 'error')
        }
        setSaving(false)
    }

    return (
        <div className="app-layout">
            <AppSidebar />
            <main className="main-content">
                <div className="page-content">
                    <div className="page-header" style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h1>Client Records</h1>
                            <p style={{ opacity: 0.7 }}>Managing {customers.length} registered workshop customers</p>
                        </div>
                        <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Register Client</button>
                    </div>

                    <div style={{ marginBottom: 20, position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                        <input
                            className="form-input"
                            style={{ paddingLeft: 48, height: 50, background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                            placeholder="Find records by name, phone number, or email address..."
                            value={search} onChange={e => setSearch(e.target.value)}
                        />
                    </div>

                    {fetching ? <div className="loading"><div className="spinner" /></div> :
                        customers.length === 0 ? (
                            <div className="card" style={{ padding: '80px 0', textAlign: 'center' }}>
                                <div style={{ fontSize: '3rem', marginBottom: 16, opacity: 0.2 }}>👥</div>
                                <h2>No customer matches</h2>
                                <p style={{ opacity: 0.5 }}>Try a different search or register a new one</p>
                            </div>
                        ) : (
                            <div className="card">
                                <div className="table-wrapper">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Identification</th>
                                                <th>Contact & Region</th>
                                                <th>Vehicles Owned</th>
                                                <th style={{ minWidth: 200 }}>Master Terminal Insights</th>
                                                <th style={{ textAlign: 'right' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {customers.map(c => {
                                                const lifetimeSpend = calculateLifetimeSpend(c)
                                                const lastVisit = getLastVisit(c)
                                                const visitFreq = c.jobCards.length > 0
                                                    ? (c.jobCards.length / Math.max(0.1, (new Date().getTime() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 365))).toFixed(1)
                                                    : '0'

                                                return (
                                                    <tr key={c.id}>
                                                        <td>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                                <div style={{ width: 40, height: 40, borderRadius: '12px', background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                                                                    <User size={18} color="var(--primary-light)" />
                                                                </div>
                                                                <div>
                                                                    <div className="bold" style={{ fontSize: 15 }}>{c.name}</div>
                                                                    <div style={{ fontSize: 10, opacity: 0.4, letterSpacing: '0.05em' }}>UID: {c.id.toString().padStart(4, '0')}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="bold" style={{ color: 'var(--text-main)' }}>{c.phone}</div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, opacity: 0.5, marginTop: 4 }}>
                                                                <MapPin size={11} /> {c.location || 'Not Specified'}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                                                {c.vehicles.map((v, i) => (
                                                                    <span key={i} className="badge" style={{ background: 'var(--bg-card)', color: 'var(--primary-light)', border: '1px dotted var(--primary)', fontSize: 10, padding: '2px 8px' }}>
                                                                        {v.plateNumber}
                                                                    </span>
                                                                ))}
                                                                {c.vehicles.length === 0 && <span style={{ fontSize: 11, opacity: 0.3 }}>No fleet recorded</span>}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                                                <div>
                                                                    <div style={{ fontSize: 10, opacity: 0.5, textTransform: 'uppercase', marginBottom: 2 }}>Lifetime Value</div>
                                                                    <div className="bold" style={{ color: 'var(--status-completed)', fontSize: 14 }}>₵{lifetimeSpend.toLocaleString()}</div>
                                                                </div>
                                                                <div>
                                                                    <div style={{ fontSize: 10, opacity: 0.5, textTransform: 'uppercase', marginBottom: 2 }}>Last Workshop</div>
                                                                    <div className="bold" style={{ color: 'var(--primary-light)', fontSize: 12 }}>{lastVisit}</div>
                                                                </div>
                                                            </div>
                                                            <div style={{ marginTop: 8, fontSize: 11, opacity: 0.6, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                                <TrendingUp size={10} /> {c.jobCards.length} Total visits ({visitFreq} / year)
                                                            </div>
                                                        </td>
                                                        <td style={{ textAlign: 'right' }}>
                                                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                                                <button className="btn btn-secondary btn-xs" style={{ background: 'rgba(255,255,255,0.02)' }} onClick={() => { setSelectedCustomer(c); setShowVehicleModal(true) }}>
                                                                    <Car size={13} style={{ marginRight: 4 }} /> + Vehicle
                                                                </button>
                                                                <Link href={`/jobs/new?customerId=${c.id}`} className="btn btn-primary btn-xs">
                                                                    <Plus size={13} style={{ marginRight: 4 }} /> New Order
                                                                </Link>
                                                            </div>
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

            {/* Registration Drawer */}
            <ClientRegistrationDrawer
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSuccess={handleRegistrationSuccess}
            />

            {/* Simple Vehicle Add Modal (Keep for existing clients) */}
            {showVehicleModal && (
                <div className="modal-overlay" onClick={() => setShowVehicleModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Archive New Vehicle</h2>
                                <p style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>Assigning to: <span className="bold">{selectedCustomer?.name}</span></p>
                            </div>
                            <button className="btn btn-secondary btn-icon btn-sm" onClick={() => setShowVehicleModal(false)}><X size={16} /></button>
                        </div>
                        <form onSubmit={addVehicle}>
                            <div className="modal-body">
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div className="form-group"><label className="form-label">Plate Number</label><input className="form-input" value={vPlate} onChange={e => setVPlate(e.target.value)} required /></div>
                                    <div className="form-group"><label className="form-label">Model Year</label><input className="form-input" type="number" value={vYear} onChange={e => setVYear(e.target.value)} required /></div>
                                    <div className="form-group"><label className="form-label">Manufacturer</label><input className="form-input" value={vMake} onChange={e => setVMake(e.target.value)} required /></div>
                                    <div className="form-group"><label className="form-label">Model Name</label><input className="form-input" value={vModel} onChange={e => setVModel(e.target.value)} required /></div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Previous Workshop</label>
                                    <input className="form-input" value={vPrevWork} onChange={e => setVPrevWork(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Vehicle History</label>
                                    <textarea className="form-input" value={vHistory} onChange={e => setVHistory(e.target.value)} rows={2} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Initial Notes</label>
                                    <textarea className="form-input" value={vNotes} onChange={e => setVNotes(e.target.value)} placeholder="e.g. Broken side mirror" rows={2} />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowVehicleModal(false)}>Dismiss</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>Commit Update</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
