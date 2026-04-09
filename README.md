# Next.js 14 + Supabase + Stripe SaaS Prototype

A production-ready SaaS starter featuring modern UI, robust authentication, and full-cycle Stripe subscription billing.

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS v4 & shadcn/ui
- **Auth & Database**: Supabase (via SSR cookies)
- **Billing**: Stripe (Checkout mode: subscription + Webhooks)

## Prerequisites
- Node.js 18+
- [Supabase CLI](https://supabase.com/docs/guides/cli) or a hosted Supabase project.
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
- A Stripe account (in test mode).

## Setup Instructions

### 1. Project Initialization
Clone the repository and install dependencies:
```bash
npm install
```

### 2. Environment Variables
Copy `.env.local.example` to `.env.local`:
```bash
cp .env.local.example .env.local
```
Fill in the variable values using the steps below.

### 3. Supabase Configuration
If using a hosted remote project:
1. Copy the **URL** and **anon key** to `.env.local` as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
2. Copy the **service_role key** to `SUPABASE_SERVICE_ROLE_KEY`.
3. In the Supabase Dashboard, navigate to **SQL Editor** and run the contents of [`supabase/migrations/001_subscriptions.sql`](./supabase/migrations/001_subscriptions.sql) to create the table and RLS policies.
4. **Important**: Go to **Authentication -> Email Templates** and *disable* "Confirm Email" for a smoother local onboarding experience (or verify your sign-up emails if left on).

### 4. Stripe Configuration
1. In the Stripe Dashboard (Test Mode), create a new **Product** and **Pricing** plan (Recurring).
2. Grab the Pricing ID (looks like `price_1Nxyz...`) and place it in `.env.local` under `STRIPE_PRICE_ID`.
3. Grab your Secret Key (`sk_test_...`) and Publishable Key (`pk_test_...`) and update `.env.local`.

### 5. Webhooks Setup
To process local subscription events, set up Stripe CLI to forward webhooks to your local server:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```
In the terminal output, Stripe CLI will reveal a webhook signing secret (looks like `whsec_...`). Copy this into `STRIPE_WEBHOOK_SECRET` in `.env.local`.

### 6. Run the App
Start your development server:
```bash
npm run dev
```

Navigate to `http://localhost:3000`. You will be redirected to the login/signup page.

## Prototype Testing Flow
1. Create a new account at `/signup`.
2. Check your beautiful Dashboard. It should indicate an "Inactive" subscription status.
3. Click **Subscribe**. You will be redirected to the Stripe Checkout page.
4. Use a Stripe test card (e.g., `4242 4242 4242 4242`) and dummy details to checkout.
5. After payment, you are redirected back to the Dashboard.
6. Check your terminal running `stripe listen` — it should register the `checkout.session.completed` event.
7. The Dashboard should now display your status as **Active** with your subscription ID.

## Architecture Highlights
- Uses **Supabase SSR** with route-protection middleware for true server-rendered authentication guards.
- Fully compatible with **Tailwind CSS v4**'s new syntax and theme variables structure.
- Designed with premium glass-morphism aesthetic cards, dark layout variants, and animated transitions leveraging **shadcn/ui**.
- Stripe Webhook handler validates signatures robustly and is fully compliant with the latest **Stripe Node SDK version 22+**.
