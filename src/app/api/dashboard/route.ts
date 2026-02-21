import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

// GET /api/dashboard — KPI stats for Admin Dashboard
export async function GET(req: NextRequest) {
    const user = await getAuthUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [
        jobsToday,
        openJobs,
        completedThisWeek,
        allPaidThisMonth,
        recentJobs,
        jobsByStatus,
        lowStockParts,
    ] = await Promise.all([
        prisma.jobCard.count({ where: { createdAt: { gte: startOfDay } } }),
        prisma.jobCard.count({ where: { status: { notIn: ['COMPLETED', 'PAID'] } } }),
        prisma.jobCard.count({ where: { status: { in: ['COMPLETED', 'PAID'] }, completedAt: { gte: startOfWeek } } }),
        prisma.payment.findMany({ where: { status: 'PAID', paidAt: { gte: startOfMonth } } }),
        prisma.jobCard.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: { customer: true, vehicle: true, technician: { select: { name: true } }, payment: true },
        }),
        prisma.jobCard.groupBy({ by: ['status'], _count: { id: true } }),
        prisma.part.findMany({ orderBy: { stockQty: 'asc' } }),
    ])

    // Restore full revenue visibility for all authenticated users
    const revenueThisMonth = allPaidThisMonth.reduce((sum, p) => sum + p.amount, 0)

    return NextResponse.json({
        kpis: {
            jobsToday,
            openJobs,
            completedThisWeek,
            revenueThisMonth,
        },
        recentJobs,
        jobsByStatus,
        lowStockParts,
    })
}
