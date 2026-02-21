'use client'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import {
    LayoutDashboard, Briefcase, Users, Package, BarChart3,
    LogOut, Menu, X, Wrench, ListTodo
} from 'lucide-react'
import { useState, ReactNode } from 'react'

interface NavItem {
    href: string
    label: string
    icon: ReactNode
    role?: string[]
}

const navItems: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, role: ['ADMIN', 'SECRETARY'] },
    { href: '/jobs', label: 'Job Cards', icon: <Briefcase size={18} />, role: ['ADMIN', 'SECRETARY'] },
    { href: '/my-jobs', label: 'My Jobs', icon: <ListTodo size={18} />, role: ['TECH'] },
    { href: '/customers', label: 'Customers', icon: <Users size={18} />, role: ['ADMIN', 'SECRETARY'] },
    { href: '/inventory', label: 'Inventory', icon: <Package size={18} />, role: ['ADMIN', 'SECRETARY'] },
    { href: '/reports', label: 'Reports', icon: <BarChart3 size={18} />, role: ['ADMIN'] },
]

export function AppSidebar() {
    const { user, logout } = useAuth()
    const pathname = usePathname()
    const router = useRouter()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    const handleLogout = async () => {
        await logout()
        router.push('/login')
    }

    const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'

    const visibleItems = navItems.filter(item => {
        if (!item.role) return true
        return item.role.includes(user?.role || '')
    })

    return (
        <>
            {/* Mobile Navigation Header */}
            <div className="mobile-topbar" style={{ display: 'none', position: 'fixed', top: 0, left: 0, right: 0, height: 60, background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', zIndex: 40, alignItems: 'center', padding: '0 20px' }}>
                <button className="btn btn-icon btn-secondary" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
                <div className="logo-text" style={{ marginLeft: 12 }}>WorkshopPulse</div>
            </div>

            <aside className={`sidebar ${sidebarOpen ? 'mobile-open' : ''}`}>
                <div className="sidebar-header">
                    <div className="logo-icon"><Wrench size={20} strokeWidth={2.5} /></div>
                    <div className="logo-text">WorkshopPulse</div>
                </div>

                <nav className="sidebar-nav">
                    {visibleItems.map(item => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`nav-link ${pathname === item.href ? 'active' : ''}`}
                            onClick={() => setSidebarOpen(false)}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, padding: '0 8px' }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'var(--primary-light)' }}>
                            {initials}
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name || 'Guest'}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user?.role?.toLowerCase() || 'staff'}</div>
                        </div>
                    </div>
                    <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', background: 'var(--bg-app)' }} onClick={handleLogout}>
                        <LogOut size={14} style={{ marginRight: 8 }} /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Backdrop for Mobile */}
            {sidebarOpen && (
                <div
                    style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 23, 0.7)', backdropFilter: 'blur(4px)', zIndex: 45 }}
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <style jsx>{`
                @media (max-width: 1024px) {
                    .sidebar {
                        position: fixed;
                        left: -260px;
                        transition: var(--transition);
                        box-shadow: 20px 0 50px rgba(0,0,0,0.5);
                    }
                    .sidebar.mobile-open {
                        left: 0;
                    }
                    .mobile-topbar {
                        display: flex !important;
                    }
                    :global(.main-content) {
                        margin-top: 60px;
                    }
                }
            `}</style>
        </>
    )
}
