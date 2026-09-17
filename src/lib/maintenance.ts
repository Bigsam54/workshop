// Standard maintenance intervals used to predict when service items fall due.
// Distance intervals are in km, time intervals are in months. Either may be
// null for items that aren't tracked on that axis.
export interface MaintenanceInterval {
    key: string
    label: string
    kmInterval: number | null
    monthInterval: number | null
}

export const MAINTENANCE_INTERVALS: MaintenanceInterval[] = [
    { key: 'engineOil', label: 'Engine Oil', kmInterval: 7500, monthInterval: 6 },
    { key: 'oilFilter', label: 'Oil Filter', kmInterval: 7500, monthInterval: 6 },
    { key: 'airFilter', label: 'Air Filter', kmInterval: 12500, monthInterval: 12 },
    { key: 'brakePads', label: 'Brake Pads', kmInterval: 30000, monthInterval: 24 },
    { key: 'tyres', label: 'Tyres (Rotation/Check)', kmInterval: 10000, monthInterval: 6 },
    { key: 'brakeFluid', label: 'Brake Fluid', kmInterval: null, monthInterval: 24 },
    { key: 'coolant', label: 'Coolant', kmInterval: null, monthInterval: 24 },
    { key: 'sparkPlugs', label: 'Spark Plugs', kmInterval: 40000, monthInterval: 36 },
    { key: 'battery', label: 'Battery', kmInterval: null, monthInterval: 24 },
    { key: 'wiperBlades', label: 'Wiper Blades', kmInterval: null, monthInterval: 12 },
]

export type MaintenanceStatus = 'overdue' | 'due_soon' | 'ok' | 'unknown'

export interface MaintenanceItemResult extends MaintenanceInterval {
    status: MaintenanceStatus
    percentUsed: number | null
    kmSinceService: number | null
    monthsSinceService: number | null
    nextDueMileage: number | null
    nextDueDate: string | null
}

export interface MaintenanceInput {
    lastServiceDate: string | Date | null
    lastServiceMileage: number | null
    currentMileage: number | null
}

const MS_PER_MONTH = 1000 * 60 * 60 * 24 * 30.44

export function computeMaintenanceStatus({
    lastServiceDate,
    lastServiceMileage,
    currentMileage,
}: MaintenanceInput): MaintenanceItemResult[] {
    const monthsSinceService = lastServiceDate
        ? (Date.now() - new Date(lastServiceDate).getTime()) / MS_PER_MONTH
        : null

    const kmSinceService =
        lastServiceMileage != null && currentMileage != null
            ? currentMileage - lastServiceMileage
            : null

    return MAINTENANCE_INTERVALS.map(item => {
        const fractionByKm =
            item.kmInterval && kmSinceService != null ? kmSinceService / item.kmInterval : null
        const fractionByMonth =
            item.monthInterval && monthsSinceService != null
                ? monthsSinceService / item.monthInterval
                : null

        const fractions = [fractionByKm, fractionByMonth].filter(
            (f): f is number => f != null
        )
        const fraction = fractions.length ? Math.max(...fractions) : null

        let status: MaintenanceStatus = 'unknown'
        if (fraction != null) {
            status = fraction >= 1 ? 'overdue' : fraction >= 0.85 ? 'due_soon' : 'ok'
        }

        const nextDueMileage =
            item.kmInterval && lastServiceMileage != null
                ? lastServiceMileage + item.kmInterval
                : null
        const nextDueDate =
            item.monthInterval && lastServiceDate
                ? new Date(
                      new Date(lastServiceDate).getTime() +
                          item.monthInterval * MS_PER_MONTH
                  ).toISOString()
                : null

        return {
            ...item,
            status,
            percentUsed: fraction != null ? Math.round(fraction * 100) : null,
            kmSinceService,
            monthsSinceService: monthsSinceService != null ? Math.round(monthsSinceService) : null,
            nextDueMileage,
            nextDueDate,
        }
    })
}
