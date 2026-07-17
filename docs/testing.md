# Testing Strategy & Scenarios

This document explains how to verify auth, database updates, and Stripe billing behavior locally and in staging environments.

---

## 1. Authentication & Onboarding Flow Test

### Goal
Ensure new users can register, receive a default `'inactive'` subscription row, and navigate the app safely.

### Procedure
1. Disable email confirmation in your local Supabase settings (see [authentication.md](file:///e:/76EAST/saas-product/docs/authentication.md)).
2. Open a new Incognito browser window and go to `http://localhost:3000/signup`.
3. Fill in email and password, then click **Sign Up**.
4. Confirm you are instantly logged in and redirected to `http://localhost:3000/dashboard`.
5. Verify the dashboard display:
   - Subscription Status should read: **Inactive**.
   - A **Subscribe** button should be visible.
6. Connect to your database using SQL Editor or Supabase Table Editor:
   - Confirm a row has *not* yet been created in `public.subscriptions` (or reads default state if pre-seeded). The database is queried directly. If no row exists, the UI defaults to "Inactive".

---

## 2. Local Stripe Billing Integration Test

### Goal
Verify that clicking "Subscribe" redirects the user to Stripe Checkout, allows a test purchase, and updates the database via webhooks.

### Prerequisites
- Stripe CLI is running and forwarding to port 3000:
  ```bash
  stripe listen --forward-to localhost:3000/api/webhooks/stripe
  ```
- The printed webhook secret is saved as `STRIPE_CLI_WEBHOOK_SECRET` in `.env.local`, and your Next.js server has been restarted.

### Procedure
1. Navigate to the `/dashboard`.
2. Click **Subscribe**.
3. Confirm you are redirected to the Stripe Checkout page (`https://checkout.stripe.com/...`).
4. Enter test credit card details:
   - **Card Number**: Use `4242 4242 4242 4242` (Stripe standard test card).
   - **Expiry Date**: Any future date (e.g., `12/30`).
   - **CVC**: Any 3 digits (e.g., `123`).
   - **Name**: Any name.
5. Click **Subscribe / Pay**.
6. After processing, confirm you are redirected back to your application:
   - Redirect URL should match: `http://localhost:3000/dashboard?success=true`.
7. Check the Stripe CLI terminal:
   - It should log: `checkout.session.completed` [200 OK].
8. Refresh the `/dashboard` page:
   - Status should change to: **Active**.
   - The Subscription ID should be displayed.
9. Query your database:
   - Check the `subscriptions` table. A row should now exist for the user with `status = 'active'`, containing the `stripe_customer_id` and `stripe_subscription_id`.

---

## 3. Quick Webhook Trigger Verification (No UI)

To test the webhook handler route directly without clicking through the UI:

1. Run the Stripe CLI trigger:
   ```bash
   stripe trigger checkout.session.completed
   ```
2. Check your Next.js terminal logs. You will see:
   - `[Webhook] Event received: checkout.session.completed`
   - *Note: Since the mock CLI trigger does not contain a real user's metadata, the console will print `[Webhook] No supabase_user_id in session metadata` and skip database insertion. This is expected. It verifies signature validation and webhook routing are working.*

---

## 4. Simulating Subscription Lifecycle Events

You can mock user subscription lifecycle changes from the **Stripe Dashboard** (in Test Mode):

### Case A: Simulating Failed Payment (Past Due)
1. Go to **Stripe Dashboard -> Customers** and select your test user.
2. Select their active subscription, click the triple dots, and click **Cancel Subscription -> Immediately**.
3. Check your `stripe listen` terminal:
   - It should intercept `customer.subscription.deleted`.
4. Refresh your Next.js app dashboard:
   - The subscription status should display: **Canceled** (or **Inactive** depending on client state).
   - The database status column for this user should update to `'canceled'`.

### Case B: Simulating Subscription Upgrades
1. Go to **Stripe Dashboard -> Subscriptions**.
2. Edit the subscription and change the price tier.
3. Stripe CLI logs: `customer.subscription.updated`.
4. The database row updates `status` to reflect the new state.
