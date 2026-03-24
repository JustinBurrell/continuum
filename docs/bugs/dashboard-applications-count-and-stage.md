# Bug: Dashboard Applications Count Shows 0 / Stage Badge Empty

**Reported:** March 24, 2026
**Severity:** Medium — incorrect data displayed, no data loss
**Status:** Fixed

---

## Symptoms

1. The Applications stat card on the Dashboard occasionally shows **0** even when the user has active applications.
2. The status badge on each application row in the Dashboard sidebar (interview, applied, offer, etc.) is **always blank** — the badge renders with color styling but no text.

Both issues are intermittent for the count (depends on cache state) but the blank stage badge is consistently broken for all users.

---

## Root Cause — Count Shows 0

The Applications stat card reads from a **separate query** (`GET /applications/dashboard`) rather than from the applications list query (`GET /applications`):

```js
// Two separate queries with different cache keys
const { data: appsData }      = useQuery({ queryKey: ['applications', { limit: 5 }], ... });
const { data: appsDashboard } = useQuery({ queryKey: ['applications-dashboard'], ... });

// Stat uses the dashboard query
<StatCard value={appsDashboard?.total} />
```

Because `['applications-dashboard']` is a different React Query cache key from `['applications']`, any mutation that invalidates `['applications']` (create, delete, update) does **not** invalidate `['applications-dashboard']`. The dashboard query can sit on a stale cached response of `{ total: 0 }` from a previous session — before the user had any applications — while the list loads correctly. Within the 30-second staleTime window, the stale 0 is served from cache without a refetch.

---

## Root Cause — Stage Badge Always Blank

The `AppItem` component uses two different field names for the same data:

```jsx
// Correct field name used for badge color lookup
const badgeStyle = sc[app.status] || sc.applied;

// Wrong field name used for badge text — always undefined
<span style={{ ...badgeStyle }}>
  {app.stage}   ← app.stage does not exist on the Application model
</span>
```

The Application model field is `status` (values: `draft`, `applied`, `interview`, `offer`, `rejected`, `withdrawn`). The field `stage` does not exist — so `app.stage` is always `undefined`, which React renders as nothing. The badge box has the correct color (from `app.status`) but is empty.

---

## Fix

**Count:** Fall back to `apps.length` when `appsDashboard?.total` is falsy (0 or undefined). `||` is used instead of `??` so that a stale cached 0 is also overridden by the live list count:

```jsx
// Before
value={appsDashboard?.total}

// After
value={appsDashboard?.total || apps.length}
```

**Stage badge:** Replace `app.stage` with `app.status`:

```jsx
// Before
{app.stage}

// After
{app.status}
```

---

## Files Changed

- `web/src/pages/Dashboard.jsx` — `StatCard` value fallback + `AppItem` field name

---

## Notes

The count fallback is a defensive fix. The underlying cache invalidation gap (mutations on `['applications']` not invalidating `['applications-dashboard']`) will be fully addressed in the optimistic mutations phase of `feat/loading-states` (Phase 3), which will add explicit `invalidateQueries(['applications-dashboard'])` calls alongside every application mutation.
