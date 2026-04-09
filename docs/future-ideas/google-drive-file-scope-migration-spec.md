# Google Drive Scope Migration Spec (`drive.readonly` -> `drive.file`)

## Status

**Draft - planned for implementation before Monday.**

Android is explicitly out of scope for this change window. This spec covers web (React) and backend (Express) only. Android integration details will be added after Android development is complete (target: after Sunday).

---

## 1. Objective

Migrate Google Drive integration from restricted scope `https://www.googleapis.com/auth/drive.readonly` to non-sensitive scope `https://www.googleapis.com/auth/drive.file` while preserving current product value:

- Import a Google Doc as a note
- Download imported source PDF
- Open the original doc in Google Docs from the note UI
- Refresh an imported note from its source Google Doc

Primary reason: align with Google OAuth verification guidance and minimum-scope policy.

---

## 2. Scope and Non-Goals

### 2.1 In Scope (this spec)

- Backend OAuth scope and Drive endpoint changes
- Web import UX migration from server-side Drive listing to Google Picker selection
- Data model behavior for `googleDocId` and `googleDocUrl`
- Legal and product copy updates for scope accuracy
- Verification and rollout plan for completion by Monday

### 2.2 Out of Scope (follow-up spec)

- Android implementation details
- iOS/mobile parity
- New Google Drive file types beyond Google Docs
- Full bidirectional sync

---

## 3. Current State Summary

Current implementation assumes broad catalog access:

- OAuth requests `drive.readonly`
- Backend provides `GET /api/google/files` using Drive `files.list` to fetch many docs
- Web import modal loads and searches that full list

Current implementation already stores source metadata and imports by file ID:

- `POST /api/notes/import` uses `googleDocId` + `googleDocUrl`
- Backend imports via Drive `files.export` (PDF + text)
- `PUT /api/notes/:id/refresh` re-exports from stored `googleDocId`

Key mismatch:

- `drive.file` is user-selected-file access
- current UI assumes app-level browse/list across full Drive

---

## 4. Target Experience (Post-Migration)

1. User opens Notes import flow and chooses "Google Drive".
2. User launches Google Picker (Google-owned UX).
3. User selects one or more Google Docs.
4. Web app receives selected file metadata (`id`, `name`, URL metadata).
5. Web calls `POST /api/notes/import` with selected file IDs.
6. Backend exports/imports selected docs only.
7. In note view:
   - "Download source PDF" remains available.
   - "View in Google Docs" opens the saved source doc link.

No server endpoint provides "list all docs in Drive."

---

## 5. Backend Changes

## 5.1 OAuth Scope Update

Replace requested scope:

- from `https://www.googleapis.com/auth/drive.readonly`
- to `https://www.googleapis.com/auth/drive.file`

Update all scope declaration points:

- `backend/config/passport.js`
- `backend/routes/auth.routes.js`

Keep:

- `profile`
- `email`
- `accessType: 'offline'`
- `prompt: 'consent'`

Rationale: maintain refresh-token behavior while narrowing Drive access.

## 5.2 Remove Full-Drive Listing Dependency

Current endpoint:

- `GET /api/google/files` (`google.controller.js`) using `drive.files.list`

Change:

- Deprecate/remove this endpoint from product flow.
- Option A (recommended): remove route + controller method entirely.
- Option B: keep temporarily behind internal/dev flag, never used by production UI.

Policy target: production UX must not rely on Drive-wide listing.

## 5.3 Keep Import/Refresh by File ID

Keep existing import and refresh endpoints:

- `POST /api/notes/import`
- `PUT /api/notes/:id/refresh`

Behavior notes under `drive.file`:

- Works for files explicitly granted via Picker.
- Can fail (403/404) if permission revoked or file no longer accessible.

Required backend hardening:

- Return explicit error codes/messages for:
  - missing access grant
  - file deleted/moved/no longer shared
  - non-Docs file IDs
- Do not expose raw Google API errors directly to clients.

## 5.4 Source Link Persistence

Ensure note records continue storing:

- `googleDocId` (required for refresh/export)
- `googleDocUrl` (used for "View in Google Docs")

If picker response does not include a direct web URL, construct:

- `https://docs.google.com/document/d/<googleDocId>/edit`

at import time and persist it.

## 5.5 Backward Compatibility

Existing notes imported pre-migration should continue working if:

- stored `googleDocId` is valid
- user still grants access to those docs

Fallback UX for failures:

- show actionable message to reconnect Google or reselect file in Picker

---

## 6. Web Changes

## 6.1 Replace In-App Drive Browser with Google Picker

Current:

- Notes import modal fetches `/api/google/files` and client-searches results.

Target:

- "Google Drive" tab launches Google Picker instead of loading server list.
- Selected files are displayed locally as chosen items pending import.
- Import action posts selected files to backend.

Required implementation details:

- Load Picker API safely
- request only needed token/scopes
- restrict file type to Google Docs
- support single-select first (multi-select optional, phase 2)

## 6.2 Update Import Modal UX

Current UX copy implies full-drive browsing.

Replace with scoped language:

- "Choose files from Google Drive"
- "Continuum only accesses files you select"

Include states:

- Google not linked
- Picker canceled
- selection success
- import success/failure

## 6.3 Note View Actions

Add/confirm two explicit actions for notes with `googleDocId`:

- `Download Source PDF` (existing behavior)
- `View in Google Docs` (opens `googleDocUrl` in new tab)

If `googleDocUrl` missing:

- fallback using constructed docs URL from `googleDocId`

## 6.4 Copy and Policy Updates (Web)

Update content that references `drive.readonly` or broad Drive access:

- `web/src/pages/legal/PrivacyPolicy.jsx`
- `web/src/pages/Landing.jsx` (remove "entire Google Drive" style claims)
- `web/src/pages/Product.jsx` (clarify selected-file import)
- `web/src/pages/Profile.jsx` integration helper text

Copy requirements:

- mention `drive.file` (or plain-language equivalent)
- explicitly state user-selected access model
- remove statements implying full-drive listing

---

## 7. Data and API Contract

## 7.1 Import Payload Contract

`POST /api/notes/import` payload remains:

- `googleDocId` (required)
- `googleDocUrl` (preferred)
- `title` (optional but recommended)

## 7.2 Note Model Fields

No schema migration required if fields already exist:

- `googleDocId`
- `googleDocUrl`
- `lastSyncedAt`

Optional improvement:

- add `googleSourceAccessState` for better UX (`ok`, `revoked`, `not_found`)

---

## 8. Security and Compliance Considerations

- Minimum-scope compliance improves by moving to `drive.file`.
- App should not enumerate unrelated Drive files server-side.
- Continue encrypting stored Google tokens at rest.
- Continue user-initiated import only (no background crawling).
- Ensure privacy policy text matches real behavior exactly.

---

## 9. Rollout Plan (Target: Monday)

## 9.1 Friday/Saturday - Core Implementation

- Backend scope switch + list endpoint deprecation
- Web Picker integration in notes import modal
- Note view "View in Google Docs" action
- Initial legal/product copy updates

## 9.2 Sunday - Stabilization and QA

- End-to-end web + backend testing
- verify import, refresh, download, open-in-docs flows
- validate error handling for revoked permissions
- regression test existing notes and OAuth login paths

Android work finishes Sunday but is not bundled in this rollout.

## 9.3 Monday - Verification Submission

- Confirm Cloud Console scope update to `drive.file`
- ensure deprecated `drive.readonly` usage removed from production code path
- reply to Google verification email with:
  - "Confirming narrower scopes"
  - brief note that app now uses user-selected-file access via Google Picker

---

## 10. Test Plan (Web + Backend)

## 10.1 Happy Path

- Link Google account
- Open Picker, select doc, import note
- Confirm note content and source PDF available
- Confirm "View in Google Docs" opens correct doc
- Refresh note and verify updated content

## 10.2 Failure Cases

- Cancel picker before selection
- Select unsupported type (if UI permits, should block)
- Revoke Google permissions then attempt refresh/download
- Delete source doc then refresh
- Token expiry path (refresh token flow)

## 10.3 Regression Areas

- Google login/register
- non-Google notes create/edit/delete
- local PDF upload import path
- unlink Google account behavior

---

## 11. Implementation Checklist

- [ ] Update OAuth scopes to `drive.file`
- [ ] Remove/deprecate `/api/google/files` production usage
- [ ] Integrate Google Picker in `web` notes import flow
- [ ] Keep import/refresh by `googleDocId`
- [ ] Ensure `googleDocUrl` persistence and note-view action
- [ ] Update privacy/legal/product copy
- [ ] Run full web/backend QA matrix
- [ ] Submit verification response Monday

---

## 12. Android Follow-Up (Post-Sunday)

When Android development is complete, append a dedicated section covering:

- Android account linking with `drive.file`
- Android file selection UX equivalent (Picker or native-compatible flow)
- parity for import/download/open-in-docs behavior
- mobile-specific error states and offline considerations

Android should reuse the same backend contracts introduced in this spec.

---

## 13. Google Verification Email Requirements and Reply Plan

This section captures the actionable requirements from the Google "Action Needed" email so implementation and response are aligned.

## 13.1 What Google Explicitly Requested

Google flagged requested scope:

- `https://www.googleapis.com/auth/drive.readonly`

Google guidance summary:

- `drive.file` is the recommended narrower scope.
- Restricted scope approval can be denied if minimum-scope policy is not met.
- `drive.file` avoids restricted-scope verification burden and CASA security assessment requirements.
- Google Picker is the recommended UX for user-selected file access.
- Google specifically asks for a direct reply with one of two phrases:
  - `Confirming narrower scopes`
  - `Unable to use narrower scopes` (+ technical justification)

Important instruction from Google email:

- **Do not remove any previously approved scopes at this stage.**

## 13.2 Decision for This Migration

Given this spec's architecture (Picker-based file selection + import by file ID), this project should proceed with:

- **Option 1: Confirming narrower scopes**

because the product can preserve required functionality without `drive.readonly`.

## 13.3 Preconditions Before Replying

Before sending the confirmation reply, complete these checks:

- Cloud Console scope set includes `drive.file`.
- New code path no longer depends on full-drive listing (`/api/google/files`) in production UX.
- Privacy policy and product copy reflect selected-file access model.
- Import, refresh, download, and "View in Google Docs" flows verified in testing.

## 13.4 Recommended Reply Template (Option 1)

Use this exact structure when replying to Google's thread after changes are in place:

```text
Confirming narrower scopes

We have updated our implementation to use the recommended narrower scope:
https://www.googleapis.com/auth/drive.file

Our web app now uses a user-selected file flow via Google Picker for Google Docs import.
We only access files that the user explicitly selects for use with our app.

We have removed reliance on broad Drive file listing in the production import flow and
updated our Cloud Console configuration and app code accordingly.

Please continue our verification review with the narrower scope configuration.
```

## 13.5 Fallback Reply Template (Option 2)

Use only if implementation constraints prevent migration to `drive.file`:

```text
Unable to use narrower scopes

[Provide concrete technical justification tied to required product behavior that cannot be
implemented with drive.file. Avoid UI-preference justifications.]
```

Note: this fallback has higher denial risk based on Google's minimum-scope policy language.

## 13.6 Monday Submission Checklist (Email + Console)

- [ ] Scope updates saved in Cloud Console
- [ ] Verification request updated/resubmitted in Cloud Console if required
- [ ] Reply sent directly on Google's email thread with "Confirming narrower scopes"
- [ ] Verification Center checked for status updates after submission

