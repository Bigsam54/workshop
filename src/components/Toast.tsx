'use client'
import { createContext, useContext, useState, ReactNode, useCallback } from 'react'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'

interface Toast {
    id: number
    type: 'success' | 'error' | 'info'
    message: string
}

interface ToastContextType {
    toast: (message: string, type?: Toast['type']) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const toast = useCallback((message: string, type: Toast['type'] = 'info') => {
        const id = Date.now()
        setToasts(prev => [...prev, { id, type, message }])
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
    }, [])

    const dismiss = (id: number) => setToasts(prev => prev.filter(t => t.id !== id))

    const icons = {
        success: <CheckCircle className="toast-icon" size={18} />,
        error: <XCircle className="toast-icon" size={18} />,
        info: <Info className="toast-icon" size={18} />
    }

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            <div className="toast-container">
                {toasts.map(t => (
                    <div key={t.id} className={`toast toast-${t.type}`}>
                        {icons[t.type]}
                        <div style={{ flex: 1, fontSize: '0.9rem', fontWeight: 500 }}>{t.message}</div>
                        <button onClick={() => dismiss(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, display: 'flex' }}>
                            <X size={14} />
                        </button>
                        <div className="toast-progress" />
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}

export function useToast() {
    const ctx = useContext(ToastContext)
    if (!ctx) throw new Error('useToast must be used within ToastProvider')
    return ctx
}
