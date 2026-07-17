# System Architecture Document

This document outlines the technical architecture, directory structure, data flows, and design decisions for the Next.js 14 + Supabase + Stripe SaaS Prototype.

---

## 1. Technical Stack

The prototype leverages a modern, highly performant stack:
- **Framework**: Next.js 14 (using App Router for layouts, server components, and dynamic route handlers).
- **Authentication**: Supabase SSR Auth, managing stateful session storage using cookies.
- **Database**: Supabase PostgreSQL database with Row Level Security (RLS) configured.
- **Billing Provider**: Stripe Checkout (prebuilt payment page) and Stripe Webhooks.
- **UI & Styling**: Tailwind CSS v4 for optimized builds, combined with shadcn/ui primitives.

---

## 2. Codebase Directory Structure

Below is an overview of the key folders and files in the repository:

```
saas-product/
├── .env.example             # Template environment variables
├── README.md                # Entry point docs and quickstart
├── package.json             # Scripts and npm dependencies
├── tsconfig.json            # TypeScript configuration
├── middleware.ts            # Next.js global route guard interceptor
│
├── app/                     # Next.js 14 App Router
│   ├── layout.tsx           # Base HTML shell and global fonts
│   ├── page.tsx             # Root page (marketing/login redirect)
│   ├── globals.css          # Styling rules & Tailwind v4 imports
│   ├── (auth)/              # Route group for auth flow
│   │   ├── layout.tsx       # Glassmorphism container for forms
│   │   ├── login/           # User sign-in page
│   │   └── signup/          # User registration page
│   ├── dashboard/           # Authenticated user dashboard
│   │   ├── layout.tsx       # Protected shell layout
│   │   └── page.tsx         # Dashboard page showing subscription status
│   └── api/                 # Backend API Route Handlers
│       ├── checkout/        # Stripe Checkout session creator
│       └── webhooks/stripe/ # Stripe event receiver
│
├── components/              # Shared application UI components
│   ├── logout-button.tsx    # Button to end user session
│   ├── subscribe-button.tsx # Button triggers Stripe checkout session
│   └── ui/                  # shadcn reusable visual primitives (card, button, etc.)
│
├── lib/                     # Config helpers and utilities
│   ├── utils.ts             # Tailwind merging helper
│   └── supabase/            # Client factories for Server/Client contexts
│
└── supabase/                # Database migrations & schemas
    └── migrations/          # SQL scripts to apply to the database
```

---

## 3. Subscription Lifecycle & Data Flow

Our system uses an event-driven design to sync Stripe subscriptions with Supabase records:

```
[User signup/login] 
       |
       v
[User Dashboard] (Reads state from public.subscriptions table)
       |
       +---> [If Subscription Inactive] ---> Clicks "Subscribe"
                                                   |
                                                   v
                                        Calls POST `/api/checkout`
                                                   |
                                                   v
                                    Stripe Checkout Page Redirect
                                                   |
                                                   v
                                        Completes Payment (Card)
                                                   |
                                                   v
                                  Stripe fires Webhook Event
                                                   |
                                                   v
                                    POST `/api/webhooks/stripe`
                                                   |
                                                   v
                                 Upsert Status as "active" in DB
                                                   |
                                                   v
                               [User redirects to Dashboard]
```

### Event Mapping & DB Syncing
Stripe events map directly to changes in our PostgreSQL database:

| Stripe Event | DB Action | Resulting Subscription Status |
| :--- | :--- | :--- |
| `checkout.session.completed` | Insert or Update (Upsert) | `active` |
| `customer.subscription.updated` | Update by subscription ID | `active` / `past_due` / `trialing` |
| `customer.subscription.deleted` | Update by subscription ID | `canceled` |

---

## 4. Key Architectural Decisions

1. **Server-Side Auth Guards**: Rather than verifying auth on the client-side (resulting in visual layout shifts), we verify user sessions in Next.js Server middleware before transmitting HTML down to the client.
2. **Stripe Checkout Integration**: To minimize PCI compliance overhead and design complexity, we offload all subscription payment details to Stripe Checkout, relying on Stripe Webhooks for asynchronous database updates.
3. **Database RLS Policies**: Database rows are protected at the database level. Even if a bug allows a user to access other dashboards, PostgreSQL blocks database access unless the database credentials match `auth.uid() = user_id`.
