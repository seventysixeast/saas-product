# Authentication Flow & Session Guarding

The application uses **Supabase SSR (Server-Side Rendering)** for user signups, logins, and session persistence. Sessions are stored in secure cookies, allowing the Next.js server to read auth states before rendering pages, eliminating visual content flashes on page load.

---

## 1. Authentication Architecture

The core of our authentication rests on cookies synchronized between the browser and Next.js:

```
[ Browser Client ]  ---(1) Send Credentials / OAuth --->  [ Supabase Auth Server ]
[ Browser Client ]  <---(2) Issue JWT Tokens / Cookie --  [ Supabase Auth Server ]

                        === Subsequent Requests ===

[ Browser Client ]  ---(3) Request /dashboard (with Cookie) ---> [ Next.js Middleware ]
                                                                      |
                                                               (4) Refresh Session?
                                                                      |
                                                                      v
[ Browser Client ]  <---(5) Redirect / Render dashboard <-------- [ Next.js Server ]
```

1. **Authentication Cookie**: All session details (access token, refresh token) are stored directly inside cookies managed by `@supabase/ssr`.
2. **Token Refreshing**: When a user accesses the site, Next.js Middleware intercepts the request, calls Supabase client's `getUser()` method, and refreshes the auth tokens if they are close to expiration.

---

## 2. Server-Side Routing Guards (Middleware)

Session checks are centralized inside [middleware.ts](file:///e:/76EAST/saas-product/middleware.ts) and [lib/supabase/middleware.ts](file:///e:/76EAST/saas-product/lib/supabase/middleware.ts).

### How It Works:
Every incoming page request flows through `updateSession(request: NextRequest)`:
```typescript
const { data: { user } } = await supabase.auth.getUser()
```
*Note: We use `getUser()` instead of `getSession()`, as `getUser()` is a secure server-side call that verifies the authenticity of the JWT with the Supabase authentication server.*

### Protection Logic:
1. **Protected Routes (`/dashboard*`)**:
   - If `user` is **null**, the request is redirected to `/login`.
   - Ensures only authenticated users can see application dashboards or fire checkout API requests.
2. **Auth Page Redirects (`/login`, `/signup`)**:
   - If `user` is **present**, the request is redirected to `/dashboard`.
   - Prevents already logged-in users from seeing login forms again.

---

## 3. Instantiating Supabase Clients

We use three helper models to create Supabase clients based on the execution context:

### A. Server Component Client (Read/Write cookies)
Used inside Server Routes, Layouts, and API Route Handlers.
- **Location**: [lib/supabase/server.ts](file:///e:/76EAST/saas-product/lib/supabase/server.ts) -> `createClient()`
- **Access**: Uses the client's cookie store to read, write, and persist session cookies.
- **Permissions**: Respects RLS.

### B. Client Component Client (Browser Environment)
Used inside React client files (marked with `'use client'`) to submit forms or check session state inside the browser.
- **Location**: [lib/supabase/client.ts](file:///e:/76EAST/saas-product/lib/supabase/client.ts) -> `createClient()`
- **Access**: Reads credentials directly from public browser cookies.
- **Permissions**: Respects RLS.

### C. Service Role Client (Bypasses RLS)
Only used in secure server environments like Webhooks where we need root-level access.
- **Location**: [lib/supabase/server.ts](file:///e:/76EAST/saas-product/lib/supabase/server.ts) -> `createServiceClient()`
- **Secret**: Uses `SUPABASE_SERVICE_ROLE_KEY`.
- **Permissions**: Bypasses all Row Level Security. **Never expose this client to the client browser!**

---

## 4. Disabling Email Confirmation in Local Environments

During local testing, receiving signup confirmation links can slow down verification:
1. In your **Supabase Dashboard**, go to **Authentication -> Providers -> Email**.
2. Set **Confirm Email** to **Off**.
3. Users created on `/signup` will be instantly logged in and redirected to the dashboard.
4. Remember to **re-enable** email confirmation in Production to block fake registrations.
