'use client'
import { useEffect, useState, FormEvent, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/components/Toast'
import { AppSidebar } from '@/components/AppSidebar'
import { formatDate } from '@/components/ui'
import { Plus, Search, X, Car, User, Mail, Phone, MapPin } from 'lucide-react'

interface Customer {
    id: number; name: string; phone: string; email: string | null; location: string | null; createdAt: string
    vehicles: Array<{ plateNumber: string; make: string; model: string }>
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

    const [cName, setCName] = useState(''); const [cPhone, setCPhone] = useState('')
    const [cEmail, setCEmail] = useState(''); const [cLocation, setCLocation] = useState('')

    const [vPlate, setVPlate] = useState(''); const [vMake, setVMake] = useState('')
    const [vModel, setVModel] = useState(''); const [vYear, setVYear] = useState('')

    const [saving, setSaving] = useState(false)

    const fetchCustomers = useCallback(() => {
        const q = search ? `?search=${encodeURIComponent(search)}` : ''
        fetch(`/api/customers${q}`).then(r => r.json()).then(setCustomers).finally(() => setFetching(false))
    }, [search])

    useEffect(() => {
        if (!loading && (!user || (user.role !== 'ADMIN' && user.role !== 'SECRETARY'))) router.replace('/login')
    }, [user, loading, router])
    useEffect(() => { if (user) { setFetching(true); fetchCustomers() } }, [user, fetchCustomers])

    const createCustomer = async (e: FormEvent) => {
        e.preventDefault()
        setSaving(true)
        const res = await fetch('/api/customers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: cName, phone: cPhone, email: cEmail, location: cLocation }) })
        if (res.ok) {
            toast('New customer profile created', 'success')
            setShowModal(false); setCName(''); setCPhone(''); setCEmail(''); setCLocation(''); fetchCustomers()
        } else {
            const d = await res.json()
            toast(d.error || 'Failed to save', 'error')
        }
        setSaving(false)
    }

    const addVehicle = async (e: FormEvent) => {
        e.preventDefault()
        if (!selectedCustomer) return
        setSaving(true)
        const res = await fetch('/api/vehicles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customerId: selectedCustomer.id, plateNumber: vPlate, make: vMake, model: vModel, year: Number(vYear) }) })
        if (res.ok) {
            toast('Vehicle registered to owner', 'success')
            setShowVehicleModal(false); setVPlate(''); setVMake(''); setVModel(''); setVYear(''); fetchCustomers()
        } else {
            const d = await res.json()
            toast(d.error || 'Failed to register vehicle', 'error')
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
                            placeholder="Find records by name, phone digit, or email address..."
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
                                                <th>Phone Contact</th>
                                                <th>Email & Address</th>
                                                <th>Vehicles Owned</th>
                                                <th>Activity</th>
                                                <th style={{ textAlign: 'right' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {customers.map(c => (
                                                <tr key={c.id}>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                <User size={14} color="var(--primary-light)" />
                                                            </div>
                                                            <div>
                                                                <div className="bold">{c.name}</div>
                                                                <div style={{ fontSize: 10, opacity: 0.4 }}>ID: CID-{c.id}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="bold">{c.phone}</td>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                                                            <Mail size={12} style={{ opacity: 0.4 }} /> {c.email || <span style={{ opacity: 0.3 }}>N/A</span>}
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, opacity: 0.6, marginTop: 4 }}>
                                                            <MapPin size={11} style={{ opacity: 0.4 }} /> {c.location || 'Unknown'}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                                            {c.vehicles.map((v, i) => (
                                                                <span key={i} className="badge" style={{ background: 'var(--bg-app)', color: 'var(--text-main)', border: '1px solid var(--border)', fontSize: 10 }}>
                                                                    {v.plateNumber}
                                                                </span>
                                                            ))}
                                                            {c.vehicles.length === 0 && <span style={{ fontSize: 11, opacity: 0.3 }}>Empty</span>}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div style={{ fontSize: 13 }}><span className="bold" style={{ color: 'var(--primary-light)' }}>{c._count.jobCards}</span> Work Orders</div>
                                                        <div style={{ fontSize: 10, opacity: 0.4 }}>Member since: {formatDate(c.createdAt)}</div>
                                                    </td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                                            <button className="btn btn-secondary btn-xs" onClick={() => { setSelectedCustomer(c); setShowVehicleModal(true) }}>
                                                                <Car size={13} style={{ marginRight: 4 }} /> + Vehicle
                                                            </button>
                                                            <Link href={`/jobs/new?customerId=${c.id}`} className="btn btn-primary btn-xs">
                                                                New Order
                                                            </Link>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                </div>
            </main>

            {/* Registration Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Client Registration</h2>
                            <button className="btn btn-secondary btn-icon btn-sm" onClick={() => setShowModal(false)}><X size={16} /></button>
                        </div>
                        <form onSubmit={createCustomer}>
                            <div className="modal-body">
                                <div className="form-group"><label className="form-label">Full Name / Company Target</label><input className="form-input" value={cName} onChange={e => setCName(e.target.value)} required /></div>
                                <div className="form-group"><label className="form-label">Phone Digit</label><input className="form-input" value={cPhone} onChange={e => setCPhone(e.target.value)} required /></div>
                                <div className="form-group"><label className="form-label">Email Handle (Optional)</label><input className="form-input" value={cEmail} onChange={e => setCEmail(e.target.value)} /></div>
                                <div className="form-group"><label className="form-label">Physical Location</label><input className="form-input" value={cLocation} onChange={e => setCLocation(e.target.value)} /></div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>Save Profile</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Vehicle Modal */}
            {showVehicleModal && (
                <div className="modal-overlay" onClick={() => setShowVehicleModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h2>Register New Vehicle</h2>
                                <p style={{ fontSize: 12, opacity: 0.6 }}>Assigning to: {selectedCustomer?.name}</p>
                            </div>
                            <button className="btn btn-secondary btn-icon btn-sm" onClick={() => setShowVehicleModal(false)}><X size={16} /></button>
                        </div>
                        <form onSubmit={addVehicle}>
                            <div className="modal-body">
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div className="form-group"><label className="form-label">Registration Plate</label><input className="form-input" value={vPlate} onChange={e => setVPlate(e.target.value)} required /></div>
                                    <div className="form-group"><label className="form-label">Year</label><input className="form-input" type="number" value={vYear} onChange={e => setVYear(e.target.value)} required /></div>
                                    <div className="form-group"><label className="form-label">Manufacturer (Make)</label><input className="form-input" value={vMake} onChange={e => setVMake(e.target.value)} required /></div>
                                    <div className="form-group"><label className="form-label">Vehicle Model</label><input className="form-input" value={vModel} onChange={e => setVModel(e.target.value)} required /></div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowVehicleModal(false)}>Dismiss</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>Assign Vehicle</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
