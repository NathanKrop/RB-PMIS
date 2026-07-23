# RB-PMIS

RB-PMIS is a results-based programme management information system for departmental planning, outcome monitoring, evidence verification, reporting, and management oversight.

## Included capabilities

- Results framework ownership, reporting cadence, outcome indicators, editing, and trend visualisations.
- Work plans with activity progress, monthly sequencing, achievements, variance analysis, risks, and resource allocation.
- Outcome-based reports, approval workflows, Word/Excel/PDF exports, and management reporting views.
- Evidence upload and review with classifications, links, location capture, metadata, versioning, and searchable repositories.
- Beneficiary registration, feedback and testimonials; risk registers; knowledge management; and data-quality scans for completeness, anomalies, and duplicates.
- Role-based dashboards, notifications, reporting deadlines, and an installable responsive web app manifest.

## Local development

1. Install dependencies with `npm install`.
2. Create `.env.local` with:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

3. Apply the SQL migrations in `supabase/migrations` to the target Supabase project, in filename order.
4. Run `npm run dev` and open `http://localhost:3000`.

## Production configuration

In addition to the public Supabase values above, configure these server-only variables:

```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CRON_SECRET=a-long-random-secret
```

Schedule a daily `POST` request to `/api/automation/deadlines` with the header `Authorization: Bearer <CRON_SECRET>`. The job creates due-date reminders and overdue escalations. It is safe to retry on the same day: duplicate notifications are prevented by the database function.

Never expose `SUPABASE_SERVICE_ROLE_KEY` or `CRON_SECRET` in browser code, public environment variables, or version control.

## Verification

```bash
npm run lint
npm run build
```
