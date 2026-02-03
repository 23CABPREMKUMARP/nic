# Deployment Guide for Vercel

## 1. Prerequisites
- A GitHub repository with this code.
- A Vercel Account.
- A Clerk Account (for Auth).
- A Postgres Database (Neon, Vercel Postgres, or Supabase). **SQLite (`dev.db`) will NOT work independently on Vercel.**

## 2. Environment Variables
Configure the following in your Vercel Project Settings:

```env
# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Database
# MUST use a connection string to a hosted Postgres database
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
```

> ⚠️ **CRITICAL: Fix for "Missing publishableKey" Error**
> If your build fails with `Error: @clerk/clerk-react: Missing publishableKey`, it means you have NOT added the keys above to Vercel.
> Go to **Settings -> Environment Variables** on Vercel and add them immediately.

## 3. Database Migration
Since Vercel cannot write to the file system, you must run migrations against your remote database before deploying.

1. Update your `.env` locally to point to the **Production Postgres URL**.
2. Run:
   ```bash
   npx prisma db push
   ```
3. This creates the tables in your cloud database.
4. **Important**: Change your local `.env` back to SQLite if you want to continue waiting locally.

## 4. Build Command
Vercel usually detects Next.js automatically.
- Build Command: `next build`
- Output Directory: `.next`

## 5. First Admin Setup
After deployment, the first user to log in will generally be a basic USER.
To promote yourself to ADMIN on the production database:
1. Open your Database Provider's SQL Editor (e.g., Neon Console).
2. Run:
   ```sql
   UPDATE "User" SET role = 'ADMIN' WHERE email = 'your-email@example.com';
   ```
   *(Or use the auto-promotion logic we added in `lib/auth-check.ts` for testing)*

## 6. Troubleshooting
- **500 Errors on API**: Check `DATABASE_URL` connectivity.
- **Hydration Errors**: We've added `suppressHydrationWarning`, but check for browser extension conflicts if they persist locally.
