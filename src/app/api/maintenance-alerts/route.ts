import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { computeMaintenanceStatus } from '@/lib/maintenance'

// GET /api/maintenance-alerts — vehicles with maintenance items due soon or overdue
export async function GET(req: NextRequest) {
    const user = await getAuthUser(req)
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SECRETARY')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const vehicles = await prisma.vehicle.findMany({
        include: { customer: { select: { id: true, name: true, phone: true } } },
    })

    const alerts = vehicles
        .map(v => {
            const currentMileage = v.mileage ? parseInt(v.mileage, 10) : null
            const maintenance = computeMaintenanceStatus({
                lastServiceDate: v.lastServiceDate,
                lastServiceMileage: v.lastServiceMileage,
                currentMileage: currentMileage != null && !isNaN(currentMileage) ? currentMileage : null,
            })
            const dueItems = maintenance.filter(m => m.status === 'overdue' || m.status === 'due_soon')
            const worstStatus = dueItems.some(m => m.status === 'overdue') ? 'overdue' : dueItems.length ? 'due_soon' : null

            return {
                id: v.id,
                plateNumber: v.plateNumber,
                make: v.make,
                model: v.model,
                year: v.year,
                mileage: v.mileage,
                lastServiceDate: v.lastServiceDate,
                lastServiceMileage: v.lastServiceMileage,
                customer: v.customer,
                worstStatus,
                dueItems,
            }
        })
        .filter(v => v.worstStatus !== null)
        .sort((a, b) => {
            if (a.worstStatus === b.worstStatus) return b.dueItems.length - a.dueItems.length
            return a.worstStatus === 'overdue' ? -1 : 1
        })

    return NextResponse.json({
        overdueCount: alerts.filter(a => a.worstStatus === 'overdue').length,
        dueSoonCount: alerts.filter(a => a.worstStatus === 'due_soon').length,
        vehicles: alerts,
    })
}
