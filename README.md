# Cresta Marine — Hostinger deployment

This is a standard Next.js application prepared for Hostinger Business Web Hosting. It uses Hostinger MySQL for leads, boat configurations, account requests and approvals, plus Google OAuth for secure account access.

## Local setup

1. Copy `.env.example` to `.env.local` and add the required values.
2. Run `npm install`.
3. Run `npm run dev`.
4. Verify production output with `npm run build`.

## Deploy through Hostinger

1. In hPanel choose **Websites → Add Website → Deploy Web App**.
2. Import this GitHub repository and select **Next.js** with Node.js 22.
3. Use `npm run build` as the build command and `npm run start` as the start command. Hostinger normally detects these automatically.
4. Create a MySQL database in hPanel, then add the values from `.env.example` under the app's environment variables.
5. Generate a strong `AUTH_SECRET` (at least 32 random characters).
6. In Google Cloud Console create an OAuth web client and add `https://YOUR-DOMAIN/api/auth/google/callback` as an authorised redirect URI. Add its client ID and secret to Hostinger.
7. Deploy. The application creates its tables automatically; `hostinger.sql` is also provided for manual import through phpMyAdmin.

Optional Resend variables enable email notifications for new account requests. `ADMIN_EMAILS` is a comma-separated allowlist for the approval area at `/admin/access-requests`.
