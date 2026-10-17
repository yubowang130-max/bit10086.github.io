# Chapter private workspace

The public academic homepage remains at `/`. Its bilingual navigation links to `/dashboard/`, a separate Vite entry. The private workspace has seven modules plus optional NTULearn and PhD research snapshots.

## Deployment checklist

1. Create/select the intended Supabase project. Use the Singapore region for this owner's location if creating a new project.
2. Apply `supabase/migrations/202610180001_chapter.sql`.
3. In Supabase Authentication, create or invite the owner's account. Confirm which email the owner wants to use. Keep public signup disabled; this application uses `shouldCreateUser: false`.
4. Add that account's actual UUID to `public.chapter_owners` using the SQL editor. Do not put an email address, UUID placeholder, or an assumed generated ID into a migration. The account must exist in `auth.users` first.
5. Set the Auth Site URL to `https://bit10086.me/dashboard/` and allow that exact URL as a redirect. For local verification also allow the specific loopback test address. Supabase's default email template supplies a login link; the page also supports an email OTP if the template includes `{{ .Token }}`. New free-tier projects using the default SMTP cannot customize templates; use the default login link unless a custom SMTP provider is configured.
6. The approved project's URL and enabled **publishable** key are in `src/dashboard/project-config.js`. These are public browser configuration; Auth and RLS enforce access. Optional GitHub Actions variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` override this configuration for another deployment. Never use a secret/service-role key. Local development can override the same names in `.env.local`.
7. Resolve the existing custom-domain TLS mismatch before sending login links to the domain. Check Settings → Pages → Custom domain and certificate provisioning. DNS A records observed on 2026-10-18 already point at GitHub Pages. The GitHub-hosted project URL currently redirects to **HTTP** `bit10086.me`; HTTPS currently presents a certificate that does not match the domain. No DNS changes have been made by this migration.
8. Run `npm test` and `npm run build` with Node 22.12 or newer. Deploy through the existing Pages workflow after the preceding settings are in place.
9. Sign in with the owner account, verify another unauthorised account cannot read/write, create a test record, reload on a second device, and confirm the same record is returned. Test concurrent edits and verify the stale device is blocked rather than overwriting.

When configuration is missing, the route shows a locked setup screen. It never falls back to storing private data in a public JavaScript file or anonymous browser state.

## Storage and access

- `chapter_owners` is an administrator-managed allowlist. Browser roles have no access to change it.
- `chapter_state` stores one JSON document for each owner, with revision and write-operation ID.
- Row-level security allows an approved account to read only its own row. Direct client inserts, updates and deletes are revoked.
- Privileged implementation functions live in the non-exposed `chapter_private` schema. Public RPC entry points run as the caller, with explicit execute grants. Keep `chapter_private` out of the Data API exposed-schema list.
- `chapter_save` checks the authenticated account against both the bound owner ID and the allowlist. It performs an atomic revision check and serialises initial creation as well as updates.
- Retrying the same write ID after a lost response is idempotent. Reusing that ID for different content is rejected.
- On save failure, the pending document stays in memory, editing is blocked, and the user can retry or download the pending data. No success toast appears before the database acknowledges the write.
- Returning to an older browser tab does not automatically refresh. Use “获取云端最新数据” or reload; trying to save stale content triggers conflict handling.
- Sign out ends the current device session. Private records are not cached in localStorage; Supabase persists the login session there. Exported backups remain local files under the user's control.

The database currently stores a versioned document rather than a table per module. This is appropriate for a single-owner workspace and keeps migration atomic. It is not designed for simultaneous real-time collaborative editing. Server-side validation checks document shape and size; detailed field validation is also performed by the client before rendering imported or cloud data.

## Migrating existing data

The original localhost app stays available. A local-only `migrate.html` export helper combines its saved records, NTULearn snapshot, PhD research snapshot, and separately stored mentor contact notes into one JSON backup. This helper and the private snapshot files are **not part of the public repository**.

After login, import that backup through Settings → Import. Import replaces the owner's current cloud document after confirmation; it does not merge. Retain the original local data and backup until the new account has been verified on both devices. Subsequent full exports include the optional snapshots and mentor notes.

NTULearn data is a snapshot, not a continuously running scraper. No NTULearn credentials, cookies, private grades, real personal ledger, or research selections are included in the deployed static assets.

## Checks

### Hosted setup status — 2026-10-18

- Created `chapter-personal` in the owner-approved organization and Singapore region (`ap-southeast-1`); project ref `lnomehiozptkloyrnjfb`.
- Applied the Chapter migration successfully. Live REST checks return 401 for anonymous reads and owner checks; a database check with the authenticated role and no identity returns no records and no owner access.
- Both tables have RLS enabled, and browser roles cannot write either table directly. The security advisor reports only the intentional informational [RLS enabled without policy notice](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) for the administrator-only allowlist. No browser policy is intended for that table.
- The owner has created and confirmed their Auth account. It has been added to the administrator-managed allowlist; a hosted database check confirms owner authorization. Public signup and anonymous sign-in are disabled, verified through the Auth settings API.
- Site URL is `https://bit10086.me/dashboard/`; exact redirects allow that URL and `http://127.0.0.1:4175/dashboard/`. Password login is available alongside email login links. Passwords are passed only to Supabase Auth and are not saved by application code.
- The existing domain was removed and re-added to GitHub Pages to restart HTTPS provisioning, following GitHub troubleshooting guidance. DNS records remain unchanged. The app refuses login over non-loopback HTTP.
- Still pending: custom-domain HTTPS completion, actual owner login and cross-device verification, private data import, and production deployment.

`npm test` uses PGlite (PostgreSQL) to execute the actual migration and check anonymous denial, owner allowlisting, read isolation, prevention of direct writes, revision conflicts, idempotent retry and access revocation. Additional tests exercise pending-save preservation and private snapshot validation.

`npm run build` type-checks the existing homepage and builds both entry pages. Database tests are isolated and contain synthetic data only. Actual email delivery, hosted Supabase settings and the final domain certificate must be verified against the configured live project before calling migration complete.
