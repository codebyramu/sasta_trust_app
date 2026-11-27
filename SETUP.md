# Connect the trust app

Run `npm install` and `npm run dev` to start the app. For a production build, run `npm run build`.

1. Create a Supabase project. For a new database, run [setup.sql](supabase/setup.sql) in its SQL Editor to create the calendar, media bucket, and protected receipt records. For an existing database, compare its columns and row-level policies with the script before migrating. Remove any older permissive receipt or write policies when adopting the new access rules.
2. Put your project URL in `VITE_SUPABASE_URL` and its publishable or anon key in `VITE_SUPABASE_ANON_KEY` in `.env.local`. Set the same public variables in your deployment environment and rebuild.
3. Enable Google in Supabase Authentication providers. In Google Cloud, create a web OAuth client with the callback URL shown by Supabase as an authorized redirect URI. Enter the Google client ID and secret in the Supabase provider settings. The browser uses the Supabase session.
4. In Supabase URL Configuration, set the production site URL and allow the sign-in return URLs for both development and production, including the query string used for the return destination (for example `http://localhost:5173/signin**` and `https://YOUR-DOMAIN/signin**`).
5. After the trust administrator signs in once, identify their verified user UUID in Supabase Authentication. Run the SQL below with that UUID in the SQL Editor, then have the administrator sign out and back in. Open **My account → Administration** to publish occasions and issue receipts.

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"owner"}'::jsonb
where id = 'REPLACE_WITH_VERIFIED_USER_UUID'::uuid;
```

The contact form and receipt email delivery use the existing EmailJS service. Set `VITE_EMAILJS_SERVICE_ID`, `VITE_EMAILJS_TEMPLATE_ID`, and `VITE_EMAILJS_PUBLIC_KEY` for those features. The donation page uses the trust's existing UPI QR. The administrator issues receipts after confirming a contribution.
