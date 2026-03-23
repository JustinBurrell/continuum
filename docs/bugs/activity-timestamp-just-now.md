# Bug: Activity Feed Shows "just now" for All Seeded Items

**Reported:** March 23, 2026
**Severity:** Low — cosmetic only, no data loss
**Status:** Fixed

## Root Cause

Two compounding issues:

### 1. Hardcoded seed start date (`seed.js`)
`bumpDate` started at `new Date('2026-02-05')` and bumped forward by 1-3 days per activity. With ~38 activities created, the sequence ran well past the current date, putting the later friend activities (which appear at the top of the feed) in the future.

### 2. `formatRelative` did not guard against future dates (`utils.js`)
When `diff = now - d` is negative (date is in the future), `mins` is also negative. `mins < 1` is true, so the function returned `'just now'` instead of a sensible fallback.

## Fix

### `backend/scripts/seed.js`
Changed `bumpDate` to anchor activity dates relative to `Date.now()`:
- Starts 60 days in the past
- Bumps by 1-2 days (instead of 1-3) to spread across a predictable window
- Hard caps at 30 minutes ago so no activity date ever lands in the future

### `web/src/lib/utils.js`
Added `if (diff < 0) return formatDate(date)` guard before the `mins < 1` check.
Future dates now show an absolute date string (e.g. "Apr 5, 2026") instead of "just now".

### `backend/controllers/activity.controller.js`
Added `createdAt: { $lte: new Date() }` to the feed query filter. Future-dated activities (e.g. from a seed run with hardcoded past dates that have since become future-dated) no longer appear in the feed, so genuine recent activity correctly sorts to the top.
