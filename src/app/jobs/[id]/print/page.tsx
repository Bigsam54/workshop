'use client'
import { useEffect, useState, use, Suspense } from 'react'
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

function PrintContent({ params }: { params: Promise<{ id: string }> }) {
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
                <div style={{ position: 'relative' }}>
                    <h1 className="brand">WORKSHOP<span style={{ color: '#6366f1' }}>PULSE</span></h1>
                    <div style={{
                        background: '#000', color: '#fff', padding: '4px 12px', fontSize: 10, fontWeight: 900,
                        letterSpacing: '0.2em', textTransform: 'uppercase', display: 'inline-block', marginTop: 4
                    }}>Master Terminal Elite</div>
                    <p style={{ marginTop: 12, fontSize: 12 }}>Professional Auto Care & Maintenance</p>
                    <p style={{ fontSize: 11, opacity: 0.7 }}>Location: Accra, Ghana | Tel: +233 20 100 0001</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <h2 style={{ textTransform: 'uppercase', fontSize: '2.5rem', fontWeight: 900, margin: 0, opacity: 0.1, position: 'absolute', top: 20, right: 40 }}>{type === 'invoice' ? 'Invoice' : 'Receipt'}</h2>
                    <div style={{ position: 'relative', paddingTop: 20 }}>
                        <p className="bold" style={{ fontSize: 18 }}>REF: {job.jobCode}</p>
                        <p style={{ fontSize: 13 }}>Issued: {formatDate(new Date())}</p>
                    </div>
                </div>
            </div>

            <div style={{ margin: '40px 0', borderTop: '4px solid #000', borderBottom: '1px solid #eee', padding: '24px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
                <div>
                    <h3 className="section-title">Recipient Information</h3>
                    <p className="bold" style={{ fontSize: 16 }}>{job.customer.name}</p>
                    <p style={{ fontSize: 14 }}>{job.customer.phone}</p>
                    <p style={{ fontSize: 14, opacity: 0.7 }}>{job.customer.location || 'N/A'}</p>
                </div>
                <div>
                    <h3 className="section-title">Automotive Details</h3>
                    <p className="bold" style={{ fontSize: 16 }}>{job.vehicle.make} {job.vehicle.model}</p>
                    <p style={{ fontSize: 14 }}>Plate: <span className="bold">{job.vehicle.plateNumber}</span> · Year: {job.vehicle.year}</p>
                    <p style={{ fontSize: 14, opacity: 0.7 }}>Service Date: {formatDate(job.createdAt)}</p>
                </div>
            </div>

            <table className="print-table">
                <thead>
                    <tr>
                        <th style={{ textAlign: 'left' }}>Description</th>
                        <th>Qty</th>
                        <th style={{ textAlign: 'right' }}>Unit Price</th>
                        <th style={{ textAlign: 'right' }}>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {job.jobParts.map((jp, i) => (
                        <tr key={i}>
                            <td>
                                <div className="bold">{jp.part.name}</div>
                                <div style={{ fontSize: 10, opacity: 0.5 }}>SKU: {jp.part.sku}</div>
                            </td>
                            <td style={{ textAlign: 'center' }}>{jp.qty}</td>
                            <td style={{ textAlign: 'right' }}>{formatCurrency(jp.unitPrice)}</td>
                            <td style={{ textAlign: 'right' }} className="bold">{formatCurrency(jp.qty * jp.unitPrice)}</td>
                        </tr>
                    ))}
                    <tr>
                        <td>
                            <div className="bold">Labor & Professional Service</div>
                            <div style={{ fontSize: 10, opacity: 0.5 }}>Diagnostic fees and technical labor</div>
                        </td>
                        <td style={{ textAlign: 'center' }}>1</td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(job.laborCost)}</td>
                        <td style={{ textAlign: 'right' }} className="bold">{formatCurrency(job.laborCost)}</td>
                    </tr>
                </tbody>
            </table>

            <div className="print-summary">
                <div className="summary-row">
                    <span>Parts Subtotal</span>
                    <span>{formatCurrency(partsTotal)}</span>
                </div>
                <div className="summary-row">
                    <span>Technical Labor</span>
                    <span>{formatCurrency(job.laborCost)}</span>
                </div>
                <div className="summary-row grand-total">
                    <span>Total Amount</span>
                    <span>{formatCurrency(grandTotal)}</span>
                </div>
            </div>

            {type === 'receipt' && job.payment && (
                <div className="payment-note">
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#000' }}></div>
                        <span className="bold" style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>Payment Verified</span>
                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#000' }}></div>
                    </div>
                    <p style={{ fontSize: 14 }}>Successfully processed via <span className="bold">{job.payment.method}</span></p>
                    <p style={{ marginTop: 8, fontSize: 12, opacity: 0.6 }}>Thank you for choosing WorkshopPulse Elite Service.</p>
                </div>
            )}

            <div className="print-footer">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <p style={{ fontStyle: 'italic', marginBottom: 4 }}>"Excellence in every turn of the wrench."</p>
                        <p>Computer generated {type} · No physical signature required.</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ marginBottom: 8, height: 40, width: 200, borderBottom: '1px solid #000' }}></div>
                        <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>Authorized Signatory</p>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .print-container {
                    padding: 60px;
                    max-width: 900px;
                    margin: 0 auto;
                    font-family: 'Inter', -apple-system, sans-serif;
                    color: #000;
                    background: #fff;
                    min-height: 100vh;
                }
                .brand { font-weight: 950; letter-spacing: -3px; font-size: 2.5rem; margin: 0; line-height: 1; }
                .print-header { display: flex; justify-content: space-between; align-items: flex-start; position: relative; }
                .print-table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
                .print-table th { padding: 16px 12px; border-bottom: 3px solid #000; font-size: 11px; text-transform: uppercase; font-weight: 900; letter-spacing: 0.05em; }
                .print-table td { padding: 16px 12px; border-bottom: 1px solid #eee; font-size: 14px; vertical-align: top; }
                .print-summary { margin-left: auto; width: 320px; }
                .summary-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
                .grand-total { border-top: 3px solid #000; margin-top: 12px; padding-top: 12px; font-weight: 900; font-size: 1.5rem; }
                .section-title { font-size: 10px; text-transform: uppercase; font-weight: 900; color: #999; margin-bottom: 12px; letter-spacing: 0.1em; }
                .bold { font-weight: 800; }
                .payment-note { margin-top: 60px; padding: 32px; border: 2px solid #000; text-align: center; background: #fcfcfc; }
                .print-footer { margin-top: 100px; font-size: 11px; color: #444; border-top: 1px solid #eee; paddingTop: 24px; }
                @media print {
                    .print-container { padding: 0; }
                    body { background: #fff; }
                }
            `}</style>
        </div>
    )
}

export default function PrintPage({ params }: { params: Promise<{ id: string }> }) {
    return (
        <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Loading document...</div>}>
            <PrintContent params={params} />
        </Suspense>
    )
}
