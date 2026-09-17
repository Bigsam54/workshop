'use client'
import { useState, FormEvent } from 'react'
import { X } from 'lucide-react'
import { useToast } from '@/components/Toast'

interface ClientRegistrationDrawerProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: (newCustomer: any) => void
}

export function ClientRegistrationDrawer({ isOpen, onClose, onSuccess }: ClientRegistrationDrawerProps) {
    const { toast } = useToast()
    const [cName, setCName] = useState('')
    const [cPhone, setCPhone] = useState('')
    const [cEmail, setCEmail] = useState('')
    const [cLocation, setCLocation] = useState('')

    const [vPlate, setVPlate] = useState('')
    const [vMake, setVMake] = useState('')
    const [vModel, setVModel] = useState('')
    const [vYear, setVYear] = useState('')
    const [vPrevWork, setVPrevWork] = useState('')
    const [vHistory, setVHistory] = useState('')
    const [vNotes, setVNotes] = useState('')
    const [vLastServiceDate, setVLastServiceDate] = useState('')
    const [vLastServiceMileage, setVLastServiceMileage] = useState('')

    const [saving, setSaving] = useState(false)

    const createCustomer = async (e: FormEvent) => {
        e.preventDefault()
        setSaving(true)

        const payload = {
            name: cName,
            phone: cPhone,
            email: cEmail,
            location: cLocation,
            vehicle: vPlate ? {
                plateNumber: vPlate,
                make: vMake,
                model: vModel,
                year: vYear,
                previousWork: vPrevWork,
                history: vHistory,
                notes: vNotes,
                lastServiceDate: vLastServiceDate || null,
                lastServiceMileage: vLastServiceMileage || null
            } : null
        }

        const res = await fetch('/api/customers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })

        if (res.ok) {
            const newCustomer = await res.json()
            toast('Client and vehicle synchronized successfully', 'success')
            resetForm()
            onSuccess(newCustomer)
            onClose()
        } else {
            const d = await res.json()
            toast(d.error || 'Failed to sync profile', 'error')
        }
        setSaving(false)
    }

    const resetForm = () => {
        setCName(''); setCPhone(''); setCEmail(''); setCLocation('')
        setVPlate(''); setVMake(''); setVModel(''); setVYear('')
        setVPrevWork(''); setVHistory(''); setVNotes('')
        setVLastServiceDate(''); setVLastServiceMileage('')
    }

    if (!isOpen) return null

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="drawer" onClick={e => e.stopPropagation()}>
                <div className="drawer-header">
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Register New Client</h2>
                        <p style={{ fontSize: '0.8rem', marginTop: 4 }}>Create profile and vehicle record simultaneously</p>
                    </div>
                    <button className="btn btn-secondary btn-icon btn-sm" onClick={onClose}><X size={18} /></button>
                </div>

                <form onSubmit={createCustomer} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                    <div className="drawer-body">
                        <section style={{ marginBottom: 32 }}>
                            <h3 style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--primary-light)', marginBottom: 16, fontWeight: 700 }}>Client Identity</h3>
                            <div className="form-group">
                                <label className="form-label">Full Name / Business Entity</label>
                                <input className="form-input" value={cName} onChange={e => setCName(e.target.value)} required placeholder="e.g. John Doe" />
                            </div>
                            <div className="grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div className="form-group">
                                    <label className="form-label">Phone Number</label>
                                    <input className="form-input" value={cPhone} onChange={e => setCPhone(e.target.value)} required placeholder="024 XXX XXXX" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email (Optional)</label>
                                    <input className="form-input" value={cEmail} onChange={e => setCEmail(e.target.value)} placeholder="email@example.com" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Physical Address</label>
                                <input className="form-input" value={cLocation} onChange={e => setCLocation(e.target.value)} placeholder="e.g. East Legon, Accra" />
                            </div>
                        </section>

                        <section style={{ padding: 20, background: 'rgba(99, 102, 241, 0.03)', borderRadius: 12, border: '1px dashed var(--primary-glow)' }}>
                            <h3 style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--primary-light)', marginBottom: 16, fontWeight: 700 }}>Primary Vehicle (Optional)</h3>
                            <div className="grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div className="form-group">
                                    <label className="form-label">Plate Number</label>
                                    <input className="form-input" value={vPlate} onChange={e => setVPlate(e.target.value)} placeholder="GT-XXXX-23" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Year of Manufacture</label>
                                    <input className="form-input" type="number" value={vYear} onChange={e => setVYear(e.target.value)} placeholder="2020" />
                                </div>
                            </div>
                            <div className="grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div className="form-group">
                                    <label className="form-label">Manufacturer (Make)</label>
                                    <input className="form-input" value={vMake} onChange={e => setVMake(e.target.value)} placeholder="Toyota" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Model Name</label>
                                    <input className="form-input" value={vModel} onChange={e => setVModel(e.target.value)} placeholder="Camry" />
                                </div>
                            </div>
                            <div className="grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div className="form-group">
                                    <label className="form-label">Last Service Date (Optional)</label>
                                    <input className="form-input" type="date" value={vLastServiceDate} onChange={e => setVLastServiceDate(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Mileage at Last Service (km)</label>
                                    <input className="form-input" type="number" value={vLastServiceMileage} onChange={e => setVLastServiceMileage(e.target.value)} placeholder="e.g. 45000" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Previous Workshop / Work Done</label>
                                <input className="form-input" value={vPrevWork} onChange={e => setVPrevWork(e.target.value)} placeholder="e.g. Engine swap at City Motors" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Vehicle History / Background</label>
                                <textarea className="form-input" value={vHistory} onChange={e => setVHistory(e.target.value)} placeholder="General history of the vehicle..." rows={2} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Initial Notes / Missing Items</label>
                                <textarea className="form-input" value={vNotes} onChange={e => setVNotes(e.target.value)} placeholder="e.g. Seatbelt missing, Scratched bumper" rows={2} />
                            </div>
                        </section>
                    </div>

                    <div className="drawer-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? 'Synchronizing...' : 'Save Profile'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
