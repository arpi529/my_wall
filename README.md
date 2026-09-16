# Cute Photo Wall

A React + Vite photo wall backed by Supabase Storage, PostgreSQL, and Realtime.

## Run locally

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local`.
3. Fill in `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_ADMIN_USERNAME`, and `VITE_ADMIN_PASSWORD`.
4. Run `supabase/schema.sql` in the Supabase SQL Editor.
5. Start the app with `npm run dev`.

The user page is `/`. Admin login is `/admin/login`, followed by `/admin`.

## Supabase setup

The SQL creates `submissions` with `name`, `message`, `image_url`, `image_path`, and `created_at`, enables Realtime, creates a public `photos` bucket, and adds the required policies. Never put a Supabase service-role key in the frontend.

## Security note

This requested version uses a simple frontend session and environment-provided credentials instead of Supabase Auth. It is suitable for a private prototype, but browser credentials and broad anon write/delete policies are not truly secret. For public deployment, move credential checking and privileged mutations behind a server or edge function, then tighten RLS and storage policies.

## Deploy with Vercel

1. Push the `vite-project` folder to a GitHub repository.
2. Go to [vercel.com](https://vercel.com), sign in with GitHub, and click **Add New Project**.
3. Import the repository. If the repository contains the outer workspace folder, set **Root Directory** to `vite-project`.
4. Vercel should detect Vite automatically. Keep the build command as `npm run build` and the output directory as `dist`.
5. Add these Environment Variables in Vercel:

	- `VITE_SUPABASE_URL`
	- `VITE_SUPABASE_PUBLISHABLE_KEY`
	- `VITE_ADMIN_USERNAME`
	- `VITE_ADMIN_PASSWORD`

6. Click **Deploy**. The included `vercel.json` keeps `/admin` and `/admin/login` working on direct visits.
7. After deployment, add the Vercel URL to Supabase **Authentication → URL Configuration** only if you later add Supabase Auth. This project does not use Supabase Auth.
