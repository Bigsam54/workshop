'use client'
import { useEffect, useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/components/Toast'
import { AppSidebar } from '@/components/AppSidebar'
import { ArrowLeft, UserPlus } from 'lucide-react'
import { ClientRegistrationDrawer } from '@/components/ClientRegistrationDrawer'

interface Customer { id: number; name: string; phone: string }
interface Vehicle { id: number; plateNumber: string; make: string; model: string; year: number; customerId: number }
interface User { id: number; name: string; role: string }

export default function NewJobPage() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const { toast } = useToast()
    const [customers, setCustomers] = useState<Customer[]>([])
    const [vehicles, setVehicles] = useState<Vehicle[]>([])
    const [techs, setTechs] = useState<User[]>([])
    const [customerId, setCustomerId] = useState('')
    const [vehicleId, setVehicleId] = useState('')
    const [assignedTo, setAssignedTo] = useState('')
    const [complaint, setComplaint] = useState('')
    const [priority, setPriority] = useState('MEDIUM')
    const [saving, setSaving] = useState(false)
    const [showRegisterDrawer, setShowRegisterDrawer] = useState(false)

    useEffect(() => {
        if (!loading && (!user || user.role !== 'ADMIN')) router.replace('/jobs')
    }, [user, loading, router])

    useEffect(() => {
        if (!user) return
        Promise.all([
            fetch('/api/customers').then(r => r.json()),
            fetch('/api/users').then(r => r.json()),
        ]).then(([custs, users]) => {
            setCustomers(custs)
            setTechs(users.filter((u: User) => u.role === 'TECH'))
        })
    }, [user])

    useEffect(() => {
        if (!customerId) { setVehicles([]); setVehicleId(''); return }
        fetch(`/api/customers/${customerId}`).then(r => r.json()).then(data => {
            setVehicles(data.vehicles || [])
            // If the customer has only one vehicle, select it automatically
            if (data.vehicles?.length === 1) {
                setVehicleId(data.vehicles[0].id.toString())
            } else {
                setVehicleId('')
            }
        })
    }, [customerId])

    const fetchCustomers = () => {
        fetch('/api/customers').then(r => r.json()).then(custs => {
            setCustomers(custs)
        })
    }

    const handleRegistrationSuccess = (newCustomer: any) => {
        // Refresh customer list
        fetchCustomers()
        // Select the new customer
        setCustomerId(newCustomer.id.toString())
        toast('New client registered and selected', 'success')
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        if (!customerId || !vehicleId || !complaint) { toast('Please fill all required fields', 'error'); return }
        setSaving(true)
        const res = await fetch('/api/jobs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customerId: Number(customerId), vehicleId: Number(vehicleId), assignedTo: assignedTo ? Number(assignedTo) : undefined, complaint, priority }),
        })
        if (res.ok) {
            const job = await res.json()
            toast(`Job ${job.jobCode} created!`, 'success')
            router.push(`/jobs/${job.id}`)
        } else {
            const d = await res.json()
            toast(d.error || 'Failed to create job', 'error')
            setSaving(false)
        }
    }

    return (
        <div className="app-layout">
            <AppSidebar />
            <main className="main-content">
                <div className="page-content" style={{ maxWidth: 640 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                        <button className="btn btn-secondary btn-icon btn-sm" onClick={() => router.back()}><ArrowLeft size={16} /></button>
                        <div>
                            <h1>New Job Card</h1>
                            <p style={{ fontSize: 13 }}>Create a new workshop job card</p>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-body">
                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                        <label className="form-label" style={{ marginBottom: 0 }}>Customer *</label>
                                        <button
                                            type="button"
                                            className="btn btn-secondary btn-xs"
                                            style={{ height: 24, padding: '0 8px', fontSize: 11 }}
                                            onClick={() => setShowRegisterDrawer(true)}
                                        >
                                            <UserPlus size={12} style={{ marginRight: 4 }} /> Register Client
                                        </button>
                                    </div>
                                    <select className="form-select" value={customerId} onChange={e => setCustomerId(e.target.value)} required>
                                        <option value="">Select customer...</option>
                                        {customers.map(c => <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>)}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Vehicle *</label>
                                    <select className="form-select" value={vehicleId} onChange={e => setVehicleId(e.target.value)} required disabled={!customerId}>
                                        <option value="">{customerId ? 'Select vehicle...' : 'Select customer first'}</option>
                                        {vehicles.map(v => <option key={v.id} value={v.id}>{v.plateNumber} — {v.make} {v.model} {v.year}</option>)}
                                    </select>
                                    {customerId && vehicles.length === 0 && <div className="form-hint" style={{ color: '#f87171' }}>No vehicles for this customer. Add one first.</div>}
                                </div>

                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="form-label">Assign Technician</label>
                                        <select className="form-select" value={assignedTo} onChange={e => setAssignedTo(e.target.value)}>
                                            <option value="">Unassigned</option>
                                            {techs.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Priority</label>
                                        <select className="form-select" value={priority} onChange={e => setPriority(e.target.value)}>
                                            <option value="LOW">Low</option>
                                            <option value="MEDIUM">Medium</option>
                                            <option value="HIGH">High</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Customer Complaint *</label>
                                    <textarea className="form-textarea" value={complaint} onChange={e => setComplaint(e.target.value)} placeholder="Describe what the customer reported..." required style={{ minHeight: 100 }} />
                                </div>

                                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                                    <button type="button" className="btn btn-secondary" onClick={() => router.back()}>Cancel</button>
                                    <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create Job Card'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </main>

            <ClientRegistrationDrawer
                isOpen={showRegisterDrawer}
                onClose={() => setShowRegisterDrawer(false)}
                onSuccess={handleRegistrationSuccess}
            />
        </div>
    )
}
