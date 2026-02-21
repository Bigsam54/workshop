import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

// GET /api/reports
export async function GET(req: NextRequest) {
    const user = await getAuthUser(req)
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const now = new Date()
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const [revenueByMonth, jobsByStatus, topParts, techPerformance] = await Promise.all([
        // Revenue by month (last 6 payments)
        prisma.payment.findMany({
            where: { status: 'PAID', paidAt: { gte: last30Days } },
            select: { amount: true, paidAt: true, method: true },
            orderBy: { paidAt: 'asc' },
        }),
        // Jobs by status
        prisma.jobCard.groupBy({
            by: ['status'],
            _count: { id: true },
        }),
        // Top 10 most used parts
        prisma.jobPart.groupBy({
            by: ['partId'],
            _sum: { qty: true },
            orderBy: { _sum: { qty: 'desc' } },
            take: 10,
        }),
        // Technician performance
        prisma.jobCard.groupBy({
            by: ['assignedTo'],
            where: { status: { in: ['COMPLETED', 'PAID'] }, assignedTo: { not: null } },
            _count: { id: true },
        }),
    ])

    // Enrich top parts with names
    const partIds = topParts.map(p => p.partId)
    const partDetails = await prisma.part.findMany({ where: { id: { in: partIds } } })
    const topPartsEnriched = topParts.map(p => ({
        ...p,
        part: partDetails.find(pd => pd.id === p.partId),
    }))

    // Enrich tech performance with names
    const techIds = techPerformance.filter(t => t.assignedTo).map(t => t.assignedTo!)
    const techDetails = await prisma.user.findMany({ where: { id: { in: techIds } }, select: { id: true, name: true } })
    const techPerformanceEnriched = techPerformance.map(t => ({
        ...t,
        technician: techDetails.find(td => td.id === t.assignedTo),
    }))

    return NextResponse.json({
        revenueByMonth,
        jobsByStatus,
        topParts: topPartsEnriched,
        techPerformance: techPerformanceEnriched,
    })
}
