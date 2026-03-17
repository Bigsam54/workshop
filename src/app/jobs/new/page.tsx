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

    const [receptionist, setReceptionist] = useState('')
    const [paymentType, setPaymentType] = useState('CASH')
    const [mileage, setMileage] = useState('')
    const [chassisNo, setChassisNo] = useState('')
    const [engineNo, setEngineNo] = useState('')
    const [promisedDelivery, setPromisedDelivery] = useState('')
    const [customerOrderNo, setCustomerOrderNo] = useState('')

    // Set default receptionist from current user if they are an admin/secretary
    useEffect(() => {
        if (user && !receptionist) setReceptionist(user.name)
    }, [user])

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
            body: JSON.stringify({ 
                customerId: Number(customerId), 
                vehicleId: Number(vehicleId), 
                assignedTo: assignedTo ? Number(assignedTo) : undefined, 
                complaint, 
                priority,
                repairInstruction: complaint, // Map complaint to repair instruction too
                receptionist,
                paymentType,
                mileage,
                chassisNo,
                engineNo,
                promisedDelivery
            }),
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

    const selectedVehicle = vehicles.find(v => v.id.toString() === vehicleId)

    return (
        <div className="app-layout">
            <AppSidebar />
            <main className="main-content">
                <div className="page-content" style={{ maxWidth: 900 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
                        <button className="btn btn-secondary btn-icon" onClick={() => router.back()}><ArrowLeft size={18} /></button>
                        <div>
                            <h1 style={{ fontSize: '2rem', fontWeight: 950, letterSpacing: '-0.02em' }}>Initialize Service Record</h1>
                            <p style={{ opacity: 0.6, fontSize: 14 }}>Intake workflow aligned with KTU Auto Service standards</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            {/* SECTION 1: CLIENT & RECEPTION */}
                            <div className="card">
                                <div className="card-header">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary-light)' }}></div>
                                        <h2 style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Client & Reception Intake</h2>
                                    </div>
                                </div>
                                <div className="card-body">
                                    <div className="form-group">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                            <label className="form-label" style={{ marginBottom: 0 }}>Select Registered Client *</label>
                                            <button type="button" className="btn btn-secondary btn-xs" onClick={() => setShowRegisterDrawer(true)}>
                                                <UserPlus size={12} style={{ marginRight: 4 }} /> NEW CLIENT
                                            </button>
                                        </div>
                                        <select className="form-select" value={customerId} onChange={e => setCustomerId(e.target.value)} required>
                                            <option value="">Search for client by name or phone...</option>
                                            {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
                                        </select>
                                    </div>

                                    <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                                        <div className="form-group">
                                            <label className="form-label">Receiving Officer / Receptionist</label>
                                            <input className="form-input" value={receptionist} onChange={e => setReceptionist(e.target.value)} placeholder="Who is taking the car in?" />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Customer Order No.</label>
                                            <input className="form-input" value={customerOrderNo} onChange={e => setCustomerOrderNo(e.target.value)} placeholder="PO # if applicable" />
                                        </div>
                                    </div>

                                    <div className="form-group" style={{ marginTop: 8 }}>
                                        <label className="form-label">Service Payment Model</label>
                                        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', background: 'var(--bg-app)', padding: '12px 16px', borderRadius: 10, border: '1px solid var(--border)' }}>
                                            {['CASH', 'ACCOUNT', 'INTERNAL', 'WARRANTY', 'OTHER'].map(type => (
                                                <label key={type} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                                                    <input type="radio" name="paymentType" value={type} checked={paymentType === type} onChange={e => setPaymentType(e.target.value)} />
                                                    {type}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 2: VEHICLE IDENTITY */}
                            <div className="card">
                                <div className="card-header">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary-light)' }}></div>
                                        <h2 style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Automotive Identity</h2>
                                    </div>
                                </div>
                                <div className="card-body">
                                    <div className="form-group">
                                        <label className="form-label">Select Registered Vehicle *</label>
                                        <select className="form-select" value={vehicleId} onChange={e => setVehicleId(e.target.value)} required disabled={!customerId}>
                                            <option value="">{customerId ? 'Select a vehicle from client history...' : '⚠️ Select client first'}</option>
                                            {vehicles.map(v => <option key={v.id} value={v.id}>{v.plateNumber} — {v.make} {v.model} ({v.year})</option>)}
                                        </select>
                                    </div>

                                    <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                                        <div className="form-group">
                                            <label className="form-label">Chassis / VIN No.</label>
                                            <input className="form-input" value={chassisNo} onChange={e => setChassisNo(e.target.value)} placeholder="From dashboard/door" />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Engine / Trans No.</label>
                                            <input className="form-input" value={engineNo} onChange={e => setEngineNo(e.target.value)} placeholder="Optional" />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Current Mileage</label>
                                            <input className="form-input" value={mileage} onChange={e => setMileage(e.target.value)} placeholder="Odometer reading" />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Promised Delivery (Date & Time)</label>
                                        <input className="form-input" type="datetime-local" value={promisedDelivery} onChange={e => setPromisedDelivery(e.target.value)} />
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 3: REPAIR INSTRUCTION */}
                            <div className="card">
                                <div className="card-header">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary-light)' }}></div>
                                        <h2 style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Repair Instructions</h2>
                                    </div>
                                </div>
                                <div className="card-body">
                                    <div className="form-group">
                                        <label className="form-label">Problem Summary / Customer Complaint *</label>
                                        <textarea className="form-textarea" value={complaint} onChange={e => setComplaint(e.target.value)} placeholder="Detailed description of what needs to be fixed..." required style={{ minHeight: 120 }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SIDEBAR: ASSIGNMENT & SUMMARY */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, position: 'sticky', top: 24 }}>
                            <div className="card" style={{ border: '1px solid var(--primary-glow)', background: 'rgba(99, 102, 241, 0.02)' }}>
                                <div className="card-header"><h2>Workshop Flow</h2></div>
                                <div className="card-body">
                                    <div className="form-group">
                                        <label className="form-label">Initial Priority</label>
                                        <select className="form-select" value={priority} onChange={e => setPriority(e.target.value)}>
                                            <option value="LOW">Low - Routine</option>
                                            <option value="MEDIUM">Medium - Normal</option>
                                            <option value="HIGH">High - Urgent</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Assign Primary Technician</label>
                                        <select className="form-select" value={assignedTo} onChange={e => setAssignedTo(e.target.value)}>
                                            <option value="">Hold (Unassigned)</option>
                                            {techs.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                        </select>
                                    </div>
                                    <div style={{ marginTop: 32, padding: 16, background: 'var(--bg-app)', borderRadius: 12, border: '1px solid var(--border)' }}>
                                        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.5, marginBottom: 12 }}>Intake Summary</div>
                                        <div style={{ fontSize: 13, marginBottom: 6 }}><strong>Client:</strong> {customers.find(c => c.id.toString() === customerId)?.name || 'Not selected'}</div>
                                        <div style={{ fontSize: 13, marginBottom: 16 }}><strong>Reg:</strong> {selectedVehicle?.plateNumber || 'Not selected'}</div>
                                        <button type="submit" className="btn btn-primary" style={{ width: '100%', height: 48, borderRadius: 12 }} disabled={saving}>
                                            {saving ? 'Validating...' : 'GENERATE JOB CARD'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div style={{ padding: '0 16px', fontSize: 12, opacity: 0.5, textAlign: 'center' }}>
                                This will generate a formal JOB-XXXX code and initialize the repair order in the system.
                            </div>
                        </div>
                    </form>
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
