# How to Set Up a Postgres Database on Neon (Free Tier)

Neon is a serverless Postgres provider that gives you a generous free tier, perfect for this project.

## 1. Sign Up
1.  Go to **[neon.tech](https://neon.tech/)**.
2.  Click **Sign Up** (You can use your GitHub or Google account).

## 2. Create a Project
1.  Once logged in, you will be taken to the Console.
2.  Click **"New Project"**.
3.  **Name**: `nic-epass` (or anything you like).
4.  **Region**: Select the region closest to your users (e.g., `Singapore` for India).
5.  **Postgres Version**: Default (e.g., v16) is fine.
6.  Click **Create Project**.

## 3. Get Connection String
1.  After creation, you will see a **"Connection Details"** dashboard.
2.  Look for the **Connection String** box.
3.  Select **"Prisma"** from the dropdown menu (if available) or just stick to the default `postgres://...` format.
4.  Click the **"Copy"** button to copy user/password/host string.
    *   *It should look like:* `postgresql://neondb_owner:AbCdEf123@ep-cool-glade.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`

## 4. Connect Locally (Development)
1.  Open your local project folder in VS Code.
2.  Open the `.env` file.
3.  Replace the existing SQLite line with your new Neon URL:
    ```env
    # DELETE: DATABASE_URL="file:./dev.db"
    # ADD THIS:
    DATABASE_URL="postgresql://neondb_owner:.....@.....neon.tech/neondb?sslmode=require"
    ```
4.  **Sync the Database**:
    Now, push your local schema to the new empty cloud database:
    ```bash
    npx prisma db push
    ```
    *(If successful, it will say "Your database is now in sync with your Prisma schema")*

## 5. Connect Production (Vercel)
1.  Go to your **Vercel Project Dashboard**.
2.  Navigate to **Settings -> Environment Variables**.
3.  Use the **Same Neon URL** you pushed to `.env`.
    *   **Key**: `DATABASE_URL`
    *   **Value**: `postgresql://neondb_owner:.....`
4.  Save and **Redeploy** your project.

---

### 🎉 You are done!
Your app is now running on a powerful cloud database accessible from anywhere.
