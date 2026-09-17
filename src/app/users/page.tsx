'use client'
import { useEffect, useState, FormEvent, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/components/Toast'
import { AppSidebar } from '@/components/AppSidebar'
import { formatDate } from '@/components/ui'
import { Plus, X, UserCog, ShieldCheck, KeyRound, Ban, RotateCcw } from 'lucide-react'

interface StaffUser {
    id: number; name: string; username: string; role: string; active: boolean; createdAt: string
}

const ROLE_LABELS: Record<string, string> = { ADMIN: 'Admin', SECRETARY: 'Secretary', TECH: 'Technician' }

export default function UsersPage() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const { toast } = useToast()
    const [users, setUsers] = useState<StaffUser[]>([])
    const [fetching, setFetching] = useState(true)
    const [saving, setSaving] = useState(false)

    const [showAdd, setShowAdd] = useState(false)
    const [nName, setNName] = useState(''); const [nUsername, setNUsername] = useState('')
    const [nPassword, setNPassword] = useState(''); const [nRole, setNRole] = useState('TECH')

    const [editUser, setEditUser] = useState<StaffUser | null>(null)
    const [eName, setEName] = useState(''); const [eRole, setERole] = useState('TECH'); const [ePassword, setEPassword] = useState('')

    const fetchUsers = useCallback(() => {
        fetch('/api/users').then(r => r.json()).then(setUsers).finally(() => setFetching(false))
    }, [])

    useEffect(() => {
        if (!loading && (!user || user.role !== 'ADMIN')) router.replace('/dashboard')
    }, [user, loading, router])
    useEffect(() => { if (user) fetchUsers() }, [user, fetchUsers])

    const addUser = async (e: FormEvent) => {
        e.preventDefault()
        setSaving(true)
        const res = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: nName, username: nUsername, password: nPassword, role: nRole })
        })
        if (res.ok) {
            toast('Team member added', 'success')
            setShowAdd(false)
            setNName(''); setNUsername(''); setNPassword(''); setNRole('TECH')
            fetchUsers()
        } else {
            const d = await res.json()
            toast(d.error || 'Failed to add user', 'error')
        }
        setSaving(false)
    }

    const openEdit = (u: StaffUser) => {
        setEditUser(u)
        setEName(u.name); setERole(u.role); setEPassword('')
    }

    const saveEdit = async (e: FormEvent) => {
        e.preventDefault()
        if (!editUser) return
        setSaving(true)
        const body: Record<string, unknown> = { name: eName, role: eRole }
        if (ePassword) body.password = ePassword
        const res = await fetch(`/api/users/${editUser.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        })
        if (res.ok) {
            toast('Team member updated', 'success')
            setEditUser(null)
            fetchUsers()
        } else {
            const d = await res.json()
            toast(d.error || 'Failed to update user', 'error')
        }
        setSaving(false)
    }

    const toggleActive = async (u: StaffUser) => {
        const nextActive = !u.active
        if (!confirm(nextActive
            ? `Reactivate ${u.name}? They'll be able to log in again.`
            : `Deactivate ${u.name}? They'll be immediately signed out and unable to log in until reactivated.`
        )) return
        const res = await fetch(`/api/users/${u.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ active: nextActive })
        })
        if (res.ok) {
            toast(nextActive ? `${u.name} reactivated` : `${u.name} deactivated`, 'success')
            fetchUsers()
        } else {
            const d = await res.json()
            toast(d.error || 'Failed to update status', 'error')
        }
    }

    if (loading || !user || user.role !== 'ADMIN') return null

    return (
        <div className="app-layout">
            <AppSidebar />
            <main className="main-content">
                <div className="page-content">
                    <div className="page-header" style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h1>Team Management</h1>
                            <p style={{ opacity: 0.7 }}>Add, edit, or deactivate staff accounts (Admin, Secretary, Technician)</p>
                        </div>
                        <button className="btn btn-primary" onClick={() => setShowAdd(true)}><Plus size={16} /> Add Team Member</button>
                    </div>

                    {fetching ? <div className="loading"><div className="spinner" /></div> : (
                        <div className="card">
                            <div className="table-wrapper">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Username</th>
                                            <th>Role</th>
                                            <th>Status</th>
                                            <th>Joined</th>
                                            <th style={{ textAlign: 'right' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(u => {
                                            const isSelf = u.id === user.id
                                            return (
                                                <tr key={u.id} style={{ opacity: u.active ? 1 : 0.5 }}>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                <UserCog size={14} color="var(--primary-light)" />
                                                            </div>
                                                            <span className="bold">{u.name}</span>
                                                            {isSelf && <span style={{ fontSize: 10, opacity: 0.5 }}>(you)</span>}
                                                        </div>
                                                    </td>
                                                    <td style={{ opacity: 0.8 }}>{u.username}</td>
                                                    <td>
                                                        <span className="badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, padding: '3px 10px', background: 'rgba(99,102,241,0.1)', color: 'var(--primary-light)' }}>
                                                            <ShieldCheck size={10} /> {ROLE_LABELS[u.role] || u.role}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span
                                                            className={u.active ? 'badge badge-status-completed' : 'badge'}
                                                            style={u.active ? undefined : { color: 'var(--priority-high)', border: '1px solid var(--priority-high)', background: 'transparent' }}
                                                        >
                                                            {u.active ? 'Active' : 'Deactivated'}
                                                        </span>
                                                    </td>
                                                    <td style={{ fontSize: 12, opacity: 0.6 }}>{formatDate(u.createdAt)}</td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                                            <button className="btn btn-secondary btn-xs" onClick={() => openEdit(u)}>
                                                                <KeyRound size={12} style={{ marginRight: 4 }} /> Edit
                                                            </button>
                                                            {!isSelf && (
                                                                <button
                                                                    className="btn btn-secondary btn-xs"
                                                                    style={u.active ? { color: 'var(--priority-high)' } : { color: 'var(--status-completed)' }}
                                                                    onClick={() => toggleActive(u)}
                                                                >
                                                                    {u.active
                                                                        ? <><Ban size={12} style={{ marginRight: 4 }} /> Deactivate</>
                                                                        : <><RotateCcw size={12} style={{ marginRight: 4 }} /> Reactivate</>}
                                                                </button>
                                                            )}
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

            {/* Add User Modal */}
            {showAdd && (
                <div className="modal-overlay" onClick={() => setShowAdd(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Add Team Member</h2>
                            <button className="btn btn-secondary btn-icon btn-sm" onClick={() => setShowAdd(false)}><X size={16} /></button>
                        </div>
                        <form onSubmit={addUser}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Full Name</label>
                                    <input className="form-input" value={nName} onChange={e => setNName(e.target.value)} required placeholder="e.g. Kwame Asante" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Login Username</label>
                                    <input className="form-input" value={nUsername} onChange={e => setNUsername(e.target.value)} required placeholder="What they'll log in with" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Temporary Password</label>
                                    <input className="form-input" type="text" value={nPassword} onChange={e => setNPassword(e.target.value)} required placeholder="At least 6 characters" minLength={6} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Role</label>
                                    <select className="form-select" value={nRole} onChange={e => setNRole(e.target.value)}>
                                        <option value="TECH">Technician — sees only jobs assigned to them</option>
                                        <option value="SECRETARY">Secretary — front desk, jobs, customers, inventory</option>
                                        <option value="ADMIN">Admin — full access including reports and team management</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create Account'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {editUser && (
                <div className="modal-overlay" onClick={() => setEditUser(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h2>Edit Team Member</h2>
                                <p style={{ fontSize: 12, opacity: 0.6 }}>@{editUser.username}</p>
                            </div>
                            <button className="btn btn-secondary btn-icon btn-sm" onClick={() => setEditUser(null)}><X size={16} /></button>
                        </div>
                        <form onSubmit={saveEdit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Full Name</label>
                                    <input className="form-input" value={eName} onChange={e => setEName(e.target.value)} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Role</label>
                                    <select className="form-select" value={eRole} onChange={e => setERole(e.target.value)} disabled={editUser.id === user.id}>
                                        <option value="TECH">Technician</option>
                                        <option value="SECRETARY">Secretary</option>
                                        <option value="ADMIN">Admin</option>
                                    </select>
                                    {editUser.id === user.id && <div style={{ fontSize: 11, opacity: 0.5, marginTop: 6 }}>You can&apos;t change your own role.</div>}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Reset Password (optional)</label>
                                    <input className="form-input" type="text" value={ePassword} onChange={e => setEPassword(e.target.value)} placeholder="Leave blank to keep current password" minLength={6} />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setEditUser(null)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
