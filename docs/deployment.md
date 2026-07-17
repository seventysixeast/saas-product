# Deployment & Server Configuration Guide

This document provides setup procedures and environment configurations for deploying the SaaS product to **Staging** and **Production** environments.

---

## Deployment Architecture

The application is deployed across three services:
1. **Frontend/Backend Server**: Vercel (Next.js server-side rendering + api routes).
2. **Database & Authentication**: Supabase (PostgreSQL database, authentication server, and RLS guards).
3. **Billing System**: Stripe (Stripe hosted Checkout + webhook triggers).

```
   [ Client Browser ]
      |        ^
      | Auth   | SSR & Pages
      v        |
  [Supabase] <---> [ Vercel Server ]
                     |          ^
                     | Checkout | Webhooks
                     v          |
                  [ Stripe Gateway ]
```

---

## 1. Staging Server Setup

The Staging environment behaves identically to production but uses **Supabase Sandbox/Staging** project and **Stripe Test Mode** with dummy credentials.

### Supabase Staging Setup
1. Create a separate Supabase project for Staging (e.g., `saas-product-staging`).
2. Apply the schema migration:
   - Navigate to the Supabase Dashboard SQL Editor for the staging project.
   - Paste the SQL script from [001_subscriptions.sql](file:///e:/76EAST/saas-product/supabase/migrations/001_subscriptions.sql) and execute it.
3. Keep Email Confirmations *enabled* in Staging to test real email signup and onboarding flows.
4. Copy the Staging API URL, Anon Key, and Service Role Key.

### Stripe Staging Setup
1. Use Stripe in **Test Mode**.
2. Set up the Stripe Product and Subscription Price if not already done. Copy the Price ID (`price_...`).
3. Set up a Webhook endpoint in Stripe Developers:
   - Go to **Developers -> Webhooks -> Add Endpoint**.
   - Set the URL to: `https://your-staging-vercel-app.vercel.app/api/webhooks/stripe`.
   - Select the following events:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
   - Copy the Webhook Signing Secret (`whsec_...`).

### Vercel Staging Deployment
1. Import your GitHub repository into Vercel.
2. Link the repository's `staging` branch (or configure automatic deployments for feature branches).
3. Add the following **Environment Variables** in Vercel under Project Settings (scope them to the **Preview/Staging** environment):

| Variable Name | Staging Value Description |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Staging Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Staging Supabase Anon Key |
| `SUPABASE_SERVICE_ROLE_KEY` | Staging Supabase Service Role Key |
| `STRIPE_SECRET_KEY` | Staging Stripe Secret Key (`sk_test_...`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Staging Stripe Publishable Key (`pk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | Staging Webhook Secret (`whsec_...`) |
| `STRIPE_PRICE_ID` | Staging Price ID (`price_...`) |
| `NEXT_PUBLIC_BASE_URL` | Staging Vercel URL (e.g. `https://staging.yourdomain.com`) |

4. Trigger a deployment. Vercel will build the Next.js app and serve it.

---

## 2. Production Server Setup

The Production environment uses your live business accounts, live databases, and live billing.

### Supabase Production Setup
1. Create your Production Supabase project (e.g., `saas-product-prod`).
2. Run database migrations:
   - Go to the SQL Editor.
   - Run the SQL queries from [001_subscriptions.sql](file:///e:/76EAST/saas-product/supabase/migrations/001_subscriptions.sql).
3. Configure authentication:
   - Go to **Authentication -> Email Templates**. Customize the verification and reset emails for your brand.
   - Set up your custom SMTP server (such as SendGrid or Resend) to avoid Supabase default rate limits.
4. Copy the API URL, Anon Key, and Service Role Key (securely save these).

### Stripe Production Setup
1. Toggle **Test Mode** to **Live Mode** in your Stripe Dashboard.
2. Re-create your Product catalog and subscription pricing under **Products**.
   - Copy the Live Price ID (`price_...`).
3. Set up your Live Webhook endpoint under **Developers -> Webhooks**:
   - URL: `https://your-production-app.com/api/webhooks/stripe`.
   - Add the same events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.
   - Copy the Live Webhook Signing Secret (`whsec_...`).
4. Set up Customer Portal settings in Stripe if you want users to manage billing details.

### Vercel Production Deployment
1. Link your GitHub repository's `main` branch to the production environment.
2. In Vercel Project Settings, add the environment variables scoped to **Production**:

| Variable Name | Production Value Description |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Production Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production Supabase Anon Key |
| `SUPABASE_SERVICE_ROLE_KEY` | Production Supabase Service Role Key |
| `STRIPE_SECRET_KEY` | Production Stripe Secret Key (`sk_live_...`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Production Stripe Publishable Key (`pk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | Production Webhook Secret (`whsec_...`) |
| `STRIPE_PRICE_ID` | Production Price ID (`price_...`) |
| `NEXT_PUBLIC_BASE_URL` | Live Production URL (e.g. `https://your-production-app.com`) |

3. Trigger a production release by merging code to `main`.

---

## 3. Secrets Management & Rotation

### Guidelines
- **Zero Raw Secrets in Source Control**: Never check in any keys. The `.env` and `.env.local` files are ignored via `.gitignore`.
- **API Key Rotation**:
  - If a Stripe secret key is compromised, generate a new one in Stripe and update Vercel env variables instantly. Re-deploying is not required in Next.js when updating runtime server environment variables on Vercel, but restarting the deployment is recommended to clear cache.
  - If a Supabase Service Role key is leaked, rotate it immediately in **Project Settings -> API** in the Supabase Dashboard and update Vercel. A leaked service role key bypasses database RLS and allows full data reads/writes!
