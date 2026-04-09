import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2026-03-25.dahlia' as const,
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

// Must be force-dynamic and use raw body for signature verification
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Read raw body as text for Stripe signature verification
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('[Webhook] Signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    console.log(`[Webhook] Event received: ${event.type}`)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.mode !== 'subscription') break

        const supabaseUserId = session.metadata?.supabase_user_id

        if (!supabaseUserId) {
          console.error('[Webhook] No supabase_user_id in session metadata')
          break
        }

        const subscriptionId = session.subscription as string

        const supabase = createServiceClient()

        // Upsert subscription record (uses service role to bypass RLS)
        const { error } = await supabase
          .from('subscriptions')
          .upsert(
            {
              user_id: supabaseUserId,
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: subscriptionId,
              stripe_price_id: process.env.STRIPE_PRICE_ID ?? null,
              status: 'active',
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: 'user_id',
            }
          )

        if (error) {
          console.error('[Webhook] Failed to upsert subscription:', error)
          return NextResponse.json({ error: 'Database error' }, { status: 500 })
        }

        console.log(`[Webhook] Subscription activated for user: ${supabaseUserId}`)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription

        const supabase = createServiceClient()
        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: subscription.status,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)

        if (error) console.error('[Webhook] Failed to update subscription:', error)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        const supabase = createServiceClient()
        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)

        if (error) console.error('[Webhook] Failed to cancel subscription:', error)
        break
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[Webhook] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
