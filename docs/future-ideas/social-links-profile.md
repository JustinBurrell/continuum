# Feature: Social Links on Profile (LinkedIn & Instagram)

**Status:** Planned
**Priority:** Low
**Type:** Enhancement

---

## Overview

Users can add a LinkedIn URL and Instagram handle to their profile. These appear as clickable icons on their own profile and on any friend's profile card — giving people a quick way to connect outside of Continuum.

---

## User Stories

- As a user, I want to add my LinkedIn and Instagram to my profile so others can find me professionally and socially.
- As a user viewing a friend's profile, I want to see their social links so I can connect with them outside the app.

---

## UI / UX

### Editing (Profile page — Edit mode)

Under the existing bio field, add two new optional inputs:

| Field | Label | Placeholder | Validation |
|---|---|---|---|
| `linkedinUrl` | LinkedIn | `https://linkedin.com/in/yourname` | valid URL starting with `https://linkedin.com/in/` |
| `instagramHandle` | Instagram | `@yourhandle` | strip leading `@`, alphanumeric + `.` + `_`, max 30 chars |

- Both fields are optional — no enforcement if left blank.
- LinkedIn stores the full URL. Instagram stores the handle only (no full URL needed, we construct it on render).
- Inline validation error shown below each field on blur.

### Display (Profile overview + Friend profile card)

When one or both are set, show icon buttons in the profile header below the user's name/bio:

```
[LinkedIn icon]  [Instagram icon]
```

- Icons are the official brand icons (use `lucide-react` doesn't have them — use inline SVG or a small icon lib like `react-icons/fa`).
- Each icon links out in a new tab (`target="_blank" rel="noopener noreferrer"`).
- Tooltip on hover: "View LinkedIn profile" / "View Instagram".
- If a field is empty, the corresponding icon is not shown.
- Accessible: `<a aria-label="LinkedIn profile">` / `<a aria-label="Instagram profile">`.

---

## Data Model Changes

### `backend/models/User.js`

Add to the profile section:

```js
linkedinUrl: {
    type: String,
    trim: true,
    default: null,
},
instagramHandle: {
    type: String,
    trim: true,
    default: null,
},
```

---

## API Changes

### `PATCH /api/users/me`

Already exists. Add `linkedinUrl` and `instagramHandle` to the list of allowed update fields in `users.controller.js`.

**Validation (controller-level):**

```js
if (linkedinUrl && !/^https:\/\/(www\.)?linkedin\.com\/in\//.test(linkedinUrl)) {
    return res.status(400).json({ success: false, error: 'Invalid LinkedIn URL' });
}
if (instagramHandle && !/^[a-zA-Z0-9._]{1,30}$/.test(instagramHandle)) {
    return res.status(400).json({ success: false, error: 'Invalid Instagram handle' });
}
```

### `GET /api/users/:id`

Already returns the user object — no changes needed as long as the new fields are not marked `select: false`.

---

## Frontend Changes

### `web/src/pages/Profile.jsx`

- Add two `Input` fields in the edit section (below bio).
- Add `SocialLinks` display component in the profile header (shown in both view and edit mode, hides if empty).

### `web/src/pages/friends/FriendProfile.jsx` (or wherever friend profiles are rendered)

- Add the same `SocialLinks` display component.

### Shared component: `web/src/components/ui/SocialLinks.jsx`

```jsx
// Props: linkedinUrl, instagramHandle
// Renders icon links, skips any that are null/empty
```

---

## Required Updates When Implemented

### Jest (`backend/tests/users.test.js`)
- `PATCH /api/users/me` with valid LinkedIn URL → saved correctly
- `PATCH /api/users/me` with invalid LinkedIn URL → 400
- `PATCH /api/users/me` with invalid Instagram handle → 400
- `GET /api/users/:id` returns `linkedinUrl` and `instagramHandle`

### Postman / Swagger
- Update `PATCH /api/users/me` docs to include `linkedinUrl` and `instagramHandle` fields.
- Update `GET /api/users/:id` response example.

### Docs
- Update `docs/database/schema.md` User table with the two new fields.

---

## Acceptance Criteria

- [ ] User can add/edit/clear LinkedIn URL and Instagram handle from Profile edit mode
- [ ] Invalid LinkedIn URL or Instagram handle shows an inline error and does not save
- [ ] Saved links appear as clickable brand icons in the profile header
- [ ] Icons open in a new tab with `rel="noopener noreferrer"`
- [ ] If a field is empty, its icon is not shown
- [ ] Links are visible when viewing a friend's profile
- [ ] Icons have accessible `aria-label` attributes
