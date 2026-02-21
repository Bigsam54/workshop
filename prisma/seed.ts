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
    data: { name: 'Super Admin', phone: '0201000001', role: 'ADMIN' as any, passwordHash: hash }
  })
  const tech1 = await prisma.user.create({
    data: { name: 'Kwadwo Mechanic', phone: '0201000002', role: 'TECH' as any, passwordHash: techHash }
  })
  const tech2 = await prisma.user.create({
    data: { name: 'Isaac AutoTech', phone: '0201000003', role: 'TECH' as any, passwordHash: techHash }
  })
  const secretary = await prisma.user.create({
    data: { name: 'Evelyn Admin', phone: '0201000004', role: 'SECRETARY' as any, passwordHash: hash }
  })

  console.log('✅ Users restored (Admin, Secretary, 2 Technicians)')

  // ─── PARTS ───────────────────────────────────────────────────
  const parts = await Promise.all([
    prisma.part.create({ data: { name: 'Engine Oil 5W30', sku: 'OIL-5W30', unitPrice: 120, stockQty: 50 } }),
    prisma.part.create({ data: { name: 'Oil Filter', sku: 'FLT-TOY', unitPrice: 45, stockQty: 20 } }),
    prisma.part.create({ data: { name: 'Brake Pads (Front)', sku: 'BRK-FR', unitPrice: 350, stockQty: 8 } }),
    prisma.part.create({ data: { name: 'Air Filter', sku: 'AIR-GEN', unitPrice: 65, stockQty: 15 } }),
    prisma.part.create({ data: { name: 'Spark Plug Set', sku: 'SPK-NGK', unitPrice: 150, stockQty: 12 } }),
  ])

  console.log('✅ Inventory restored (5 core items)')

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

  console.log('✅ Customers & Vehicles restored')

  // ─── JOB CARDS ───────────────────────────────────────────────
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

  await prisma.jobCard.create({
    data: {
      jobCode: 'JOB-7702', customerId: c2.id, vehicleId: c2.vehicles[0].id, assignedTo: tech2.id,
      complaint: 'Check engine light on. AC not cooling.',
      status: 'DIAGNOSING', priority: 'MEDIUM', laborCost: 0,
      statusLogs: { create: { status: 'DIAGNOSING', changedBy: admin.id } }
    }
  })

  console.log('✅ Job Cards restored with Technician assignments')
  console.log('Seeding complete! Admin: 0201000001, Tech 1: 0201000002')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
