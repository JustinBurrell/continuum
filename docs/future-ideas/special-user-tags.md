# Feature: Special User Tags (Founder, Team Continuum)

**Status:** Planned
**Priority:** Low
**Type:** Enhancement

---

## Overview

Certain email addresses are designated as special accounts — founders or team members. These users receive a badge (e.g., "Founder" or "Team Continuum") that appears on their own profile and on their card when others view their profile. Tags are hardcoded to specific emails — no UI for assigning them, admin-only via code.

---

## User Stories

- As a visitor or user, when I view a founder's or team member's profile, I want to see a visible badge so I know they are official.
- As a founder/team member, I want my special status to be visible on my own profile.

---

## Tag Definitions

| Tag | Display Label | Badge Color | Emails |
|---|---|---|---|
| `founder` | Founder | Gold / amber | `justinburrell715@gmail.com` (+ others as needed) |
| `team` | Team Continuum | Purple (`#6b21a8`) | TBD — add as team grows |

Tags are stored as an enum on the User model. Assignment is done either:
- **At registration** — if the registering email matches a hardcoded set, the tag is auto-assigned.
- **Via a one-time migration script** — for existing accounts.

No admin UI is needed at this stage.

---

## Data Model Changes

### `backend/models/User.js`

```js
specialTag: {
    type: String,
    enum: ['founder', 'team', null],
    default: null,
},
```

---

## Auto-Assignment at Registration

### `backend/controllers/auth.controller.js` — `register`

Add after user creation:

```js
const FOUNDER_EMAILS = ['justinburrell715@gmail.com'];
const TEAM_EMAILS    = [];

let specialTag = null;
if (FOUNDER_EMAILS.includes(email.toLowerCase())) specialTag = 'founder';
else if (TEAM_EMAILS.includes(email.toLowerCase()))  specialTag = 'team';

if (specialTag) {
    await User.updateOne({ _id: user._id }, { specialTag });
}
```

> For existing accounts: run a one-off script (`backend/scripts/assign-special-tags.js`) that sets `specialTag` based on the same email lists.

---

## API Changes

No new endpoints needed. `specialTag` is returned on:
- `GET /api/auth/me`
- `GET /api/users/:id`
- Any endpoint that populates user objects (friends list, activity feed, etc.)

Ensure `specialTag` is **not** in any `select: false` exclusion and is not writable via `PATCH /api/users/me` (users cannot self-assign a tag).

---

## UI / UX

### Design pattern — inline verification badge (Instagram-style)

The badge is **not** a pill label. It is a small filled icon that sits inline immediately after the username — just like Instagram's blue checkmark. The username and badge read as a single unit.

```
Justin Burrell  ✦         ← Founder (gold star-like icon)
Sarah Kim       🛡         ← Team Continuum (purple shield icon)
```

- The icon is 14–16px, vertically centered with the text baseline.
- No background pill, no border, no label text — icon only.
- On hover, a tooltip appears with the full label: `"Founder"` or `"Team Continuum"`.
- The icon is purely decorative to sighted users — add `aria-label` on a wrapper `<span role="img">` for screen readers.

### Icons

| Tag | Icon | Color |
|---|---|---|
| `founder` | Filled star or crown (`lucide-react`: `Star` with `fill`) | `#f59e0b` (amber-400) |
| `team` | Filled shield (`lucide-react`: `ShieldCheck` with `fill`) | `#6b21a8` (primary purple) |

### Shared component: `web/src/components/ui/VerifiedBadge.jsx`

```jsx
// Props: tag — 'founder' | 'team' | null
// Returns null if tag is null
// Renders inline icon with tooltip and aria-label
```

Usage anywhere a username is displayed:

```jsx
<span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
  {user.username}
  <VerifiedBadge tag={user.specialTag} />
</span>
```

### Where the badge appears

Two display modes depending on context:

**Compact (icon only)** — anywhere a username appears inline:
- Activity feed entries — after the poster's name
- Conversations list — after the contact's name
- Messages — after the name in the conversation header
- Friends list

**Expanded (icon + full label)** — on full profile views only:
- **Own Profile page** — shown prominently in the profile header below the name, e.g.:
  ```
  Justin Burrell
  ✦ Founder
  ```
- **Friend's profile page / modal** — same treatment below their name

The expanded version uses the icon alongside the text label ("Founder" or "Team Continuum") as a styled row — similar to how Instagram shows "✔ Verified" on a profile page. Larger icon (18px), label text at 13–14px, colored to match the tag.

---

## Migration Script

### `backend/scripts/assign-special-tags.js`

```js
// One-time script to backfill specialTag for existing accounts
// Run: node backend/scripts/assign-special-tags.js
```

- Reads the same `FOUNDER_EMAILS` / `TEAM_EMAILS` lists
- `updateMany` to set `specialTag` on matching documents
- Idempotent — safe to run multiple times

---

## Required Updates When Implemented

### Jest (`backend/tests/auth.test.js` + `backend/tests/users.test.js`)

- **Registration with founder email** → `specialTag: 'founder'` on created user
- **Registration with non-special email** → `specialTag: null`
- **`GET /api/auth/me`** → response includes `specialTag`
- **`GET /api/users/:id`** → response includes `specialTag`
- **`PATCH /api/users/me`** with `specialTag` in body → field is ignored (not updated)

### Postman / Swagger

- Update `POST /auth/register` response example to include `specialTag`.
- Update `GET /auth/me` and `GET /users/:id` response schemas to document `specialTag` as `"founder" | "team" | null`.
- Add a note that `specialTag` is read-only — cannot be set via `PATCH /users/me`.

### Docs

- **`docs/database/schema.md`** — add `specialTag` to the User table.
- **`backend/README.md`** — note that founder/team tags are auto-assigned at registration based on a hardcoded email list in `auth.controller.js`.

---

## Acceptance Criteria

- [ ] Registering with a founder email results in `specialTag: 'founder'` on the account
- [ ] Founder badge appears on the founder's own profile
- [ ] Founder badge appears when any user views the founder's profile
- [ ] Team Continuum badge works the same way for team emails
- [ ] `PATCH /api/users/me` cannot overwrite `specialTag`
- [ ] `specialTag` is included in all user object responses
- [ ] Badges are accessible with `aria-label`
- [ ] One-off migration script correctly backfills existing accounts
