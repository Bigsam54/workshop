import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding WorkshopPulse – Full Restoration...')

  // Clean up order matters for foreign keys
  await prisma.payment.deleteMany()
  await prisma.jobStatusLog.deleteMany()
  await prisma.jobPart.deleteMany()
  await prisma.jobCard.deleteMany()
  await prisma.inventoryMovement.deleteMany()
  await prisma.vehicle.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.part.deleteMany()
  await prisma.user.deleteMany()

  const hash = await bcrypt.hash('admin123', 10)
  const techHash = await bcrypt.hash('tech123', 10)

  // ─── USERS ───────────────────────────────────────────────────
  const admin = await prisma.user.create({
    data: { name: 'Super Admin', username: 'Workshop', role: 'ADMIN' as any, passwordHash: hash } as any
  })
  const tech1 = await prisma.user.create({
    data: { name: 'Kwadwo Mechanic', username: 'Kwadwo', role: 'TECH' as any, passwordHash: techHash } as any
  })
  const tech2 = await prisma.user.create({
    data: { name: 'Isaac AutoTech', username: 'Isaac', role: 'TECH' as any, passwordHash: techHash } as any
  })
  const tech3 = await prisma.user.create({
    data: { name: 'Samuel Gears', username: 'Samuel', role: 'TECH' as any, passwordHash: techHash } as any
  })
  const tech4 = await prisma.user.create({
    data: { name: 'Emmanuel Spark', username: 'Emmanuel', role: 'TECH' as any, passwordHash: techHash } as any
  })
  const secretary = await prisma.user.create({
    data: { name: 'Evelyn Admin', username: 'Evelyn', role: 'SECRETARY' as any, passwordHash: hash } as any
  })

  console.log('✅ Users restored (Admin, Secretary, 2 Technicians)')

  // ─── PARTS ───────────────────────────────────────────────────
  const parts = await Promise.all([
    prisma.part.create({ data: { name: 'Engine Oil 5W30', sku: 'OIL-5W30', unitPrice: 120, stockQty: 50 } }),
    prisma.part.create({ data: { name: 'Oil Filter', sku: 'FLT-TOY', unitPrice: 45, stockQty: 20 } }),
    prisma.part.create({ data: { name: 'Brake Pads (Front)', sku: 'BRK-FR', unitPrice: 350, stockQty: 8 } }),
    prisma.part.create({ data: { name: 'Brake Pads (Rear)', sku: 'BRK-RR', unitPrice: 300, stockQty: 10 } }),
    prisma.part.create({ data: { name: 'Air Filter', sku: 'AIR-GEN', unitPrice: 65, stockQty: 15 } }),
    prisma.part.create({ data: { name: 'Spark Plug Set', sku: 'SPK-NGK', unitPrice: 150, stockQty: 12 } }),
    prisma.part.create({ data: { name: 'Battery 75AH', sku: 'BAT-75', unitPrice: 850, stockQty: 5 } }),
    prisma.part.create({ data: { name: 'Coolant (4L)', sku: 'COL-GEN', unitPrice: 180, stockQty: 20 } }),
    prisma.part.create({ data: { name: 'Wiper Blades Set', sku: 'WIP-BOS', unitPrice: 120, stockQty: 25 } }),
    prisma.part.create({ data: { name: 'Fuel Filter', sku: 'FLT-FUEL', unitPrice: 95, stockQty: 12 } }),
    prisma.part.create({ data: { name: 'Timing Belt', sku: 'BEL-TIM', unitPrice: 450, stockQty: 4 } }),
    prisma.part.create({ data: { name: 'Shock Absorber (Front)', sku: 'SHK-FR', unitPrice: 650, stockQty: 6 } }),
  ])

  console.log('✅ Inventory restored (12 items)')

  // ─── CUSTOMERS & VEHICLES ─────────────────────────────────────
  const c1 = await prisma.customer.create({
    data: {
      name: 'Prince Addo', phone: '0244123456', email: 'prince@example.com', location: 'Accra, Ghana',
      vehicles: { create: { plateNumber: 'GW-5421-23', make: 'Toyota', model: 'Camry', year: 2020 } }
    },
    include: { vehicles: true }
  })

  const c2 = await prisma.customer.create({
    data: {
      name: 'Ama Serwaa', phone: '0277654321', email: 'ama@domain.com', location: 'Kumasi',
      vehicles: { create: { plateNumber: 'AS-3344-20', make: 'Hyundai', model: 'Tucson', year: 2021 } }
    },
    include: { vehicles: true }
  })

  const c3 = await prisma.customer.create({
    data: {
      name: 'John Doe', phone: '0555987654', email: 'john@doe.com', location: 'Osu, Accra',
      vehicles: {
        createMany: {
          data: [
            { plateNumber: 'GN-1234-22', make: 'Honda', model: 'Civic', year: 2018 },
            { plateNumber: 'GT-5678-21', make: 'Ford', model: 'Explorer', year: 2015 }
          ]
        }
      }
    },
    include: { vehicles: true }
  })

  const c4 = await prisma.customer.create({
    data: {
      name: 'Sarah Boateng', phone: '0200112233', email: 'sarah@boateng.com', location: 'East Legon',
      vehicles: { create: { plateNumber: 'GS-9988-23', make: 'Mercedes', model: 'C300', year: 2022 } }
    },
    include: { vehicles: true }
  })

  const c5 = await prisma.customer.create({
    data: {
      name: 'Kofi Mensah', phone: '0243112233', email: 'kofi@mensah.com', location: 'Tema',
      vehicles: { create: { plateNumber: 'GT-4455-19', make: 'Nissan', model: 'Pathfinder', year: 2019 } }
    },
    include: { vehicles: true }
  })

  console.log('✅ Customers & Vehicles restored (5 customers, 6 vehicles)')

  // ─── JOB CARDS ───────────────────────────────────────────────
  // Job 1: In Progress
  await prisma.jobCard.create({
    data: {
      jobCode: 'JOB-7701', customerId: c1.id, vehicleId: c1.vehicles[0].id, assignedTo: tech1.id,
      complaint: 'Routine servicing. Vibrating while braking.',
      status: 'IN_PROGRESS', priority: 'HIGH', laborCost: 150,
      statusLogs: {
        createMany: {
          data: [
            { status: 'NEW', changedBy: admin.id, timestamp: new Date(Date.now() - 3600000) },
            { status: 'IN_PROGRESS', changedBy: admin.id, timestamp: new Date() },
          ]
        }
      },
      jobParts: { create: { partId: parts[0].id, qty: 1, unitPrice: parts[0].unitPrice } }
    }
  })

  // Job 2: Diagnosing
  await prisma.jobCard.create({
    data: {
      jobCode: 'JOB-7702', customerId: c2.id, vehicleId: c2.vehicles[0].id, assignedTo: tech2.id,
      complaint: 'Check engine light on. AC not cooling.',
      status: 'DIAGNOSING', priority: 'MEDIUM', laborCost: 0,
      statusLogs: { create: { status: 'DIAGNOSING', changedBy: admin.id } }
    }
  })

  // Job 3: Paid / Completed
  const job3 = await prisma.jobCard.create({
    data: {
      jobCode: 'JOB-7703', customerId: c3.id, vehicleId: c3.vehicles[0].id, assignedTo: tech3.id,
      complaint: 'Oil leak and regular service.',
      status: 'PAID', priority: 'HIGH', laborCost: 200, completedAt: new Date(Date.now() - 86400000),
      statusLogs: {
        createMany: {
          data: [
            { status: 'NEW', changedBy: secretary.id, timestamp: new Date(Date.now() - 172800000) },
            { status: 'IN_PROGRESS', changedBy: admin.id, timestamp: new Date(Date.now() - 129600000) },
            { status: 'COMPLETED', changedBy: tech3.id, timestamp: new Date(Date.now() - 86400000) },
            { status: 'PAID', changedBy: secretary.id, timestamp: new Date(Date.now() - 43200000) },
          ]
        }
      },
      jobParts: {
        createMany: {
          data: [
            { partId: parts[0].id, qty: 1, unitPrice: parts[0].unitPrice },
            { partId: parts[1].id, qty: 1, unitPrice: parts[1].unitPrice },
          ]
        }
      }
    }
  })
  await prisma.payment.create({
    data: { jobId: job3.id, amount: 200 + parts[0].unitPrice + parts[1].unitPrice, status: 'PAID', method: 'MOMO', paidAt: new Date(Date.now() - 43200000) }
  })

  // Job 4: Waiting Parts
  await prisma.jobCard.create({
    data: {
      jobCode: 'JOB-7704', customerId: c3.id, vehicleId: c3.vehicles[1].id, assignedTo: tech4.id,
      complaint: 'Suspension noise. Front shock replacement needed.',
      status: 'WAITING_PARTS', priority: 'MEDIUM', laborCost: 350,
      statusLogs: {
        createMany: {
          data: [
            { status: 'NEW', changedBy: secretary.id, timestamp: new Date(Date.now() - 259200000) },
            { status: 'DIAGNOSING', changedBy: tech4.id, timestamp: new Date(Date.now() - 216000000) },
            { status: 'WAITING_PARTS', changedBy: admin.id, timestamp: new Date(Date.now() - 172800000) },
          ]
        }
      },
      jobParts: { create: { partId: parts[11].id, qty: 2, unitPrice: parts[11].unitPrice } }
    }
  })

  // Job 5: New
  await prisma.jobCard.create({
    data: {
      jobCode: 'JOB-7705', customerId: c4.id, vehicleId: c4.vehicles[0].id,
      complaint: 'Electrical issues. Headlights not working.',
      status: 'NEW', priority: 'LOW',
      statusLogs: { create: { status: 'NEW', changedBy: secretary.id } }
    }
  })

  // Job 6: Completed (Awaiting Payment)
  await prisma.jobCard.create({
    data: {
      jobCode: 'JOB-7706', customerId: c5.id, vehicleId: c5.vehicles[0].id, assignedTo: tech1.id,
      complaint: 'Brake pads replacement.',
      status: 'COMPLETED', priority: 'HIGH', laborCost: 100, completedAt: new Date(Date.now() - 10800000),
      statusLogs: {
        createMany: {
          data: [
            { status: 'NEW', changedBy: secretary.id, timestamp: new Date(Date.now() - 86400000) },
            { status: 'IN_PROGRESS', changedBy: tech1.id, timestamp: new Date(Date.now() - 43200000) },
            { status: 'COMPLETED', changedBy: tech1.id, timestamp: new Date(Date.now() - 10800000) },
          ]
        }
      },
      jobParts: { create: { partId: parts[2].id, qty: 1, unitPrice: parts[2].unitPrice } }
    }
  })

  console.log('✅ Job Cards restored with varied statuses and Payments')
  console.log('Seeding complete! Admin: 0201000001, Tech 1-4: 0201000002, 03, 05, 06')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
