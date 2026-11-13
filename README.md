# Player Login System (Supabase)

## Setup
1. Open this folder in VS Code and run `npm install`.
2. In Supabase, open **SQL Editor**, create a new query, paste all of `schema.sql`, and run it.
3. In Supabase, open **Project Settings > API** and copy the Project URL and anon/publishable key.
4. Create a `.env.local` file in the project root (same level as `package.json`) with:

   VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_ANON_OR_PUBLISHABLE_KEY

5. In Supabase **Authentication > Providers > Email**, decide whether to require email confirmation. For a simple classroom test, you can turn confirmation off; if it stays on, users must verify their email before logging in.
6. Run `npm run dev`.

## How it works
- Registration uses Supabase Auth to create the email/password account. Supabase Auth manages the password; it is not stored as plain text in the player table.
- A database trigger automatically creates a `player_profiles` row with the player's username, email, and chosen class. The UUID from Supabase Auth is the Player ID.
- Login accepts either email or username. Username login first calls `get_player_email_by_username`, then Supabase Auth verifies the password.
- The dashboard reads and displays only Player ID, Username, and Class.
- The project does not use localStorage as its player database.

## Important
Use only the Supabase anon/publishable key in the browser. Never put a Supabase service-role key in frontend code.
