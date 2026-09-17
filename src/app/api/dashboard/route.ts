import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { computeMaintenanceStatus } from '@/lib/maintenance'

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
        vehicles,
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
        prisma.vehicle.findMany({ select: { mileage: true, lastServiceDate: true, lastServiceMileage: true } }),
    ])

    // Restore full revenue visibility for all authenticated users
    const revenueThisMonth = allPaidThisMonth.reduce((sum, p) => sum + p.amount, 0)

    let overdueVehicles = 0
    let dueSoonVehicles = 0
    for (const v of vehicles) {
        const currentMileage = v.mileage ? parseInt(v.mileage, 10) : null
        const maintenance = computeMaintenanceStatus({
            lastServiceDate: v.lastServiceDate,
            lastServiceMileage: v.lastServiceMileage,
            currentMileage: currentMileage != null && !isNaN(currentMileage) ? currentMileage : null,
        })
        if (maintenance.some(m => m.status === 'overdue')) overdueVehicles++
        else if (maintenance.some(m => m.status === 'due_soon')) dueSoonVehicles++
    }

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
        maintenanceAlerts: { overdueVehicles, dueSoonVehicles },
    })
}
