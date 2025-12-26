# Spending Control

Multi-tenant financial control SaaS for monthly budget management with manual transaction entry.

## Features

- 🏠 **Multi-tenant workspaces** - Invite family members with role-based access (Admin, Editor, Viewer)
- 📊 **Budget by groups** - Divide income into percentage-based groups (Essentials, Lifestyle, Investments)
- 💰 **Manual transactions** - Track income and expenses without bank integration
- 🎯 **Goals (Little Boxes)** - Save for specific objectives with progress tracking
- 💳 **Installments** - Manage recurring payments from credit card purchases
- 🌐 **Multi-language** - Portuguese (BR), Spanish, English (US/UK)
- 💱 **Multi-currency** - BRL, USD, EUR, GBP, ARS, MXN

## Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: TailwindCSS + shadcn/ui
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js (Auth.js) with credentials provider
- **Validation**: Zod
- **Charts**: Recharts
- **i18n**: next-intl

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database (local or cloud: Supabase, Neon, Railway)

### Setup

1. **Clone and install dependencies**

```bash
git clone <repo-url>
cd spending-control
npm install
```

2. **Configure environment variables**

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/spending_control"
AUTH_SECRET="your-secret-key-here"
AUTH_URL="http://localhost:3000"
```

3. **Set up database**

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

4. **Start development server**

```bash
npm run dev
```

5. **Open** [http://localhost:3000](http://localhost:3000)

### Demo Credentials

After seeding:
- **Email**: demo@example.com
- **Password**: password123

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/             # Login, Register pages
│   ├── (onboarding)/       # Onboarding wizard
│   └── app/[workspaceId]/  # Protected app pages
├── components/             # React components
│   ├── ui/                 # shadcn/ui components
│   ├── layout/             # Sidebar, Header
│   ├── dashboard/          # Summary cards, charts
│   └── ...                 # Feature components
├── domain/                 # Business logic services
├── lib/                    # Utilities (date, currency, auth)
├── server/                 # Server actions & access control
├── types/                  # TypeScript definitions
└── messages/               # i18n translation files
```

## Key Concepts

### Budget Groups & Percentages

Users divide their income into groups (e.g., 50% Essentials, 30% Lifestyle, 20% Investments). Monthly snapshots preserve history - changing percentages doesn't affect past months.

### Monthly Budget Plan

When accessing a month for the first time, the system creates a snapshot of current percentages. This ensures historical data integrity.

### Multi-tenant Scoping

All data is scoped by `workspaceId`. Every query includes workspace validation through the access control layer.

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repo to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy

### Docker

```bash
docker build -t spending-control .
docker run -p 3000:3000 --env-file .env spending-control
```

## Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint
npx prisma studio    # Database GUI
npx prisma db seed   # Run seed
```

## License

MIT
