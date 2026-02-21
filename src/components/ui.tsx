// Status badge display map
export const STATUS_LABELS: Record<string, string> = {
    NEW: 'New',
    DIAGNOSING: 'Diagnosing',
    IN_PROGRESS: 'In Progress',
    WAITING_PARTS: 'Waiting Parts',
    COMPLETED: 'Completed',
    PAID: 'Paid',
}

// Flow allowed from each status
export const STATUS_FLOW = ['NEW', 'DIAGNOSING', 'IN_PROGRESS', 'WAITING_PARTS', 'COMPLETED', 'PAID']

export function StatusBadge({ status }: { status: string }) {
    const label = STATUS_LABELS[status] || status
    const slug = status.toLowerCase()
    return (
        <span className={`badge badge-status-${slug}`}>
            {label}
        </span>
    )
}

export function PriorityBadge({ priority }: { priority: string }) {
    const slug = priority.toLowerCase()
    return (
        <span className={`badge badge-priority-${slug}`}>
            {priority}
        </span>
    )
}

// Formatting Helpers
export function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-GH', {
        style: 'currency',
        currency: 'GHS',
    }).format(amount).replace('GHS', 'GH₵')
}

export function formatDate(dateStr: string | Date) {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    })
}

export function formatDateTime(dateStr: string | Date) {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    })
}
