 # Photo Wall

 A small React app where people can upload a photo and a short message. An admin dashboard lets you search, sort, review, and delete submissions in real time.

 ## Features

 - Upload JPG, PNG, or WebP images up to 5 MB
 - Add a name and message to each photo
 - Take a photo directly from supported mobile devices
 - Admin dashboard at `/admin`
 - Search and sort submissions
 - Realtime submission updates through Supabase
 - Netlify and Vercel SPA deployment configuration included

 ## Requirements

 - Node.js 18 or newer
 - A Supabase project

 ## Local setup

 1. Install dependencies:

	 ```bash
	 npm install
	 ```

 2. Create a local environment file:

	 ```bash
	 cp .env.example .env.local
	 ```

	 On Windows PowerShell, use:

	 ```powershell
	 Copy-Item .env.example .env.local
	 ```

 3. Set the values in `.env.local`:

	 ```env
	 VITE_SUPABASE_URL=https://your-project.supabase.co
	 VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
	 VITE_ADMIN_USERNAME=admin
	 VITE_ADMIN_PASSWORD=change-this-password
	 ```

 4. In the Supabase SQL Editor, run [`supabase/schema.sql`](supabase/schema.sql). This creates the `submissions` table, the public `photos` storage bucket, access policies, and realtime configuration.

 5. Start the development server:

	 ```bash
	 npm run dev
	 ```

	 Open the URL printed by Vite, usually `http://localhost:5173`.

 ## Routes

 - `/` - Public upload form
 - `/admin/login` - Admin login
 - `/admin` - Protected admin dashboard

 ## Scripts

 | Command | Description |
 | --- | --- |
 | `npm run dev` | Start the Vite development server |
 | `npm run build` | Create a production build in `dist` |
 | `npm run preview` | Preview the production build locally |
 | `npm run lint` | Run Oxlint |

 ## Deployment

 Build settings for both supported providers are already included:

 - **Netlify:** `netlify.toml` sets the build command to `npm run build`, publishes `dist`, and configures the SPA fallback.
 - **Vercel:** `vercel.json` rewrites all routes to `index.html`.

 Add the same `VITE_*` variables from `.env.local` to the hosting provider's environment settings before deploying. Run `npm run build` to verify the production build locally.

 ## Security note

 The current admin login is a client-side username/password gate, so the credentials are included in the browser bundle. The SQL policies also allow anonymous deletion because the dashboard currently uses the Supabase publishable key directly. This is suitable for a private or low-risk wall, but it is not a secure authorization boundary. For production use, replace it with Supabase Auth and authenticated, role-based database and storage policies.


