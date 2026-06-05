# DesignFox PayTrack - POS & Business Workflow Management System

A modern, full-stack POS and business workflow management system designed for service-based companies such as web design agencies, graphic design studios, API development firms, construction services, and digital agencies.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-blue?logo=tailwindcss)
![Prisma](https://img.shields.io/badge/Prisma-5.10-darkblue?logo=prisma)

## Features

### Complete Client Payment Workflow
```
Quotation Approved → Advance Invoice Sent → 50% Payment Received →
Work Starts → Project Completed → Final Invoice Sent →
Balance Payment Received → Final Delivery / Receipt Issued
```

### Core Modules

- **Dashboard** - Business overview with stats, monthly income chart, recent activity
- **Customer Management** - Full CRUD with search, filter, and history tracking
- **Quotation Management** - Create, send, approve/reject quotations with line items
- **Invoice Management** - Advance & final invoices with bank details and payment tracking
- **Payment Tracking** - Record payments, auto-generate receipts, multiple payment methods
- **Project Workflow** - Visual step-by-step timeline with status updates
- **Reports** - Sales, pending payments, completed projects, conversion rates, customer history
- **PDF Generation** - Professional PDFs for quotations, invoices, and receipts
- **User Roles** - Admin, Staff, and Accountant with role-based access control

### Payment Methods Supported
- Cash
- Bank Transfer
- Card
- Online Payment

## Tech Stack

- **Frontend:** Next.js 14, React 18, Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** JWT-based with bcrypt password hashing
- **Charts:** Chart.js with react-chartjs-2
- **PDF:** jsPDF with jspdf-autotable
- **Icons:** React Icons (Feather Icons)

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/designask/DesignFox_PayTrack.git
cd DesignFox_PayTrack
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. Set up the database:
```bash
npx prisma generate
npx prisma migrate dev --name init
```

5. Seed the database with default users:
```bash
npm run db:seed
```

6. Start the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000)

### Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@serviceflow.com | admin123 |
| Staff | staff@serviceflow.com | admin123 |
| Accountant | accountant@serviceflow.com | admin123 |

## User Roles & Permissions

| Feature | Admin | Staff | Accountant |
|---------|-------|-------|------------|
| Dashboard | ✅ | ✅ | ✅ |
| Customers | ✅ | ✅ | ✅ |
| Quotations | ✅ | ✅ | ❌ |
| Invoices | ✅ | ❌ | ✅ |
| Payments | ✅ | ❌ | ✅ |
| Projects | ✅ | ✅ | ❌ |
| Reports | ✅ | ❌ | ✅ |
| Settings | ✅ | ❌ | ❌ |

## Database Schema

- **Users** - Authentication and role management
- **Customers** - Client information and contact details
- **Quotations** - Service quotations with line items
- **QuotationItems** - Individual service line items
- **Invoices** - Advance and final invoices
- **Payments** - Payment records with method and proof
- **Receipts** - Auto-generated payment receipts
- **Projects** - Project tracking linked to quotations
- **ProjectSteps** - Workflow step progress tracking

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project on Vercel
3. Add environment variables
4. Deploy

### Docker (Coming Soon)

Docker support will be added in a future update.

## Environment Variables

| Variable | Description |
|----------|-------------|
| DATABASE_URL | PostgreSQL connection string |
| JWT_SECRET | Secret key for JWT tokens |
| NEXT_PUBLIC_APP_NAME | Application display name |
| NEXT_PUBLIC_COMPANY_NAME | Your company name |
| NEXT_PUBLIC_COMPANY_EMAIL | Company email |
| NEXT_PUBLIC_COMPANY_PHONE | Company phone |
| NEXT_PUBLIC_COMPANY_ADDRESS | Company address |

## License

MIT License

## Author

Built with ❤️ by DesignFox
