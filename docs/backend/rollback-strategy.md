# Rollback Strategy

How to recover from a bad deploy across each layer of the production stack.

---

## Backend — Render

Render Starter keeps a full deploy history. Every successful deploy is a snapshot you can revert to instantly.

**Steps:**
1. Go to [dashboard.render.com](https://dashboard.render.com) → select the `continuum-backend` service
2. Click **Deploys** in the left sidebar
3. Find the last known-good deploy (look at the timestamp and commit SHA)
4. Click the three-dot menu on that deploy → **Rollback to this deploy**
5. Render rebuilds from that exact commit — no downtime on Starter plan

**When to use:** Bad deploy breaks an endpoint, server crashes on start, or a config change causes errors.

---

## Frontend — Vercel

Vercel keeps every production deployment as an immutable URL. Instant alias swap — no rebuild needed.

**Steps:**
1. Go to [vercel.com](https://vercel.com) → select the `continuum-web` project
2. Click **Deployments** in the top nav
3. Find the last known-good deployment
4. Click the three-dot menu → **Promote to Production**
5. The production domain alias (`continuum-web.vercel.app`) switches immediately

**When to use:** A bad frontend deploy breaks the UI, routing, or CSP.

---

## Database — MongoDB Atlas

Atlas M0 (free tier) does **not** support point-in-time restore or automated snapshots. Manual approach:

### Before any schema migration or destructive script:

```bash
# Export the affected collection(s) to a local JSON file
mongodump --uri="<MONGO_URI>" --collection=users --out=./backup/$(date +%Y%m%d)
```

Or use Atlas UI: **Database** → **...** → **Export Collection** → download as JSON.

### To restore from a manual export:

```bash
mongorestore --uri="<MONGO_URI>" --collection=users ./backup/<date>/users.bson
```

**Rule:** Never run a migration script against production without a manual export first. This applies to:
- Any `updateMany` that modifies existing field structure
- Adding required fields with no default
- Removing or renaming fields

### Upgrade path for automated backups:
Atlas M10+ adds **Continuous Cloud Backup** with point-in-time restore down to the second. When revenue warrants the upgrade, enable it under **Backup** in the Atlas cluster settings.

---

## What to do if everything is broken at once

1. **Roll back Render** to the previous deploy first — this is the fastest fix and covers most cases
2. **Roll back Vercel** if the frontend is the issue
3. **Check Upstash Redis** — if Redis is returning errors, the backend falls back to MongoDB automatically (no-op cache). No action needed unless the Redis adapter is crashing Socket.io
4. **Check MongoDB Atlas** — go to **Metrics** tab to see if the cluster is under abnormal load. If a migration ran bad data, restore from the most recent manual export

---

## Deploy checklist (before pushing to main)

- [ ] All Jest tests pass locally (`npm test`)
- [ ] If touching a schema: export affected collections to `./backup/` first
- [ ] If touching auth: verify login + refresh token flow in dev before merging
- [ ] After deploy: hit `/health` on Render to confirm the server started clean
