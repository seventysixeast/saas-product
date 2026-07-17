# Local Development Setup Guide

This document describes how to set up the Next.js, Supabase, and Stripe SaaS project on your local machine for development.

## Prerequisites

Ensure you have the following software installed:
- **Node.js**: Version 18+ (Node 24 recommended).
- **npm**: Version 9+ (comes with Node.js).
- **Supabase CLI**: Required if you wish to run Supabase locally or link to a remote project. [Installation instructions](https://supabase.com/docs/guides/cli).
- **Stripe CLI**: Required to forward webhooks to your local server. [Installation instructions](https://stripe.com/docs/stripe-cli).
- **Git**: For version control.

---

## Step 1: Clone the Repository

Clone the project repository to your workspace and navigate into it:
```bash
git clone <repository-url>
cd saas-product
```

Install the dependencies:
```bash
npm install
```

---

## Step 2: Set Up Environment Variables

Create your local environment configuration file:
```bash
cp .env.local.example .env.local
```

Open `.env.local` in your text editor. You will populate the values in the subsequent steps.

---

## Step 3: Configure Supabase

You can set up Supabase in two ways: using a **hosted remote project** (recommended for ease of setup) or a **local development database** via Docker.

### Option A: Hosted Remote Supabase Project (Recommended)
1. Go to [supabase.com](https://supabase.com) and create a new project.
2. In the Supabase Dashboard, navigate to **Project Settings -> API** and copy:
   - **Project URL** -> `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** -> `SUPABASE_SERVICE_ROLE_KEY`
3. Navigate to **SQL Editor**, create a new query, paste the content of [001_subscriptions.sql](file:///e:/76EAST/saas-product/supabase/migrations/001_subscriptions.sql), and run it. This will create the `subscriptions` table and associated RLS policies.
4. **Smooth Local Authentication**: Go to **Authentication -> Providers -> Email**, and disable "Confirm Email". This permits testing sign-ups instantly without real email verification.

### Option B: Local Supabase CLI Setup
1. Make sure Docker is running on your machine.
2. Initialize Supabase:
   ```bash
   supabase init
   ```
3. Start the local Supabase stack:
   ```bash
   supabase start
   ```
4. Once started, the CLI will output several keys. Copy the `API URL`, `anon key`, and `service_role key` into your `.env.local` file.
5. Apply the migration:
   ```bash
   supabase db reset
   ```
   *(Assuming the migration file is stored in `supabase/migrations/001_subscriptions.sql`)*

---

## Step 4: Configure Stripe

Stripe handles subscription checkout and subscription state changes. You need a Stripe account in **Test Mode**.

1. **API Keys**: In your Stripe Dashboard, go to **Developers -> API keys**:
   - Copy the **Publishable key** -> `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - Copy the **Secret key** -> `STRIPE_SECRET_KEY`
2. **Product Configuration**: Go to **Product Catalog -> Add Product**:
   - Create a product (e.g. "Pro Subscription").
   - Set the billing model to **Recurring** and choose a price (e.g., $15.00 / month).
   - Save the product.
   - Copy the **Pricing ID** (starts with `price_...`, e.g., `price_1Nxyz...`) -> `STRIPE_PRICE_ID`
3. Add these credentials to `.env.local`.

---

## Step 5: Start Local Stripe CLI Webhook Forwarding

Since Stripe needs to notify our local Next.js server of payment status changes, you must forward webhook events locally.

1. Authenticate the Stripe CLI with your account:
   ```bash
   stripe login
   ```
2. Start the local webhook forwarding:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
   *(Or run the npm shorthand: `npm run stripe:listen`)*
3. The terminal will print a webhook signing secret (starts with `whsec_...`). Copy this key:
   - Save it as `STRIPE_CLI_WEBHOOK_SECRET` in `.env.local`.
4. Keep this terminal open while testing. If you restart `stripe listen`, a new `whsec_` secret might be generated, requiring you to update `.env.local` and restart the Next.js server.

---

## Step 6: Start Next.js Development Server

With all env variables configured in `.env.local`, run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your web browser. You will be redirected to the sign-up page to begin testing.
