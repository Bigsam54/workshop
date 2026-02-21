'use client'
import { useEffect, useState, use } from 'react'
import { useSearchParams } from 'next/navigation'
import { formatCurrency, formatDate } from '@/components/ui'

interface JobDetail {
    id: number; jobCode: string; status: string
    createdAt: string; completedAt: string | null
    customer: { name: string; phone: string; location: string | null }
    vehicle: { plateNumber: string; make: string; model: string; year: number }
    laborCost: number
    jobParts: Array<{ qty: number; unitPrice: number; part: { name: string; sku: string } }>
    payment?: { method: string; status: string; paidAt: string | null }
}

export default function PrintPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const searchParams = useSearchParams()
    const type = searchParams.get('type') || 'invoice'
    const [job, setJob] = useState<JobDetail | null>(null)

    useEffect(() => {
        fetch(`/api/jobs/${id}`).then(r => r.json()).then(setJob)
    }, [id])

    useEffect(() => {
        if (job) {
            // Auto trigger print dialog after a short delay for rendering
            const timer = setTimeout(() => window.print(), 1000)
            return () => clearTimeout(timer)
        }
    }, [job])

    if (!job) return <div style={{ padding: 40, textAlign: 'center' }}>Loading document...</div>

    const partsTotal = job.jobParts.reduce((s, jp) => s + jp.qty * jp.unitPrice, 0)
    const grandTotal = partsTotal + job.laborCost

    return (
        <div className="print-container">
            <div className="print-header">
                <div>
                    <h1 className="brand">WorkshopPulse</h1>
                    <p>Professional Auto Care & Maintenance</p>
                    <p>Location: Accra, Ghana | Tel: +233 20 100 0001</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <h2 style={{ textTransform: 'uppercase', fontSize: '1.5rem', marginBottom: 4 }}>{type === 'invoice' ? 'Invoicing' : 'Receipt'}</h2>
                    <p className="bold">NO: {job.jobCode}</p>
                    <p>Date: {formatDate(new Date())}</p>
                </div>
            </div>

            <hr style={{ margin: '24px 0', border: 'none', borderTop: '2px solid #000' }} />

            <div className="print-grid">
                <div>
                    <h3 className="section-title">Bill To:</h3>
                    <p className="bold">{job.customer.name}</p>
                    <p>{job.customer.phone}</p>
                    <p>{job.customer.location || 'N/A'}</p>
                </div>
                <div>
                    <h3 className="section-title">Vehicle Details:</h3>
                    <p className="bold">{job.vehicle.make} {job.vehicle.model} ({job.vehicle.year})</p>
                    <p>Reg No: {job.vehicle.plateNumber}</p>
                    <p>Job Date: {formatDate(job.createdAt)}</p>
                </div>
            </div>

            <table className="print-table">
                <thead>
                    <tr>
                        <th style={{ textAlign: 'left' }}>Description</th>
                        <th>Qty</th>
                        <th>Unit Price</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {job.jobParts.map((jp, i) => (
                        <tr key={i}>
                            <td>{jp.part.name} ({jp.part.sku})</td>
                            <td style={{ textAlign: 'center' }}>{jp.qty}</td>
                            <td style={{ textAlign: 'right' }}>{formatCurrency(jp.unitPrice)}</td>
                            <td style={{ textAlign: 'right' }}>{formatCurrency(jp.qty * jp.unitPrice)}</td>
                        </tr>
                    ))}
                    <tr>
                        <td>Labor & Service Charges</td>
                        <td style={{ textAlign: 'center' }}>1</td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(job.laborCost)}</td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(job.laborCost)}</td>
                    </tr>
                </tbody>
            </table>

            <div className="print-summary">
                <div className="summary-row">
                    <span>Parts Subtotal:</span>
                    <span>{formatCurrency(partsTotal)}</span>
                </div>
                <div className="summary-row">
                    <span>Labor Charges:</span>
                    <span>{formatCurrency(job.laborCost)}</span>
                </div>
                <div className="summary-row grand-total">
                    <span>Total Amount:</span>
                    <span>{formatCurrency(grandTotal)}</span>
                </div>
            </div>

            {type === 'receipt' && job.payment && (
                <div className="payment-note">
                    <p className="bold">Payment Received via {job.payment.method}</p>
                    <p>Thank you for your business!</p>
                </div>
            )}

            <div className="print-footer">
                <p>This is a computer generated {type}. No signature required.</p>
                <div style={{ marginTop: 40, borderTop: '1px solid #ddd', paddingTop: 8, width: 200 }}>
                    <p style={{ fontSize: 10 }}>Authorized Signatory</p>
                </div>
            </div>

            <style jsx>{`
                .print-container {
                    padding: 40px;
                    max-width: 800px;
                    margin: 0 auto;
                    font-family: 'Inter', sans-serif;
                    color: #000;
                    background: #fff;
                }
                .brand { font-weight: 900; letter-spacing: -2px; font-size: 2rem; margin: 0; }
                .print-header { display: flex; justify-content: space-between; align-items: flex-start; }
                .print-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
                .print-table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
                .print-table th { padding: 12px; border-bottom: 2px solid #000; font-size: 12px; text-transform: uppercase; }
                .print-table td { padding: 12px; border-bottom: 1px solid #eee; font-size: 14px; }
                .print-summary { margin-left: auto; width: 300px; }
                .summary-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 14px; }
                .grand-total { border-top: 2px solid #000; margin-top: 8px; padding-top: 8px; font-weight: 800; font-size: 1.2rem; }
                .section-title { font-size: 11px; text-transform: uppercase; color: #666; margin-bottom: 8px; }
                .bold { font-weight: 700; }
                .payment-note { margin-top: 40px; padding: 16px; border: 1px solid #000; text-align: center; }
                .print-footer { margin-top: 80px; font-size: 12px; color: #666; }
                @media print {
                    .print-container { padding: 0; }
                }
            `}</style>
        </div>
    )
}
