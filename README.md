# Next.js 14 + Supabase + Stripe SaaS Prototype

A production-ready SaaS starter featuring modern UI, robust authentication, and full-cycle Stripe subscription billing.

This project is built using Next.js 14 (App Router), Tailwind CSS v4, Supabase (SSR authentication & Database), and Stripe Checkout.

---

## 📚 Documentation Index

To help you get started, understand the database design, or deploy the application to production, please refer to the following comprehensive documentation guides under `/docs`:

### 🚀 Getting Started & Operations
- 📦 **[Local Development Setup Guide](file:///e:/76EAST/saas-product/docs/setup.md)**: System prerequisites, cloning the repository, running local database migrations, and connecting Stripe CLI webhook forwarding.
- ⚙️ **[Deployment & Server Config Guide](file:///e:/76EAST/saas-product/docs/deployment.md)**: Step-by-step staging and production setup details for Vercel servers, live Supabase databases, production environment variables, and key rotation.
- 🧪 **[Testing Strategy & Scenarios](file:///e:/76EAST/saas-product/docs/testing.md)**: Manual verification flows for signups, processing test transactions, using Stripe mock cards, and checking webhook payloads.
- 🛠️ **[Troubleshooting Guide](file:///e:/76EAST/saas-product/docs/troubleshooting.md)**: Fixes for webhook signature verification errors, database upsert permission issues, price ID mismatches, and redirect loops.

### 📐 Architecture & Standards
- 🏛️ **[System Architecture Document](file:///e:/76EAST/saas-product/docs/architecture.md)**: Tech stack breakdown, codebase file structure, data flow, and subscription lifecycle mapping.
- 🔑 **[Authentication & Session Guards](file:///e:/76EAST/saas-product/docs/authentication.md)**: Deep dive into Supabase SSR cookie auth, route protection middleware logic, and database helper factories.
- 🗄️ **[Database Schema & RLS Policies](file:///e:/76EAST/saas-product/docs/database.md)**: SQL design, `subscriptions` table columns, Row Level Security (RLS) security models, triggers, and speed index configurations.
- 📡 **[API Endpoint Reference](file:///e:/76EAST/saas-product/docs/api.md)**: Specification for `/api/checkout` and `/api/webhooks/stripe` handlers.
- ✍️ **[Coding Standards & Guidelines](file:///e:/76EAST/saas-product/docs/coding-standards.md)**: Coding conventions, React Server Component guidelines, Tailwind CSS v4 styling standards, and security procedures.

### 🎯 Architecture Decisions (ADRs)
- 📌 **[ADR-001: Supabase SSR for Auth](file:///e:/76EAST/saas-product/docs/decisions/ADR-001.md)**: Architecture decision on choosing native cookie-based Supabase SSR over Auth.js / NextAuth.
- 📌 **[ADR-002: Stripe Checkout Redirect Mode](file:///e:/76EAST/saas-product/docs/decisions/ADR-002.md)**: Architecture decision on using Stripe-hosted Checkout over custom inline Stripe Elements.

---

## 🛠️ Repository Map

```
saas-product/
├── README.md                # Main entry point (This file)
├── CONTRIBUTING.md          # Contribution guidelines
├── CHANGELOG.md             # Version history
├── LICENSE                  # MIT License
├── .env.example             # Example environment configuration
│
├── docs/                    # Technical & operation guides
│   ├── architecture.md      # Architecture overview
│   ├── setup.md             # Local setup guide
│   ├── deployment.md        # Deployment guides (Staging & Prod)
│   ├── api.md               # API endpoints specifications
│   ├── authentication.md    # Auth flow & middleware guards
│   ├── database.md          # DB schema & RLS policies
│   ├── testing.md           # Manual testing strategy
│   ├── troubleshooting.md   # Debugging common issues
│   ├── coding-standards.md  # Coding rules & patterns
│   └── decisions/           # Architecture Decision Records
│         ├── ADR-001.md     # Choice of Supabase SSR
│         └── ADR-002.md     # Choice of Stripe Checkout
│
├── app/                     # Next.js 14 routes and pages
├── components/              # Shared React UI components
├── lib/                     # Client factories and utilities
└── supabase/                # Database migrations
```

---

## ⚡ Quickstart Checklist

If you want a minimal checklist to get the app running right away:
1. Run `npm install`.
2. Copy `.env.local.example` to `.env.local`.
3. Set your Supabase API keys, create a Stripe test product/price, and fill in the secrets.
4. Run `supabase/migrations/001_subscriptions.sql` in your Supabase SQL Editor.
5. In your Supabase project under **Authentication**, disable **Confirm Email**.
6. Run `npm run stripe:listen` to start forwarding Stripe webhook events.
7. Run `npm run dev` to start the local Next.js server.
8. Open `http://localhost:3000` to register a test account and subscribe.
