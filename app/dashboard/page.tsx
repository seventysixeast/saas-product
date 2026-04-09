import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { SubscribeButton } from '@/components/subscribe-button'
import { LogoutButton } from '@/components/logout-button'
import { Zap, User, CreditCard, CheckCircle2, XCircle, LayoutDashboard } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch subscription from Supabase (RLS filters to user's own row)
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const isActive = subscription?.status === 'active'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Decorative orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 border-b border-slate-800/60 bg-slate-950/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">SaaS Starter</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-400 hidden sm:block">{user.email}</span>
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero greeting */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <LayoutDashboard className="h-8 w-8 text-violet-400" />
            Dashboard
          </h1>
          <p className="text-slate-400 mt-2">Manage your account and subscription</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Account card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800">
                <User className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">Account</h2>
                <p className="text-xs text-slate-500">Your profile details</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-slate-800">
                <span className="text-sm text-slate-400">Email</span>
                <span className="text-sm font-medium text-white">{user.email}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-800">
                <span className="text-sm text-slate-400">User ID</span>
                <span className="text-xs font-mono text-slate-400 truncate max-w-[180px]">{user.id}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-slate-400">Member since</span>
                <span className="text-sm text-slate-300">
                  {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          {/* Subscription card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800">
                <CreditCard className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">Subscription</h2>
                <p className="text-xs text-slate-500">Billing and plan details</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Status</span>
                {isActive ? (
                  <Badge
                    id="subscription-status-active"
                    className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                ) : (
                  <Badge
                    id="subscription-status-inactive"
                    className="bg-slate-700/50 text-slate-400 border border-slate-600/30 hover:bg-slate-700/70"
                  >
                    <XCircle className="h-3 w-3 mr-1" />
                    Inactive
                  </Badge>
                )}
              </div>

              {subscription?.stripe_subscription_id && (
                <div className="flex items-center justify-between py-2 border-t border-slate-800">
                  <span className="text-sm text-slate-400">Subscription ID</span>
                  <span className="text-xs font-mono text-slate-400 truncate max-w-[180px]">
                    {subscription.stripe_subscription_id}
                  </span>
                </div>
              )}

              {!isActive && (
                <div className="pt-4">
                  <div className="rounded-xl bg-gradient-to-br from-violet-600/10 to-indigo-600/10 border border-violet-500/20 p-4 mb-4">
                    <p className="text-sm text-slate-300 font-medium mb-1">Upgrade to Pro</p>
                    <p className="text-xs text-slate-400">
                      Get unlimited access to all features. Cancel anytime.
                    </p>
                  </div>
                  <SubscribeButton />
                </div>
              )}

              {isActive && (
                <div className="pt-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-4">
                  <p className="text-sm text-emerald-400 font-medium">✓ You have full access</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Enjoy all pro features. Manage billing in Stripe.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Features preview */}
        {!isActive && (
          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm p-8">
            <h3 className="text-lg font-semibold text-white mb-6 text-center">What you get with Pro</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { icon: '⚡', title: 'Blazing Fast', desc: 'Optimized infrastructure for peak performance' },
                { icon: '🔒', title: 'Secure by Default', desc: 'Enterprise-grade security and RLS policies' },
                { icon: '📊', title: 'Advanced Analytics', desc: 'Deep insights into your application metrics' },
              ].map((feature) => (
                <div key={feature.title} className="text-center p-4">
                  <div className="text-3xl mb-3">{feature.icon}</div>
                  <h4 className="text-sm font-semibold text-white mb-2">{feature.title}</h4>
                  <p className="text-xs text-slate-400">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
