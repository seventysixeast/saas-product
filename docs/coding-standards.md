# Coding Standards & Guidelines

This document outlines the coding style, language features, frameworks, and component design patterns enforced across the SaaS codebase.

---

## 1. General Principles

- **Safety & Typing**: Avoid using type `any`. Leverage TypeScript's compiler settings to capture errors before runtime.
- **Explicit Contexts**: Keep server actions, components, and client components clean and segregated.
- **Security First**: Never pass raw user inputs to PostgreSQL without checks or run database operations that bypass RLS unless in authenticated admin routes/webhooks.

---

## 2. Next.js 14 App Router Standards

- **Server Components by Default**: All components inside the `app` directory are React Server Components (RSC) by default. Keep them as Server Components to reduce client bundle sizes and optimize SEO.
- **Client Components (`'use client'`)**: Only add the `'use client'` directive at the top of files that:
  - Use React state hook APIs (`useState`, `useEffect`, `useReducer`, `useContext`).
  - Listen to browser-level events (clicks, scrolls, typing handlers).
  - Use router-based client hooks (such as `useSearchParams` or `useRouter` from `next/navigation`).
- **Data Fetching**: Fetch database data directly inside Server Components (using `createClient()`) instead of exposing intermediate API routes, unless requested by client action handlers (like the Stripe Checkout post route).

---

## 3. Styling & Custom Theme (Tailwind CSS v4)

- **Tailwind CSS v4 Standard**:
  - Tailwind v4 replaces the `tailwind.config.js` model with CSS-based settings. Theme settings are defined inside [app/globals.css](file:///e:/76EAST/saas-product/app/globals.css) using CSS `@theme` variables.
- **Class Merging**:
  - Always wrap class declarations that accept custom className props using `cn(...)` from [lib/utils.ts](file:///e:/76EAST/saas-product/lib/utils.ts):
    ```typescript
    import { cn } from "@/lib/utils"
    
    export function CustomCard({ className, ...props }) {
      return <div className={cn("rounded-lg bg-card text-card-foreground shadow-sm", className)} {...props} />
    }
    ```
- **Design System Consistency**: Use standard semantic colors (e.g. `bg-background`, `text-foreground`, `bg-primary`, `border-border`) rather than hardcoded hex classes (e.g. `bg-[#030712]`) to preserve dark mode and palette integrity.

---

## 4. Supabase Client Usage Guidelines

To prevent authentication state leaks or privilege escalation:
1. **API / Server Context**: Always use `createClient()` from `@/lib/supabase/server` for API routes and Server Components.
2. **Client Components**: Always use `createClient()` from `@/lib/supabase/client` inside components containing `'use client'`.
3. **Bypassing RLS**: The `createServiceClient()` client (using the service role key) must *only* be called in backend files (e.g., `/api/webhooks/stripe/route.ts`). Never export it, instantiate it in client code, or use it outside of verified automated routes.

---

## 5. Stripe Integration Standards

- **Signature Verification**: Every webhook endpoint must parse the incoming request to raw text and verify the `stripe-signature` header before handling events.
- **API Version Locking**: Ensure the Stripe SDK matches the designated API version. In our routes, we pin this to:
  ```typescript
  apiVersion: '2026-03-25.dahlia' as const
  ```
- **Error Boundaries**: Wrap Stripe API calls (e.g., `stripe.checkout.sessions.create`) in robust `try/catch` blocks and log descriptive tags like `[Checkout Error]` to stdout.
