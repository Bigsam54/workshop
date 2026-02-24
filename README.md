# WorkshopPulse - Garage Management System

WorkshopPulse is a modern, streamlined solution designed for auto repair shops and garages to efficiently manage their daily operations. It provides clear visibility into job status, inventory levels, and financial performance.

## 🚀 Key Features

- **Dynamic Dashboard:** Real-time KPIs for jobs today, open jobs, weekly completions, and monthly revenue. 
- **Recent Job Cards:** A clean, organized view of the latest workshop activity with instant status tracking.
- **Automated Workflow:** Jobs automatically move to `COMPLETED` status upon payment processing, reducing manual overhead.
- **Inventory Management:** Centralized part catalog with automated low-stock alerts and "Critical Stock" tracking.
- **Customer & Vehicle Logs:** Comprehensive database of client information and vehicle service history.
- **Role-Based Access:** Secure login for Admins, Secretaries, and Technicians.

## 🛠️ Tech Stack

- **Frontend:** Next.js (App Router), React, Lucide Icons.
- **Backend:** Next.js API Routes, Prisma ORM.
- **Database:** PostgreSQL.
- **Styling:** Vanilla CSS (Modern, Responsive Design).

## 🏁 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- A running PostgreSQL instance

### 2. Installation
```bash
npm install
```

### 3. Database Setup
Configure your `DATABASE_URL` in an `.env` file, then:
```bash
npm run db:push
npm run db:generate
npm run seed
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🔑 Default Admin Credentials

- **Username:** `Project work`
- **Password:** `Ps 123456789`

---
*Developed for efficient workshop management.*
