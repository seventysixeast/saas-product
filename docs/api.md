# API Endpoint Documentation

This document describes the HTTP endpoints exposed by the Next.js backend API routes to integrate Stripe Checkout and process webhooks.

---

## 1. Stripe Checkout Session Creator

Create a redirect session to initiate user payment onboarding.

- **Endpoint**: `/api/checkout`
- **Method**: `POST`
- **Authentication Required**: Yes (Bearer/Supabase Cookie Auth)
- **Headers**:
  - `Content-Type: application/json`
  - Cookie headers containing user session tokens.

### Request Body
No request parameters are required. The endpoint resolves the active user's identity automatically via Supabase Server Client `auth.getUser()`.

### Success Response
- **Status Code**: `200 OK`
- **Content-Type**: `application/json`
- **Body**:
  ```json
  {
    "url": "https://checkout.stripe.com/c/pay/cs_test_a1b2c3..."
  }
  ```
  *Note: The frontend must redirect the user to this URL.*

### Error Responses
- **Status Code**: `401 Unauthorized` (If user is not logged in or session expired)
  ```json
  {
    "error": "Unauthorized"
  }
  ```
- **Status Code**: `500 Internal Server Error` (If Stripe or Supabase calls fail)
  ```json
  {
    "error": "Internal server error"
  }
  ```

---

## 2. Stripe Webhook Listener

Receive event updates asynchronously from Stripe for subscription state tracking.

- **Endpoint**: `/api/webhooks/stripe`
- **Method**: `POST`
- **Authentication Required**: No (Verified via Stripe Event Signature)
- **Headers**:
  - `stripe-signature`: A cryptographic token verifying that Stripe sent the payload.

### Raw Body Payload
Must receive the raw unparsed text content representing the Stripe Event payload to construct/verify the signature.

### Signature Verification Process
We verify incoming event signatures using Stripe SDK `stripe.webhooks.constructEvent()` combined with `STRIPE_WEBHOOK_SECRET` (or `STRIPE_CLI_WEBHOOK_SECRET` during local testing).

```typescript
const body = await request.text();
const signature = request.headers.get('stripe-signature');
const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
```

### Event Handlers Implemented

#### `checkout.session.completed`
- **Trigger**: Stripe Checkout payment completes.
- **Handling**:
  1. Verifies that `session.mode` is `'subscription'`.
  2. Extracts the `supabase_user_id` custom key from the session's metadata.
  3. Uses the **Supabase Service Role Client** to upsert the subscription status as `active` in the DB:
     ```typescript
     supabase.from('subscriptions').upsert({
       user_id: supabaseUserId,
       stripe_customer_id: session.customer,
       stripe_subscription_id: session.subscription,
       stripe_price_id: process.env.STRIPE_PRICE_ID,
       status: 'active',
     })
     ```

#### `customer.subscription.updated`
- **Trigger**: Subscription details change (e.g. invoice payment clears, billing period rolls, subscription moves from trialing to active, status becomes past due).
- **Handling**:
  - Updates the corresponding database row status matching `stripe_subscription_id` to `subscription.status`.

#### `customer.subscription.deleted`
- **Trigger**: Subscription is canceled or fully deleted by Stripe.
- **Handling**:
  - Updates the corresponding database row status to `canceled` matching `stripe_subscription_id`.

### Response Codes
- **Status Code**: `200 OK`
  - Body: `{"received": true}` (Stripe expects a 2xx response promptly to avoid retrying webhooks).
- **Status Code**: `400 Bad Request`
  - Body: `{"error": "Missing stripe-signature header"}` or `{"error": "Invalid signature"}` (Failed to construct event).
- **Status Code**: `500 Internal Server Error`
  - Body: `{"error": "Webhook secret is not configured"}` or `{"error": "Database error"}` (Internal setup or Supabase write failures).
