'use client'
import { useEffect, useState, use, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { formatDate, formatDateTime } from '@/components/ui'

interface JobDetail {
    id: number; jobCode: string; status: string
    createdAt: string; completedAt: string | null
    receptionist: string | null; paymentType: string | null; promisedDelivery: string | null
    customer: { name: string; phone: string; location: string | null }
    vehicle: { plateNumber: string; make: string; model: string; year: number; chassisNo?: string; engineNo?: string; mileage?: string }
    laborCost: number
    description?: string; complaint?: string; repairInstruction?: string
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
            const timer = setTimeout(() => window.print(), 1200)
            return () => clearTimeout(timer)
        }
    }, [job])

    if (!job) return <div style={{ padding: 40, textAlign: 'center' }}>Loading document...</div>

    const partsTotal = job.jobParts.reduce((s, jp) => s + jp.qty * jp.unitPrice, 0)
    const grandTotal = partsTotal + job.laborCost
    const vat = grandTotal * 0.15

    const spareParts8EmptyRows = Math.max(8, job.jobParts.length + 3)
    const emptyExtraRows = Math.max(0, spareParts8EmptyRows - job.jobParts.length)

    return (
        <div className="ro-page">
            {/* ======= PAGE 1: REPAIR ORDER/INVOICE ======= */}
            <div className="ro-sheet page-break-after">

                {/* Top header strip */}
                <div className="ro-top-header">
                    <div className="ro-logo-area">
                        <div className="ro-logo-circle">
                            <span className="ro-logo-text">KTU</span>
                        </div>
                        <div className="ro-institution">
                            <div className="ro-inst-name">KOFORIDUA TECHNICAL UNIVERSITY</div>
                            <div className="ro-dept-name">AUTO SERVICE CENTER</div>
                        </div>
                    </div>
                    <div className="ro-title-block">
                        <div className="ro-repair-order-title">REPAIR ORDER/INVOICE</div>
                        <div className="ro-doc-no-line">
                            <span className="ro-field-label">No.:</span>
                            <span className="ro-field-value">{job.jobCode}</span>
                        </div>
                    </div>
                    <div className="ro-auto-dept">
                        <div className="ro-dept-title">AUTOMOTIVE ENGINEERING DEPARTMENT</div>
                        <div className="ro-dept-contact">P.O BOX 981, KOFORIDUA</div>
                        <div className="ro-dept-contact">TEL: 081-22890/24993/024-6127472</div>
                    </div>
                </div>

                {/* Customer + Vehicle info block */}
                <div className="ro-info-grid">
                    {/* Left column */}
                    <div className="ro-info-left">
                        <div className="ro-field-row">
                            <span className="ro-field-label">Name:</span>
                            <span className="ro-field-underline">{job.customer.name}</span>
                        </div>
                        <div className="ro-field-row">
                            <span className="ro-field-label">Address:</span>
                            <span className="ro-field-underline">{job.customer.location || '—'}</span>
                        </div>
                        <div className="ro-field-row">
                            <span className="ro-field-label">Tel:</span>
                            <span className="ro-field-underline">{job.customer.phone}</span>
                        </div>
                        <div className="ro-field-row-inline">
                            <div className="ro-field-pair">
                                <span className="ro-field-label">Time/</span>
                                <span className="ro-field-underline-sm">&nbsp;</span>
                            </div>
                            <div className="ro-field-pair">
                                <span className="ro-field-label">Date Req'd:</span>
                                <span className="ro-field-underline-sm">{formatDate(job.createdAt)}</span>
                            </div>
                        </div>
                        <div className="ro-field-row">
                            <span className="ro-field-label">Customer Order No.:</span>
                            <span className="ro-field-underline">&nbsp;</span>
                        </div>
                        <div className="ro-field-row-inline">
                            <span className="ro-field-label">Cash</span>
                            <span className="ro-checkbox">{job.paymentType === 'CASH' ? '☑' : '☐'}</span>
                            <span className="ro-field-label">Account</span>
                            <span className="ro-checkbox">{job.paymentType === 'ACCOUNT' ? '☑' : '☐'}</span>
                            <span className="ro-field-label">Internal</span>
                            <span className="ro-checkbox">{job.paymentType === 'INTERNAL' ? '☑' : '☐'}</span>
                            <span className="ro-field-label">Warranty</span>
                            <span className="ro-checkbox">{job.paymentType === 'WARRANTY' ? '☑' : '☐'}</span>
                            <span className="ro-field-label">Other</span>
                            <span className="ro-checkbox">{job.paymentType === 'OTHER' ? '☑' : '☐'}</span>
                        </div>
                        <div className="ro-field-row">
                            <span className="ro-field-label">Repair Instruction:</span>
                            <span className="ro-field-underline">{job.repairInstruction || job.complaint || job.description || '—'}</span>
                        </div>
                    </div>

                    {/* Middle column */}
                    <div className="ro-info-mid">
                        <div className="ro-field-row">
                            <span className="ro-field-label">Arrival Date:</span>
                            <span className="ro-field-underline">{formatDate(job.createdAt)}</span>
                        </div>
                        <div className="ro-field-row">
                            <span className="ro-field-label">Arrival Time:</span>
                            <span className="ro-field-underline">&nbsp;</span>
                        </div>
                        <div className="ro-field-row">
                            <span className="ro-field-label">Model Type:</span>
                            <span className="ro-field-underline">{job.vehicle.model}</span>
                        </div>
                        <div className="ro-field-row">
                            <span className="ro-field-label">Reg No.:</span>
                            <span className="ro-field-underline">{job.vehicle.plateNumber}</span>
                        </div>
                        <div className="ro-field-row">
                            <span className="ro-field-label">Mileage:</span>
                            <span className="ro-field-underline">{job.vehicle.mileage || '—'}</span>
                        </div>
                        <div className="ro-field-row">
                            <span className="ro-field-label">Promised Delivery:</span>
                            <span className="ro-field-underline">{job.promisedDelivery ? formatDateTime(job.promisedDelivery) : '—'}</span>
                        </div>
                        <div className="ro-field-row-inline">
                            <span className="ro-field-label">Date:</span>
                            <span className="ro-field-underline-sm">{job.promisedDelivery ? formatDate(job.promisedDelivery) : '—'}</span>
                            <span className="ro-field-label">Operation No.:</span>
                            <span className="ro-field-underline-sm">&nbsp;</span>
                        </div>
                    </div>

                    {/* Right column */}
                    <div className="ro-info-right">
                        <div className="ro-field-row">
                            <span className="ro-field-label">Chassis/VIN No.:</span>
                            <span className="ro-field-underline">{job.vehicle.chassisNo || '—'}</span>
                        </div>
                        <div className="ro-field-row">
                            <span className="ro-field-label">Engine/Trans No.:</span>
                            <span className="ro-field-underline">{job.vehicle.engineNo || '—'}</span>
                        </div>
                        <div className="ro-field-row">
                            <span className="ro-field-label">Work Comp. Date:</span>
                            <span className="ro-field-underline">{job.completedAt ? formatDate(job.completedAt) : '—'}</span>
                        </div>
                        <div className="ro-field-row">
                            <span className="ro-field-label">Receptionist:</span>
                            <span className="ro-field-underline">{job.receptionist || 'System'}</span>
                        </div>
                        <div className="ro-field-row">
                            <span className="ro-field-label">Delivery Date:</span>
                            <span className="ro-field-underline">&nbsp;</span>
                        </div>
                        <div className="ro-field-row">
                            <span className="ro-field-label">Delivery Time:</span>
                            <span className="ro-field-underline">&nbsp;</span>
                        </div>
                    </div>
                </div>

                {/* Service/Repair Estimate table */}
                <div className="ro-section-heading">Service/Repair Estimate</div>
                <table className="ro-table">
                    <thead>
                        <tr>
                            <th className="ro-th-left" style={{ width: '55%' }}>Description</th>
                            <th className="ro-th-right">Qty</th>
                            <th className="ro-th-right">Unit Price (GH₵)</th>
                            <th className="ro-th-right">Labour Charge</th>
                        </tr>
                    </thead>
                    <tbody>
                        {job.jobParts.map((jp, i) => (
                            <tr key={i}>
                                <td className="ro-td-left">{jp.part.name}</td>
                                <td className="ro-td-center">{jp.qty}</td>
                                <td className="ro-td-right">GH₵ {jp.unitPrice.toFixed(2)}</td>
                                <td className="ro-td-right"></td>
                            </tr>
                        ))}
                        {/* Labour row */}
                        <tr>
                            <td className="ro-td-left">Labour</td>
                            <td className="ro-td-center">1</td>
                            <td className="ro-td-right"></td>
                            <td className="ro-td-right">GH₵ {job.laborCost.toFixed(2)}</td>
                        </tr>
                        {/* Empty filler rows */}
                        {Array.from({ length: Math.max(3, emptyExtraRows) }).map((_, i) => (
                            <tr key={`empty-${i}`}>
                                <td className="ro-td-left">&nbsp;</td>
                                <td className="ro-td-center"></td>
                                <td className="ro-td-right"></td>
                                <td className="ro-td-right"></td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Estimate subtotals left, Totals right */}
                <div className="ro-estimate-totals-row">
                    {/* Left: additional estimate breakdown */}
                    <table className="ro-estimate-left-table">
                        <tbody>
                            <tr><td className="ro-est-label">Labour</td><td className="ro-est-val">GH₵ {job.laborCost.toFixed(2)}</td></tr>
                            <tr><td className="ro-est-label">Spare parts</td><td className="ro-est-val">GH₵ {partsTotal.toFixed(2)}</td></tr>
                            <tr><td className="ro-est-label">Materials</td><td className="ro-est-val"></td></tr>
                            <tr><td className="ro-est-label">Others</td><td className="ro-est-val"></td></tr>
                            <tr className="ro-est-total-row"><td className="ro-est-label ro-bold">Total GH₵</td><td className="ro-est-val ro-bold">GH₵ {grandTotal.toFixed(2)}</td></tr>
                            <tr><td className="ro-est-label">Additional Estimate</td><td className="ro-est-val"></td></tr>
                        </tbody>
                    </table>

                    {/* Right: final summary */}
                    <table className="ro-summary-right-table">
                        <tbody>
                            <tr><td className="ro-sum-label">Total Labour</td><td className="ro-sum-val">GH₵ {job.laborCost.toFixed(2)}</td></tr>
                            <tr><td className="ro-sum-label">Spare parts</td><td className="ro-sum-val">GH₵ {partsTotal.toFixed(2)}</td></tr>
                            <tr><td className="ro-sum-label">Materials</td><td className="ro-sum-val"></td></tr>
                            <tr><td className="ro-sum-label">Engine Oil</td><td className="ro-sum-val"></td></tr>
                            <tr><td className="ro-sum-label">Gear Box Oil</td><td className="ro-sum-val"></td></tr>
                            <tr><td className="ro-sum-label">Diff. Oil</td><td className="ro-sum-val"></td></tr>
                            <tr><td className="ro-sum-label">Sublet</td><td className="ro-sum-val"></td></tr>
                            <tr><td className="ro-sum-label">Sub. Total</td><td className="ro-sum-val">GH₵ {grandTotal.toFixed(2)}</td></tr>
                            <tr><td className="ro-sum-label">Vat @ ....%</td><td className="ro-sum-val">GH₵ {vat.toFixed(2)}</td></tr>
                            <tr className="ro-grand-total-row"><td className="ro-sum-label ro-grand-label">Total Charge GH₵</td><td className="ro-sum-val ro-grand-val">GH₵ {(grandTotal + vat).toFixed(2)}</td></tr>
                        </tbody>
                    </table>
                </div>

                {/* Work Carried Out + Recommendations */}
                <div className="ro-work-section">
                    <div className="ro-work-label">Work Carried Out:</div>
                    <div className="ro-work-lines">
                        <div className="ro-line"></div>
                        <div className="ro-line"></div>
                        <div className="ro-line"></div>
                    </div>
                </div>

                <div className="ro-recommendations">
                    <div className="ro-rec-heading">We recommend the following items are given attention</div>
                    <div className="ro-rec-items">
                        <div className="ro-rec-item"><span className="ro-rec-num">(i)</span><span className="ro-line-short"></span></div>
                        <div className="ro-rec-item"><span className="ro-rec-num">(ii)</span><span className="ro-line-short"></span></div>
                        <div className="ro-rec-item"><span className="ro-rec-num">(iii)</span><span className="ro-line-short"></span></div>
                        <div className="ro-rec-item"><span className="ro-rec-num">(iv)</span><span className="ro-line-short"></span></div>
                    </div>
                </div>

                {/* Quality check + signatories */}
                <div className="ro-quality-row">
                    <div className="ro-quality-block">
                        <div className="ro-quality-title">QUALITY CHECK<br />OK/REJECTED</div>
                        <div className="ro-sig-line"></div>
                    </div>
                    <div className="ro-quality-block">
                        <div className="ro-quality-title">QUALITY INSPECTOR</div>
                        <div className="ro-sig-line"></div>
                    </div>
                    <div className="ro-quality-block">
                        <div className="ro-quality-title">SERVICE MANAGER</div>
                        <div className="ro-sig-line"></div>
                    </div>
                    <div className="ro-quality-block">
                        <div className="ro-quality-title">CASHIER</div>
                        <div className="ro-sig-line"></div>
                    </div>
                </div>

                {/* Warranties text */}
                <div className="ro-warranties">
                    <p><strong>Warranties:</strong> Schedule service is warranted against faulty workmanship for a period of 6 months or until the next scheduled service whichever is first. Repair work is warranted against faulty workmanship for a period of 6 months from the date of repair. Spare parts are warranted against non-genuine. The warranties do not affect the customer&apos;s statutory rights.</p>
                    <p><strong>Conditions:</strong> the customer hereby confirms that the above-mentioned job should be carried out and any verbal or written estimator are not final. Articles left in the vehicle are risk of the customer. The customer confirms that vehicle is insured against accident otherwise agrees that any damage which may be caused to the vehicle during repair shall be the customer&apos;s responsibility. Should the customer fail to collect the vehicle 4 weeks after completion of repairs, the company is hereby authorized by the customer to dispose of it in whatever manner the company may think fit in order to defray the cost of repair and storage charges.</p>
                </div>

                {/* Customer + Distributor signatures */}
                <div className="ro-sig-row">
                    <div className="ro-sig-block">
                        <span className="ro-sig-label">Customer&apos;s Sig:</span>
                        <span className="ro-sig-dotted">..................................</span>
                        <span className="ro-sig-label" style={{ marginLeft: 16 }}>Date:</span>
                        <span className="ro-sig-dotted">....................</span>
                    </div>
                    <div className="ro-sig-block">
                        <span className="ro-sig-label">Distributor&apos;s Sig:</span>
                        <span className="ro-sig-dotted">..................................</span>
                        <span className="ro-sig-label" style={{ marginLeft: 16 }}>Date:</span>
                        <span className="ro-sig-dotted">....................</span>
                    </div>
                </div>
            </div>

            {/* ======= PAGE 2: SPARE PARTS + TECHNICIAN + INVENTORY ======= */}
            <div className="ro-sheet">

                {/* Spare Parts Used table */}
                <div className="ro-page2-top">
                    <div className="ro-spare-section">
                        <div className="ro-section-heading">SPARE PARTS USED</div>
                        <table className="ro-spare-table">
                            <thead>
                                <tr>
                                    <th className="ro-spare-th">Date</th>
                                    <th className="ro-spare-th">Reqn. No.</th>
                                    <th className="ro-spare-th">Qty</th>
                                    <th className="ro-spare-th" style={{ width: '40%' }}>Description</th>
                                    <th className="ro-spare-th">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {job.jobParts.map((jp, i) => (
                                    <tr key={i}>
                                        <td className="ro-spare-td">{formatDate(job.createdAt)}</td>
                                        <td className="ro-spare-td"></td>
                                        <td className="ro-spare-td">{jp.qty}</td>
                                        <td className="ro-spare-td">{jp.part.name}</td>
                                        <td className="ro-spare-td">GH₵ {(jp.qty * jp.unitPrice).toFixed(2)}</td>
                                    </tr>
                                ))}
                                {Array.from({ length: Math.max(10, emptyExtraRows + 5) }).map((_, i) => (
                                    <tr key={`sp-empty-${i}`}>
                                        <td className="ro-spare-td">&nbsp;</td>
                                        <td className="ro-spare-td"></td>
                                        <td className="ro-spare-td"></td>
                                        <td className="ro-spare-td"></td>
                                        <td className="ro-spare-td"></td>
                                    </tr>
                                ))}
                                <tr className="ro-spare-total-row">
                                    <td colSpan={4} className="ro-spare-total-label">Total Value Of Part/Materials Used GH₵</td>
                                    <td className="ro-spare-td ro-bold">GH₵ {partsTotal.toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>

                        {/* Test Driven By */}
                        <div className="ro-test-drive">
                            <div className="ro-test-title">Test Driven By:</div>
                            {[1, 2, 3, 4].map(n => (
                                <div key={n} className="ro-test-line">
                                    <span className="ro-test-num">{n}.</span>
                                    <span className="ro-test-underline"></span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Technician Time Tracking */}
                    <div className="ro-tech-section">
                        <table className="ro-tech-table">
                            <thead>
                                <tr>
                                    <th className="ro-tech-th">Opr No.</th>
                                    <th className="ro-tech-th">Foreman/ Technician</th>
                                    <th className="ro-tech-th">Sold Item</th>
                                    <th className="ro-tech-th">Actual Time</th>
                                    <th className="ro-tech-th">Time Gained</th>
                                    <th className="ro-tech-th">Time lost</th>
                                    <th className="ro-tech-th">Unprod time</th>
                                    <th className="ro-tech-th" colSpan={2}>Clockings</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <tr key={i}>
                                        <td className="ro-tech-td"></td>
                                        <td className="ro-tech-td"></td>
                                        <td className="ro-tech-td"></td>
                                        <td className="ro-tech-td"></td>
                                        <td className="ro-tech-td"></td>
                                        <td className="ro-tech-td"></td>
                                        <td className="ro-tech-td"></td>
                                        <td className="ro-tech-td ro-clocking-label">Off</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="ro-productivity-row">
                            <span>Productivity: <strong>A</strong></span>
                            <span style={{ marginLeft: 16 }}>B</span>
                            <span style={{ marginLeft: 32 }}>Efficiency: <strong>B</strong></span>
                            <span style={{ marginLeft: 16 }}>B</span>
                        </div>
                    </div>
                </div>

                {/* Inventory of items found on vehicle */}
                <div className="ro-inventory-section">
                    <div className="ro-inv-heading">INVENTORY OF ITEMS FOUND ON VEHICLE</div>
                    <div className="ro-inv-grid">
                        {/* Left column */}
                        <div className="ro-inv-col">
                            {[
                                'Outside Mirror', 'Inside Mirror', 'Radio Cass Player', 'A/C Functioning',
                                'Cigarette Lighter', 'Floor Aid Kit', 'Warning Triangle', 'Jack Bar',
                                'Wheel Spanner', 'Spare Tyre', 'Fire Extinguisher', 'Wheel Caps Qty',
                                'Sport/Fog light Qty', 'Wind Screen Cracked'
                            ].map(item => (
                                <div key={item} className="ro-inv-item">
                                    <span className="ro-inv-label">{item}</span>
                                    <span className="ro-inv-checks">
                                        <span className="ro-inv-col-label">Yes</span>
                                        <span className="ro-checkbox-sm">☐</span>
                                        <span className="ro-inv-col-label">No</span>
                                        <span className="ro-checkbox-sm">☐</span>
                                    </span>
                                </div>
                            ))}
                            <div className="ro-inv-item">
                                <span className="ro-inv-label">Comments:</span>
                                <span className="ro-inv-underline"></span>
                            </div>
                        </div>
                        {/* Right column */}
                        <div className="ro-inv-col">
                            {[
                                'Dent', 'Scratches', 'Press Gauge', 'Pliers',
                                'Shifting Spanners', 'Screw Driver'
                            ].map(item => (
                                <div key={item} className="ro-inv-item">
                                    <span className="ro-inv-label">{item}</span>
                                    <span className="ro-inv-checks">
                                        <span className="ro-inv-col-label">Yes</span>
                                        <span className="ro-checkbox-sm">☐</span>
                                        <span className="ro-inv-col-label">No</span>
                                        <span className="ro-checkbox-sm">☐</span>
                                    </span>
                                </div>
                            ))}
                            {/* Fuel gauge semi-circle */}
                            <div className="ro-fuel-gauge">
                                <svg viewBox="0 0 120 70" width="120" height="70">
                                    <path d="M10,60 A50,50 0 0,1 110,60" fill="none" stroke="#000" strokeWidth="2" />
                                    <text x="10" y="68" fontSize="12" fontFamily="Arial">F</text>
                                    <text x="55" y="45" fontSize="10" fontFamily="Arial">½</text>
                                    <text x="102" y="68" fontSize="12" fontFamily="Arial">E</text>
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="ro-inv-sig">
                        <span className="ro-sig-label">Customer&apos;s Signature: </span>
                        <span className="ro-sig-dotted">.............................................</span>
                    </div>
                </div>
            </div>

            <style jsx>{`
                * { box-sizing: border-box; }
                .ro-page {
                    font-family: Arial, sans-serif;
                    font-size: 11px;
                    color: #000;
                    background: #fff;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .ro-sheet {
                    border: 1px solid #999;
                    padding: 16px;
                    margin-bottom: 20px;
                    background: #fff;
                }
                .page-break-after {
                    page-break-after: always;
                }

                /* TOP HEADER */
                .ro-top-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    border-bottom: 2px solid #000;
                    padding-bottom: 10px;
                    margin-bottom: 12px;
                    gap: 10px;
                }
                .ro-logo-area {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .ro-logo-circle {
                    width: 52px; height: 52px;
                    border: 3px solid #000;
                    border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                }
                .ro-logo-text { font-weight: 900; font-size: 14px; letter-spacing: 1px; }
                .ro-institution {}
                .ro-inst-name { font-weight: 900; font-size: 11px; text-transform: uppercase; }
                .ro-dept-name { font-size: 10px; font-weight: 700; text-transform: uppercase; }
                .ro-title-block {
                    text-align: center;
                    border: 2px solid #000;
                    padding: 8px 16px;
                }
                .ro-repair-order-title {
                    font-weight: 900;
                    font-size: 13px;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                }
                .ro-doc-no-line {
                    margin-top: 6px;
                    font-size: 11px;
                }
                .ro-auto-dept {
                    text-align: right;
                    font-size: 10px;
                    line-height: 1.6;
                }
                .ro-dept-title { font-weight: 900; font-size: 11px; text-transform: uppercase; }
                .ro-dept-contact { font-size: 10px; }

                /* INFO GRID */
                .ro-info-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    gap: 0;
                    border: 1px solid #999;
                    margin-bottom: 12px;
                }
                .ro-info-left, .ro-info-mid, .ro-info-right {
                    padding: 8px;
                    border-right: 1px solid #999;
                }
                .ro-info-right { border-right: none; }
                .ro-field-row {
                    display: flex;
                    align-items: baseline;
                    gap: 4px;
                    margin-bottom: 5px;
                    flex-wrap: wrap;
                }
                .ro-field-row-inline {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    margin-bottom: 5px;
                    flex-wrap: wrap;
                }
                .ro-field-label { font-weight: 700; white-space: nowrap; font-size: 10px; }
                .ro-field-value { font-size: 11px; }
                .ro-field-underline {
                    border-bottom: 1px solid #000;
                    flex: 1;
                    min-width: 60px;
                    font-size: 11px;
                    padding-bottom: 1px;
                }
                .ro-field-underline-sm {
                    border-bottom: 1px solid #000;
                    min-width: 40px;
                    font-size: 11px;
                    padding-bottom: 1px;
                    display: inline-block;
                }
                .ro-field-pair {
                    display: flex;
                    align-items: baseline;
                    gap: 4px;
                }
                .ro-checkbox {
                    font-size: 12px;
                    line-height: 1;
                }

                /* SECTION HEADING */
                .ro-section-heading {
                    font-weight: 900;
                    font-size: 11px;
                    text-transform: uppercase;
                    border-bottom: 2px solid #000;
                    padding-bottom: 3px;
                    margin-bottom: 6px;
                    margin-top: 10px;
                }

                /* MAIN SERVICE TABLE */
                .ro-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 0;
                }
                .ro-th-left {
                    border: 1px solid #000;
                    padding: 4px 6px;
                    text-align: left;
                    font-size: 10px;
                    font-weight: 900;
                    background: #f0f0f0;
                }
                .ro-th-right {
                    border: 1px solid #000;
                    padding: 4px 6px;
                    text-align: right;
                    font-size: 10px;
                    font-weight: 900;
                    background: #f0f0f0;
                }
                .ro-td-left {
                    border: 1px solid #ccc;
                    padding: 4px 6px;
                    text-align: left;
                    font-size: 11px;
                    min-height: 20px;
                }
                .ro-td-center {
                    border: 1px solid #ccc;
                    padding: 4px 6px;
                    text-align: center;
                    font-size: 11px;
                }
                .ro-td-right {
                    border: 1px solid #ccc;
                    padding: 4px 6px;
                    text-align: right;
                    font-size: 11px;
                }

                /* ESTIMATE + SUMMARY ROW */
                .ro-estimate-totals-row {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 10px;
                    margin-bottom: 10px;
                    gap: 20px;
                }
                .ro-estimate-left-table, .ro-summary-right-table {
                    border-collapse: collapse;
                    flex: 1;
                    max-width: 48%;
                }
                .ro-est-label, .ro-sum-label {
                    border: 1px solid #ccc;
                    padding: 3px 6px;
                    font-size: 10px;
                    font-weight: 600;
                    white-space: nowrap;
                }
                .ro-est-val, .ro-sum-val {
                    border: 1px solid #ccc;
                    padding: 3px 6px;
                    font-size: 10px;
                    text-align: right;
                    min-width: 80px;
                }
                .ro-est-total-row td {
                    border-top: 2px solid #000;
                    background: #f0f0f0;
                }
                .ro-grand-total-row td {
                    background: #000;
                    color: #fff;
                    border: 1px solid #000;
                }
                .ro-bold { font-weight: 900; }
                .ro-grand-label, .ro-grand-val { font-weight: 900; font-size: 11px; }

                /* WORK SECTION */
                .ro-work-section {
                    margin: 10px 0;
                }
                .ro-work-label { font-weight: 700; font-size: 11px; margin-bottom: 4px; }
                .ro-work-lines { display: flex; flex-direction: column; gap: 8px; }
                .ro-line {
                    border-bottom: 1px solid #999;
                    height: 18px;
                    width: 100%;
                }

                /* RECOMMENDATIONS */
                .ro-recommendations { margin: 10px 0; }
                .ro-rec-heading { font-weight: 700; font-size: 10px; margin-bottom: 6px; }
                .ro-rec-items { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
                .ro-rec-item { display: flex; align-items: center; gap: 4px; }
                .ro-rec-num { font-weight: 700; font-size: 11px; }
                .ro-line-short {
                    border-bottom: 1px solid #999;
                    flex: 1;
                    height: 16px;
                }

                /* QUALITY ROW */
                .ro-quality-row {
                    display: flex;
                    justify-content: space-between;
                    border-top: 2px solid #000;
                    border-bottom: 2px solid #000;
                    padding: 8px 0;
                    margin: 10px 0;
                    gap: 10px;
                }
                .ro-quality-block {
                    flex: 1;
                    text-align: center;
                    padding: 0 8px;
                    border-right: 1px solid #ccc;
                }
                .ro-quality-block:last-child { border-right: none; }
                .ro-quality-title { font-weight: 900; font-size: 9px; text-transform: uppercase; margin-bottom: 16px; }
                .ro-sig-line {
                    border-bottom: 1px solid #000;
                    height: 24px;
                    width: 100%;
                }

                /* WARRANTIES */
                .ro-warranties {
                    font-size: 9px;
                    line-height: 1.4;
                    margin: 8px 0;
                    border: 1px solid #ccc;
                    padding: 6px;
                    background: #fafafa;
                }
                .ro-warranties p { margin: 0 0 4px 0; }

                /* SIGNATURE ROW */
                .ro-sig-row {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 10px;
                    gap: 20px;
                }
                .ro-sig-block { display: flex; align-items: center; gap: 4px; font-size: 10px; }
                .ro-sig-label { font-weight: 700; font-size: 10px; white-space: nowrap; }
                .ro-sig-dotted { font-size: 11px; color: #555; }

                /* ===== PAGE 2 ===== */
                .ro-page2-top {
                    display: flex;
                    gap: 12px;
                }
                .ro-spare-section { flex: 2; }
                .ro-tech-section { flex: 1.5; }

                /* SPARE TABLE */
                .ro-spare-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .ro-spare-th {
                    border: 1px solid #000;
                    padding: 3px 5px;
                    font-size: 9px;
                    font-weight: 900;
                    background: #eee;
                    text-align: center;
                }
                .ro-spare-td {
                    border: 1px solid #ccc;
                    padding: 3px 5px;
                    font-size: 10px;
                    min-height: 16px;
                }
                .ro-spare-total-row td {
                    border-top: 2px solid #000;
                    background: #eee;
                    font-weight: 700;
                    font-size: 10px;
                }
                .ro-spare-total-label {
                    padding: 3px 5px;
                    text-align: right;
                    font-weight: 700;
                }

                /* TEST DRIVEN */
                .ro-test-drive { margin-top: 10px; }
                .ro-test-title { font-weight: 700; font-size: 10px; margin-bottom: 4px; }
                .ro-test-line {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    margin-bottom: 8px;
                }
                .ro-test-num { font-size: 10px; font-weight: 700; }
                .ro-test-underline {
                    flex: 1;
                    border-bottom: 1px solid #000;
                    height: 16px;
                    display: block;
                }

                /* TECHNICIAN TABLE */
                .ro-tech-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 9px;
                }
                .ro-tech-th {
                    border: 1px solid #000;
                    padding: 3px 2px;
                    font-size: 8px;
                    font-weight: 900;
                    background: #eee;
                    text-align: center;
                }
                .ro-tech-td {
                    border: 1px solid #ccc;
                    padding: 3px 2px;
                    text-align: center;
                    font-size: 9px;
                    min-height: 16px;
                }
                .ro-clocking-label { font-size: 9px; font-weight: 700; }
                .ro-productivity-row {
                    margin-top: 6px;
                    font-size: 10px;
                    display: flex;
                    flex-wrap: wrap;
                }

                /* INVENTORY */
                .ro-inventory-section {
                    margin-top: 16px;
                    border: 2px solid #000;
                    padding: 10px;
                }
                .ro-inv-heading {
                    font-weight: 900;
                    font-size: 11px;
                    text-transform: uppercase;
                    border-bottom: 2px solid #000;
                    padding-bottom: 4px;
                    margin-bottom: 8px;
                    text-align: center;
                    letter-spacing: 1px;
                }
                .ro-inv-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 8px;
                }
                .ro-inv-col { display: flex; flex-direction: column; gap: 4px; }
                .ro-inv-item { display: flex; align-items: center; justify-content: space-between; gap: 4px; }
                .ro-inv-label { font-size: 10px; font-weight: 600; flex: 1; }
                .ro-inv-checks { display: flex; align-items: center; gap: 3px; }
                .ro-inv-col-label { font-size: 9px; font-weight: 700; }
                .ro-checkbox-sm { font-size: 12px; line-height: 1; }
                .ro-inv-underline { flex: 1; border-bottom: 1px solid #000; height: 14px; display: inline-block; min-width: 80px; }
                .ro-fuel-gauge { margin-top: 8px; text-align: center; }
                .ro-inv-sig {
                    margin-top: 12px;
                    font-size: 10px;
                    border-top: 1px solid #ccc;
                    padding-top: 8px;
                    text-align: right;
                }

                @media print {
                    .ro-page { padding: 0; max-width: 100%; }
                    .ro-sheet { border: 1px solid #999; }
                    body { background: #fff; }
                    @page { margin: 12mm; }
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
