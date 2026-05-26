# Continuum — Integrations Spec
## For Claude Code Plan Mode

This document describes every new integration to be added to Continuum. It is intended to be read alongside the codebase so Claude Code can produce an accurate implementation plan.

---

---

## GitHub Workflow — Read Before Writing Any Code

### Step 0: Branch and issues first

Before writing a single line of feature code, Claude Code must:

1. Checkout main and pull the latest: `git checkout main && git pull origin main`
2. Create the feature branch: `git checkout -b feat/INT-integrations`
3. Use the `gh` CLI to create a GitHub issue for every ticket listed below, attaching each to the "Continuum Development Board" project
4. Only after all issues are created, begin implementing ticket by ticket

**Creating an issue with project attachment:**
```bash
# Create the issue
gh issue create --title "INT-1: chore: install officeparser and create file parser service" --body "..." --label "feat"

# Get the issue number from the output, then add to project
# Find the project ID first (run once):
gh project list --owner JustinBurrell

# Add issue to project:
gh project item-add PROJECT_NUMBER --owner JustinBurrell --url ISSUE_URL
```

Read the existing `gh` workflow in the agile workflow guide in the repo before running any commands. Match the existing label names exactly — do not create new labels.

### Step 1: One commit per ticket

Each ticket below maps to exactly one commit. The commit message must match the format in the ticket exactly. Do not include `Closes #N` in the commit message — issue closing happens in the PR body.

### Step 2: PR at the end

One PR for the entire integrations branch. Title format matches the agile guide. The PR body must include `Closes #N` for every single issue created in Step 0 — one line per issue. GitHub will auto-close all of them on merge.

---

## Ticket Breakdown — Integrations PR

These are listed in implementation order. Do not skip ahead. Each ticket is one commit.

### Infrastructure (do these first)

**INT-1** `chore: install officeparser and create unified file parser service`
Branch prefix: `chore/`
- Install `officeparser` in backend package
- Create `services/fileParser.service.js` with `parseOfficeFile(buffer, mimeType, options)` routing to either `pdf-parse` (existing) or `parseOfficeAsync` based on MIME type
- Read the existing resume upload service to find where `pdf-parse` is called today and move it into the new service so all file parsing goes through one function
- Verify `yauzl` dependency does not conflict: `npm ls yauzl`

**INT-2** `chore: install simple-icons and create IntegrationLogo component`
Branch prefix: `chore/`
- Install `simple-icons` in web frontend package
- Create `components/IntegrationLogo.jsx` (or `.tsx`) using the SVG rendering pattern in the spec
- Create `components/IntegrationCard.jsx` using the card shape in the spec
- Read existing component patterns in the codebase before creating — match the file structure and export style exactly
- Dark mode caveat: invert black logos to white when dark mode is active — check if a dark mode context or CSS variable exists

**INT-3** `chore: install youtube-transcript-plus anki-apkg-export and ical-generator`
Branch prefix: `chore/`
- Install all three in backend package
- Verify no dependency conflicts
- No implementation yet — just installation and package.json/lock file update

---

### Google Slides and Sheets (zero new OAuth)

**INT-4** `feat: extend google picker to support slides and sheets`
Branch prefix: `feat/`
- Read the existing Google Picker initialization code in the frontend before touching it
- Add `application/vnd.google-apps.presentation` and `application/vnd.google-apps.spreadsheet` to the Picker MIME type filter
- No backend changes in this ticket

**INT-5** `feat: add slides and sheets parsing via drive export and officeparser`
Branch prefix: `feat/`
- Read the existing `POST /api/notes/import` endpoint before modifying
- Add MIME type branch: if `presentation`, export as PPTX then parse with `parseOfficeFile` using `{ putNotesAtLast: true }`
- Add MIME type branch: if `spreadsheet`, export as XLSX then parse with `parseOfficeFile`
- Both also export as PDF via Drive for Cloudinary storage
- Extend `Note.source` enum to include `'google_slides'` and `'google_sheets'`
- Read how `note.source` is currently defined and validated before changing the enum

---

### Anki and ICS Exports (no new OAuth)

**INT-6** `feat: add anki export endpoint for flashcard sets`
Branch prefix: `feat/`
- Read the existing flashcard set endpoints before adding a new one
- `GET /api/flashcard-sets/:id/export/anki`
- Verify ownership using the same auth pattern as existing flashcard endpoints
- Return binary `.apkg` with correct Content-Type and Content-Disposition headers
- Read how existing file download responses are structured in the codebase

**INT-7** `feat: add ics calendar export and subscribe url endpoints`
Branch prefix: `feat/`
- Read the existing calendar aggregation endpoint before adding export
- `GET /api/calendar/export.ics` — JWT protected, one-time download
- `GET /api/calendar/subscribe/:calToken.ics` — token protected, no JWT
- `calToken` generation and storage on User document — read how similar tokens (password reset, OAuth codes) are stored today and match that pattern
- `POST /api/calendar/subscribe/reset` to rotate the token

**INT-8** `feat: add anki export and calendar export ui on web`
Branch prefix: `feat/`
- Read the existing flashcard set detail page and calendar/tasks page before adding buttons
- "Export to Anki" button on flashcard set detail — triggers file download
- "Export to Calendar" dropdown on calendar/tasks page: "Download .ics file" and "Copy subscribe URL"
- Use `IntegrationLogo` component with Anki, Google Calendar, and Apple Calendar logos
- No new routes — these are additions to existing pages

**INT-9** `feat: add anki export and calendar export ui on android`
Branch prefix: `feat/`
- Read the existing Android flashcard set detail screen and calendar screen before modifying
- Read how file downloads are handled on Android today (DownloadManager pattern from the interview brief)
- "Export to Anki" triggers a file download via DownloadManager
- "Export / Subscribe" option on calendar screen
- Match the existing button and action pattern in the Android codebase exactly

---

### YouTube Import (no OAuth)

**INT-10** `feat: add youtube transcript import backend endpoint`
Branch prefix: `feat/`
- `POST /api/notes/import/youtube`
- Extract video ID from all four YouTube URL formats — write a utility function, test it against all formats
- Fetch transcript via `youtube-transcript-plus`, fetch title via oEmbed (no API key)
- Run through the normalization pipeline — read how existing imports normalize content before implementing
- Error handling: no captions (TranscriptsDisabled), invalid URL, private video
- `note.source: 'youtube'`, `note.pdfUrl: null`

**INT-11** `feat: add youtube import ui to web import screen`
Branch prefix: `feat/`
- Read the existing import screen before modifying — understand the current layout and component structure
- Add YouTube source card with `IntegrationLogo` component
- URL input field and import button — no picker, no OAuth popup
- Error states for no captions and invalid URL using the existing error display pattern

**INT-12** `feat: add youtube import to android notes import flow`
Branch prefix: `feat/`
- Read the existing Android import flow before modifying
- URL input screen or bottom sheet following the existing Android import pattern
- Error state handling matching Android error display conventions

---

### Dropbox (no persistent OAuth)

**INT-13** `feat: add dropbox chooser sdk and import backend endpoint`
Branch prefix: `feat/`
- `POST /api/notes/import/dropbox` — receives `{ name, downloadUrl }` from frontend
- Download buffer from Dropbox URL via axios
- Route to `parseOfficeFile` based on file extension or Content-Type
- Generate PDF for Cloudinary if not already a PDF — read how existing imports handle this
- `note.source: 'dropbox'`, `note.externalUrl` set to the Dropbox preview URL
- `DROPBOX_APP_KEY` added to env — frontend-safe public key

**INT-14** `feat: add dropbox import to web import screen`
Branch prefix: `feat/`
- Read the existing import screen layout before adding
- Embed Dropbox Chooser SDK script
- Add Dropbox card with `IntegrationLogo`
- Chooser popup on click, send result to backend endpoint
- Handle file type errors from backend

**INT-15** `feat: add dropbox import to android notes import flow`
Branch prefix: `feat/`
- Read existing Android import flow before modifying
- Dropbox option in the source picker
- Open Dropbox app or Chooser web flow via CCT (Chrome Custom Tab) following the existing Google Drive CCT pattern in the Android codebase

---

### Notion (OAuth — connected account)

**INT-16** `feat: add notion oauth connect disconnect backend endpoints`
Branch prefix: `feat/`
- Read the existing Google OAuth connect/disconnect flow before implementing — mirror the pattern exactly
- `GET /api/integrations/notion/auth` — redirect to Notion OAuth
- `GET /api/integrations/notion/callback` — exchange code, store encrypted token on User document using the same AES-256-GCM pattern as Google tokens
- `DELETE /api/integrations/notion/disconnect` — clear token, set connected flag to false
- `NOTION_CLIENT_ID`, `NOTION_CLIENT_SECRET`, `NOTION_REDIRECT_URI` added to env

**INT-17** `feat: add notion page browser and import backend endpoint`
Branch prefix: `feat/`
- `GET /api/integrations/notion/pages` — list user's Notion pages using stored token
- `POST /api/notes/import/notion` — fetch blocks with pagination loop, convert via `notion-to-md`, normalize, create Note
- Rate limit: 400ms delay between paginated block requests
- `note.source: 'notion'`, `note.externalUrl` set to Notion page URL
- V1 limitation: nested child blocks not fetched recursively

**INT-18** `feat: add notion connected account card to web settings`
Branch prefix: `feat/`
- Read the existing Google connected account card in settings before adding — match the exact component, layout, and connect/disconnect behavior
- Add Notion card with `IntegrationLogo`
- "Connect" initiates OAuth in a popup, card updates to "Connected" on return
- "Disconnect" removes tokens with confirmation

**INT-19** `feat: add notion import to web import screen`
Branch prefix: `feat/`
- Read existing import screen before modifying
- Add Notion card — shows "Connect first" state if not connected, page browser if connected
- Page browser: searchable list of Notion page titles fetched from `GET /api/integrations/notion/pages`
- Selecting a page calls the import endpoint

**INT-20** `feat: add notion oauth and import to android`
Branch prefix: `feat/`
- Read the existing Android Google OAuth flow and settings screen before implementing
- Follow the same CCT-based OAuth pattern used for Google
- Notion connection card in Android settings connected accounts section
- Notion source option in Android import flow with page browser screen

---

### OneDrive (OAuth — connected account)

**INT-21** `feat: add onedrive oauth connect disconnect backend endpoints`
Branch prefix: `feat/`
- Mirror the Notion OAuth pattern exactly — same structure, different provider
- `GET /api/integrations/onedrive/auth`, callback, disconnect
- Store encrypted MSAL tokens on User document using existing AES-256-GCM pattern
- Token refresh before every Graph API call — read how Google token refresh is handled today
- `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_REDIRECT_URI` added to env

**INT-22** `feat: add onedrive file picker and import backend endpoint`
Branch prefix: `feat/`
- `POST /api/notes/import/onedrive` — receives `{ driveItemId, name, webUrl }` from frontend
- Download file via Microsoft Graph `GET /me/drive/items/{id}/content` using stored token
- Route to `parseOfficeFile` based on file type
- `note.source: 'onedrive'`, `note.externalUrl` set to `webUrl` (opens in OneDrive/Office Online)

**INT-23** `feat: add onedrive connected account card to web settings`
Branch prefix: `feat/`
- Mirror the Notion settings card exactly
- OneDrive logo via `IntegrationLogo`

**INT-24** `feat: add onedrive import to web import screen`
Branch prefix: `feat/`
- Mirror the Notion import screen card exactly
- OneDrive File Picker v8 SDK opens on click after connection confirmed

**INT-25** `feat: add onedrive oauth and import to android`
Branch prefix: `feat/`
- Mirror the Notion Android implementation exactly
- MSAL Android SDK for OAuth instead of Notion's flow

---

### UI Surfaces

**INT-26** `feat: refactor web import screen to multi-source picker with logos`
Branch prefix: `feat/`
- Read the entire current import screen component before refactoring
- Reorganize into a 2-column card grid using `IntegrationCard` components
- Sources: Google Drive, YouTube, Dropbox, OneDrive (connect-first), Notion (connect-first)
- Connected-account state handling: "Connect to import" state on cards for unconnected OAuth services
- Do not break the existing Google Drive import flow

**INT-27** `feat: add integration cards with logos to web onboarding`
Branch prefix: `feat/`
- Read the existing onboarding flow implementation before adding
- Find the onboarding step that covers tool connections — read the step computation logic
- Add integration cards (Google Drive, Dropbox, OneDrive, Notion) to the relevant onboarding step
- All skippable — "Skip for now" at the bottom of the step

**INT-28** `feat: add integrations section to web settings`
Branch prefix: `feat/`
- Read the existing settings page structure before adding
- Import integrations with connection state: Google Drive, Dropbox (no account needed badge), OneDrive, Notion
- Export integrations informational section: Anki, Google Calendar/Apple Calendar, Quizlet note
- Disconnect behavior mirrors Google disconnect exactly

**INT-29** `feat: add integration source selection to android import flow`
Branch prefix: `feat/`
- Read the existing Android import flow before modifying
- Source picker screen or bottom sheet showing all import sources with logos
- Match the existing Android import UI pattern exactly

**INT-30** `feat: add integration cards to android onboarding`
Branch prefix: `feat/`
- Read the existing Android onboarding implementation before modifying
- Add connected accounts step with integration cards following the existing TourOverlay pattern

---

### Tests

**INT-31** `test: add backend tests for all new import and export endpoints`
Branch prefix: `test/`
- Read all existing backend test suites before writing
- Cover every endpoint and error case listed in the Testing Requirements section of this spec
- Follow the existing test file structure, setup, teardown, and assertion style exactly

**INT-32** `test: add web vitest unit tests for integration components`
Branch prefix: `test/`
- Read existing Vitest test files before writing
- IntegrationLogo renders correctly, URL parser for YouTube, calToken generation

**INT-33** `test: add playwright e2e tests for integration flows`
Branch prefix: `test/`
- Read existing Playwright spec files before writing
- Add new spec file for integrations — import screen, YouTube import, Anki export, ICS export, connected accounts

**INT-34** `test: add android viewmodel and repository tests for new import sources`
Branch prefix: `test/`
- Read existing Android MockK test files before writing
- NotesViewModel and NotesRepository tests for new source values and import endpoints

---

### Docs

**INT-35** `docs: update api docs swagger readmes and env vars for all integrations`
Branch prefix: `docs/`
- Read the existing docs directory structure before updating anything
- Swagger annotations on all new route files
- Backend README if it lists route groups
- Root README if it lists environment variables
- Any integration-specific setup docs

## Reference: How Google Integration Is Currently Done

Before building anything new, Claude Code should read the existing Google integration end-to-end as the canonical reference for all new integrations. Specifically look at:

- How the Google Picker is initialized and rendered (frontend)
- How the Google OAuth connect/disconnect flow works in Settings (frontend + backend)
- How `POST /api/notes/import` handles the Google Docs import (backend)
- How the "View in Google Docs" button is rendered using `googleDocUrl` (frontend note detail)
- How Google tokens are encrypted at rest using AES-256-GCM (backend User model)
- How the Google connection card is displayed in Settings → Connected Accounts (frontend)

Every new integration should mirror this pattern as closely as possible. New connected account cards (OneDrive, Notion) should look and behave identically to the Google card. New import flows should follow the same UX shape as the Google Drive import. The goal is zero architectural surprise — a developer reading any new integration should immediately recognize the pattern.

---

## Brand Logos

Every integration surface (import screen, onboarding, settings) must display the official brand logo for each integration. This is non-negotiable for visual quality — a text label without a logo looks unfinished. Looking at how Notion, Linear, and Zapier present their integration lists is the right design reference.

### Logo source

Use the `simple-icons` npm package for all brand logos. It provides official SVG icons with correct brand colors for every service listed below. Install in the frontend package:

```
npm install simple-icons
```

Usage pattern:
```js
import { siGoogledrive, siDropbox, siNotion, siMicrosoftonedrive, siAnki, siGooglecalendar, siApple, siQuizlet } from 'simple-icons';
// siGoogledrive.svg is the raw SVG string
// siGoogledrive.hex is the official brand color (e.g. '4285F4')
```

If `simple-icons` is already in the codebase, use the existing installation. Do not add it twice.

### Logo assignments

| Integration | simple-icons slug | Brand color (hex) | Usage |
|---|---|---|---|
| Google Drive (Docs, Slides, Sheets) | `siGoogledrive` | `4285F4` | Import screen, onboarding, settings card |
| Dropbox | `siDropbox` | `0061FF` | Import screen, onboarding, settings card |
| OneDrive | `siMicrosoftonedrive` | `0078D4` | Import screen, onboarding, settings card |
| Notion | `siNotion` | `000000` | Import screen, onboarding, settings card |
| Anki | `siAnki` | `0A5EAD` | Export button on flashcard set detail page |
| Google Calendar | `siGooglecalendar` | `4285F4` | ICS export dropdown option |
| Apple Calendar | `siApple` | `000000` | ICS export dropdown option |
| Quizlet | `siQuizlet` | `4257B2` | Import screen on flashcards page |

### Logo rendering

Create a shared `IntegrationLogo` component (or equivalent in the existing component system) that accepts a `simple-icons` icon object and an optional size prop. Renders the SVG inline at the specified size with the brand color applied. Example:

```jsx
// IntegrationLogo.jsx
export function IntegrationLogo({ icon, size = 24, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={`#${icon.hex}`}
      className={className}
      dangerouslySetInnerHTML={{ __html: icon.path }}
    />
  );
}
```

Use this component consistently everywhere logos appear. Do not use `<img>` tags or external URLs for logos — `simple-icons` keeps everything self-contained with no external requests and no broken images if a CDN goes down.

**Dark mode caveat:** For logos with `hex: '000000'` (Notion, Apple), invert to white (`FFFFFF`) when the app is in dark mode. Claude Code should check whether the existing codebase has a dark mode context or CSS variable for this.

### Integration card component

The import screen, onboarding, and settings all display integration options as cards. Create (or find in the existing codebase) a shared `IntegrationCard` component with this shape:

```
┌─────────────────────────────────────────┐
│  [Logo 32px]  Service Name              │
│               Short description         │
│                              [Button]   │
└─────────────────────────────────────────┘
```

- Logo: `IntegrationLogo` at 32px
- Service name: medium weight, matches the app's existing heading style
- Description: one line, secondary text color
- Button: "Connect", "Import", "Export", or "Connected" (with a checkmark) depending on state

This card is reused in all three surfaces. Claude Code should check whether an equivalent component already exists in the codebase (e.g., from the existing Google settings card) and extend it rather than creating from scratch.

---

---

## Overview

All integrations share a single purpose: get content into a Continuum `Note` document. The pipeline is always:

```
Source (Google / Dropbox / OneDrive / Notion / file upload)
  → Acquire content (OAuth picker, file download, API call, or upload)
  → Parse to plain text (officeparser, notion-to-md, or existing pdf-parse)
  → Export to PDF (for the Cloudinary viewer)
  → Create/update Note in MongoDB
```

This is identical to the existing Google Docs import flow (`POST /api/notes/import`). Every new integration is an extension of that same service, not a separate system.

---

## Parsing Responsibility

The backend service layer is responsible for all parsing. The frontend never parses content — it only acquires a file URL or structured API response and sends it to the backend.

### Parser assignment by source

| Source | File type received | Parser | Output |
|---|---|---|---|
| Google Docs | Plain text via `files.export` | Existing — no change | `content` field |
| Google Slides | PPTX via `files.export` | `officeparser` | `content` field |
| Google Sheets | XLSX via `files.export` | `officeparser` | `content` field |
| Dropbox | URL → download any Office/PDF file | `officeparser` or `pdf-parse` by MIME type | `content` field |
| OneDrive | URL → download any Office/PDF file | `officeparser` or `pdf-parse` by MIME type | `content` field |
| Notion | Block tree via `@notionhq/client` | `notion-to-md` → Markdown string | `content` field |
| Office file upload | Buffer from multipart upload | `officeparser` | `content` field |
| Quizlet TSV upload | Tab-separated `.txt` file | Custom 3-line parser | Populates `FlashcardSet` + `Flashcard` docs, not a Note |

### PDF generation for all sources

Every import (regardless of source) must also produce a PDF stored in Cloudinary, which populates `note.pdfUrl`. This is what the in-app viewer renders.

- For Google Slides and Sheets: Drive `files.export` with `mimeType: application/pdf` gives the PDF directly. Upload that buffer to Cloudinary.
- For Office files (from Dropbox, OneDrive, or direct upload): use `LibreOffice` headless conversion OR a Node.js library. **Check what the existing resume PDF flow does and use the same approach.** If the codebase already converts DOCX to PDF for resumes, reuse that exact service function here.
- For Notion: generate a PDF from the Markdown content using the existing approach (if one exists) or render Markdown to HTML and convert. If no PDF conversion exists in the codebase today, store `pdfUrl: null` for Notion imports on first pass and display the Markdown content inline instead. Do not block the feature on this.

---

## Integration 1 — Google Slides + Google Sheets

### How it works

No new OAuth. Users are already authenticated with `drive.file` scope via Google Picker. The only change is extending the Picker's MIME type filter to include Slides and Sheets alongside Docs.

**Frontend change:** The Google Picker config currently filters for `application/vnd.google-apps.document`. Add:
- `application/vnd.google-apps.presentation` (Slides)
- `application/vnd.google-apps.spreadsheet` (Sheets)

**Backend change:** The existing import endpoint receives a `googleDocId` and calls `files.export`. Add a branch based on the file's MIME type:
- If `presentation`: export as `application/vnd.openxmlformats-officedocument.presentationml.presentation` (PPTX), then parse with `officeparser`. Also export as `application/pdf` for Cloudinary.
- If `spreadsheet`: export as `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (XLSX), then parse with `officeparser`. Also export as `application/pdf` for Cloudinary.
- If `document` (existing): no change.

**`officeparser` usage for Slides:**
```js
const { parseOfficeAsync } = require('officeparser');
const config = { putNotesAtLast: true }; // speaker notes appended after slide text
const text = await parseOfficeAsync(buffer, config);
```

**`officeparser` usage for Sheets:**
```js
const text = await parseOfficeAsync(buffer); // extracts all cell text
```

**Note fields populated:**
- `source`: `'google_slides'` or `'google_sheets'` (extend the existing enum)
- `googleDocId`, `googleDocUrl`, `lastSyncedAt`: same as Docs
- `content`: plain text from `officeparser`
- `pdfUrl`: Cloudinary URL from PDF export
- `contentType`: new field or existing — store `'slides'` or `'spreadsheet'` so the UI can show an appropriate icon

**Refresh:** The existing `PUT /api/notes/:id/refresh` endpoint should work for Slides and Sheets with no changes if the source MIME type is stored and re-exported correctly.

---

## Integration 2 — Dropbox

### How it works

**Frontend:** Add a "Dropbox" button to the import screen. Embed the Dropbox Chooser SDK (`https://www.dropbox.com/static/api/2/dropins.js`). On click, the Chooser popup opens. User selects a file. On success, the SDK returns an array of objects each containing `{ name, link, bytes, icon, isDir }`. `link` is a direct download URL valid for a short period. Send `{ name, link }` to the backend.

No persistent OAuth token storage needed for the Chooser. The Dropbox app key goes in the frontend env (it is a public key — safe to expose).

**Backend:** `POST /api/notes/import/dropbox`
1. Receive `{ name, downloadUrl }` from the frontend.
2. Download the file buffer from `downloadUrl` using `axios` or `fetch`.
3. Detect file type from file extension or `Content-Type` header.
4. Route to the correct parser:
   - `.pdf` → `pdf-parse` (existing)
   - `.docx`, `.pptx`, `.xlsx`, `.odt`, `.odp`, `.ods` → `officeparser`
5. Generate PDF for Cloudinary viewer (see PDF generation section above).
6. Create `Note` document.

**Note fields populated:**
- `source`: `'dropbox'`
- `externalUrl`: store the original Dropbox share URL (not the download link, which expires) so the "View original" button can open the file in Dropbox
- `content`: parsed plain text
- `pdfUrl`: Cloudinary URL

**"View original" link:** The Chooser returns a `link` that is a `?dl=0` preview URL. Store that as `note.googleDocUrl` (or rename/add field to `externalUrl`) so the frontend can render the "Open in Dropbox" button.

---

## Integration 3 — OneDrive

### How it works

OneDrive requires persistent OAuth. This is a full connected account integration.

**Settings — connect flow:**
1. User clicks "Connect OneDrive" in Settings → Connected Accounts.
2. Backend initiates MSAL OAuth flow: `GET /api/integrations/onedrive/auth` redirects to Microsoft login.
3. Callback at `GET /api/integrations/onedrive/callback` exchanges code for access + refresh tokens.
4. Store encrypted tokens on the `User` document (use the same AES-256-GCM pattern as Google OAuth tokens — see `GOOGLE_TOKEN_ENCRYPTION_KEY` in the existing codebase).
5. Redirect user back to settings with success state.

**Import flow:**
1. User clicks "Import from OneDrive" on the import screen.
2. Frontend embeds the OneDrive File Picker v8 SDK. The Picker opens in a popup using the stored access token (fetched fresh from the backend if needed).
3. User selects a file. Picker returns a DriveItem object containing `id`, `name`, `webUrl`, and a download URL.
4. Frontend sends `{ driveItemId, name, webUrl }` to `POST /api/notes/import/onedrive`.
5. Backend fetches the file content via Microsoft Graph API: `GET https://graph.microsoft.com/v1.0/me/drive/items/{id}/content`.
6. Parse with `officeparser` or `pdf-parse` based on file type.
7. Generate PDF, upload to Cloudinary.
8. Create `Note` document.

**Token refresh:** OneDrive access tokens expire in 1 hour. Before every Graph API call, check token expiry and refresh if needed using the stored refresh token. Use the same token refresh helper pattern as Google OAuth.

**Note fields populated:**
- `source`: `'onedrive'`
- `externalUrl`: `webUrl` from DriveItem (opens file in OneDrive/Office Online)
- `content`: parsed text
- `pdfUrl`: Cloudinary URL

**Required env vars:** `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_REDIRECT_URI`

---

## Integration 4 — Notion

### How it works

Notion requires OAuth. This is a full connected account integration.

**Settings — connect flow:**
1. User clicks "Connect Notion" in Settings → Connected Accounts.
2. `GET /api/integrations/notion/auth` redirects to Notion OAuth consent screen.
3. Callback at `GET /api/integrations/notion/callback` exchanges code for access token.
4. Notion OAuth tokens do not expire (no refresh token needed). Store the `access_token` encrypted on the `User` document.
5. Redirect user back to settings with success state.

**Import flow:**
1. User clicks "Import from Notion" on the import screen.
2. Frontend calls `GET /api/integrations/notion/pages` — backend uses `@notionhq/client` to call `notion.search({ filter: { value: 'page', property: 'object' } })` and returns a list of page titles and IDs.
3. Frontend renders a page picker (simple list with search).
4. User selects a page. Frontend sends `{ pageId, title }` to `POST /api/notes/import/notion`.
5. Backend:
   a. Fetches page blocks recursively using `notion.blocks.children.list()`. Paginate until `has_more` is false.
   b. Converts block tree to Markdown using `notion-to-md`.
   c. Stores Markdown as `content` on the Note.
   d. Generates PDF from content if a conversion path exists; otherwise sets `pdfUrl: null` and renders content inline.
   e. Sets `externalUrl` to the Notion page URL.

**Rate limits:** Notion allows 3 requests/second per integration. For large pages with many nested blocks, use a queue or sequential fetching with small delays. Do not make parallel block requests.

**Note fields populated:**
- `source`: `'notion'`
- `externalUrl`: Notion page URL (from `page.url` in the API response)
- `content`: Markdown string from `notion-to-md`
- `pdfUrl`: Cloudinary URL if generated, otherwise `null`
- `contentType`: `'markdown'`

**Required env vars:** `NOTION_CLIENT_ID`, `NOTION_CLIENT_SECRET`, `NOTION_REDIRECT_URI`

---

## Integration 5 — Microsoft Office File Upload

### How it works

No OAuth. Pure file upload. This is an extension of the existing resume upload endpoint pattern.

**Frontend:** Add `.docx`, `.pptx`, `.xlsx` to the accepted MIME types on the import screen's drag-and-drop zone. The existing file upload component likely already handles PDF — add Office types to the same component.

**Backend:** Extend the existing note creation flow to handle Office file uploads. When the uploaded file is not a PDF:
1. Pass the file buffer to `officeparser.parseOfficeAsync(buffer)`.
2. Use the extracted text as `content`.
3. Generate a PDF from the file (see PDF generation section).
4. Upload PDF to Cloudinary, store as `pdfUrl`.
5. Create `Note` document.

**Note fields populated:**
- `source`: `'upload'` (same as existing PDF upload, unless you want `'office_upload'`)
- `content`: parsed text from `officeparser`
- `pdfUrl`: Cloudinary URL

**File size limit:** Apply the same 10MB limit currently used for resumes.

---

## Integration 6 — Anki Export (Outbound)

### How it works

No auth, no external service. A download endpoint.

**New endpoint:** `GET /api/flashcard-sets/:id/export/anki`

1. Fetch the `FlashcardSet` and its `Flashcard` documents.
2. Verify ownership (same auth middleware as all other flashcard endpoints).
3. Install and use `anki-apkg-export` npm package:
   ```js
   const AnkiExport = require('anki-apkg-export').default;
   const apkg = new AnkiExport(set.title);
   cards.forEach(card => apkg.addCard(card.front, card.back));
   const zip = await apkg.save();
   ```
4. Set response headers: `Content-Type: application/octet-stream`, `Content-Disposition: attachment; filename="${set.title}.apkg"`.
5. Send the binary zip as the response body.

**Frontend:** "Export to Anki" button on the FlashcardSet detail page. Triggers a file download via `window.location` or an anchor tag with `download` attribute pointing to the endpoint with the auth token.

**No new npm packages if possible:** Check whether `better-sqlite3` or `sql.js` is already in the codebase — `anki-apkg-export` uses SQLite internally. If there are conflicts, `anki-apkg` is an alternative with the same API.

---

## Integration 7 — ICS Calendar Export (Outbound)

### How it works

Two modes: one-time download and subscribable URL.

**npm package:** `ical-generator` — generates valid RFC 5545 ICS files.

**Mode 1 — One-time download:**
`GET /api/calendar/export.ics?from=YYYY-MM-DD&to=YYYY-MM-DD`
- Protected by standard JWT auth middleware.
- Fetches all tasks in the date range (including shared tasks the user participates in).
- Converts each task to an iCal event: `summary` = task title, `start`/`end` = `dueDate`, `description` = linked note title if present.
- Returns ICS file with `Content-Type: text/calendar`.

**Mode 2 — Subscribable URL (preferred):**
`GET /api/calendar/subscribe/:calToken.ics`
- `calToken` is a long-lived read-only token stored on the `User` document, generated on first request.
- Not protected by JWT — calendar apps poll this URL without login. The token itself is the credential.
- Returns the same ICS content but always covers a rolling window (e.g., 30 days back, 90 days forward).
- Add `POST /api/calendar/subscribe/reset` to rotate the token if the user wants to revoke access.

**Frontend:** "Export to Calendar" button on the Calendar page with two options in a dropdown: "Download .ics file" and "Copy subscribe URL." Copy subscribe URL puts the `GET /api/calendar/subscribe/:calToken.ics` URL on the clipboard so users can paste it into Apple Calendar, Outlook, or Google Calendar's "Subscribe to calendar" feature.

---

## Integration 8 — Quizlet Import (Inbound, Flashcards)

### How it works

No auth, no OAuth. File upload that creates a `FlashcardSet`, not a `Note`.

**How users export from Quizlet:**
1. Open any Quizlet set → "..." menu → Export
2. Choose "Tab" as the separator between term and definition, "New line" between cards
3. Download the `.txt` file

The resulting file looks like:
```
Term one\tDefinition one
Term two\tDefinition two
```

**New endpoint:** `POST /api/flashcard-sets/import/quizlet`
- Accepts multipart file upload (`.txt` or `.csv`).
- Parse: `const cards = fileText.split('\n').filter(Boolean).map(line => { const [front, back] = line.split('\t'); return { front, back }; });`
- Validate: reject if fewer than 2 cards or if tab delimiter is missing (wrong file format).
- Create `FlashcardSet` document with `isAIGenerated: false`, `source: 'quizlet_import'`.
- Bulk insert `Flashcard` documents.
- Return the new set.

**Frontend:** "Import from Quizlet" button on the Flashcards page (near the "Create set" button). Opens a file upload modal with a tooltip: "Export your Quizlet set as a .txt file (Term tab Definition format), then upload it here." Include a small screenshot or GIF of the Quizlet export steps.

---

## UI Surfaces — Where Logos Appear

Logos appear in three places in the app. All three must be consistent.

### Surface 1 — Onboarding

The onboarding flow should include a step titled something like "Connect your tools" or "Import your notes." This step shows integration cards for each inbound integration using the `IntegrationCard` component described in the Brand Logos section above.

- Google Drive (Docs, Slides, Sheets) — Google Drive logo
- Dropbox — Dropbox logo
- OneDrive — OneDrive logo
- Notion — Notion logo

Cards for OAuth-required services (OneDrive, Notion) show a "Connect" button that initiates the OAuth flow in a popup window, then updates the card to "Connected" with a green checkmark on return. Cards for non-OAuth services (Google Drive — already connected via existing auth, Dropbox — no persistent auth needed) show an "Import" button directly.

All cards can be skipped. This step is not a blocker — "Skip for now" at the bottom.

Check how the existing onboarding flow handles the Google Drive connection step and follow the same pattern for new services.

### Surface 2 — Import Screen (Notes)

The import screen (wherever "Import from Google Drive" currently lives) becomes a multi-source picker grid. Each source is an `IntegrationCard`. Layout: 2-column grid on desktop, 1-column on mobile.

Sources shown:
1. Google Drive — Google Drive logo — "Import Docs, Slides, or Sheets" — opens existing Picker (extended to show Slides + Sheets)
2. Dropbox — Dropbox logo — "Import from Dropbox" — triggers Chooser SDK popup
3. OneDrive — OneDrive logo — "Import from OneDrive" — shows "Connect first" state if not connected, otherwise opens picker
4. Notion — Notion logo — "Import a Notion page" — shows "Connect first" state if not connected, otherwise opens page browser

File upload (DOCX, PPTX, XLSX, PDF) is a native product feature, not an integration. It does not get a card on this screen. It lives as a drag-and-drop zone or "Upload file" button in the standard note creation flow, separate from the integrations grid.

For sources requiring a connected account (OneDrive, Notion), if not yet connected the card button reads "Connect to import" and clicking it initiates the OAuth flow inline (popup), then immediately proceeds to the picker on success without requiring the user to click again.

### Surface 3 — Settings → Integrations

The settings integrations section shows all services with their current connection status.

**Import integrations (shows connection state):**
- Google Drive — Google Drive logo — "Connected" (always, since Google auth is app-wide) or "Connect Google" if not linked
- Dropbox — Dropbox logo — "No account needed" badge (Chooser requires no persistent connection)
- OneDrive — OneDrive logo — "Connected" / "Connect OneDrive"
- Notion — Notion logo — "Connected" / "Connect Notion"

**Export integrations (informational, no connection state):**
- Anki — Anki logo — "Export flashcard sets as .apkg files" — links to flashcard sets page
- Google Calendar + Apple Calendar — both logos side by side — "Subscribe to your task calendar" — shows the subscribe URL with a copy button
- Quizlet — Quizlet logo — "Import existing Quizlet decks" — links to flashcard import

For connected accounts (OneDrive, Notion), show a "Disconnect" button that clears the stored tokens. Mirror exactly how Google disconnect works today — same UX shape, same confirmation behavior.

---

## Shared Infrastructure Changes

### `Note.source` enum extension
The existing `source` field on `Note` likely has values like `'manual'`, `'google_docs'`, `'pdf_upload'`. Extend the enum to include:
`'google_slides'`, `'google_sheets'`, `'dropbox'`, `'onedrive'`, `'notion'`, `'office_upload'`

### `Note.externalUrl` field (new or rename)
Notes imported from Google Docs already store `googleDocUrl` for the "View in Google Docs" button. For non-Google sources, a generic `externalUrl` field should store the equivalent link (Dropbox preview URL, OneDrive webUrl, Notion page URL). Check if the existing schema uses `googleDocUrl` for this purpose and whether it should be kept as-is for Google sources with `externalUrl` added for others, or unified into one field. Claude Code should assess the cleanest approach given the current schema.

### Connected accounts settings UI
OneDrive and Notion require a "Connected Accounts" section in Settings. This already exists for Google (link/unlink). Extend it to show OneDrive and Notion connection cards with connect/disconnect actions. The disconnect flow should delete the stored tokens and set a flag on the User document.

### Import screen
The current import flow is likely tied to Google Drive. It needs to become a multi-source picker:
- "Google Drive" (existing — Docs, Slides, Sheets)
- "Dropbox" (Chooser SDK button)
- "OneDrive" (picker, requires connected account)
- "Notion" (page browser, requires connected account)
- "Quizlet" (redirects to flashcards import, not notes)

Note: file upload (PDF, DOCX, PPTX, XLSX) is not listed here — it is a native feature in the note creation flow, not an integration source.

### `officeparser` installation
`npm install officeparser` in the backend package. Verify it does not conflict with any existing dependency. The library has no native binary dependencies — it is pure JavaScript.

### New env vars required
```
DROPBOX_APP_KEY              # public key, safe for frontend env too
MICROSOFT_CLIENT_ID
MICROSOFT_CLIENT_SECRET
MICROSOFT_REDIRECT_URI
NOTION_CLIENT_ID
NOTION_CLIENT_SECRET
NOTION_REDIRECT_URI
```

---

## What Is Not Changing

- The Groq AI pipeline (summaries, flashcards) is unchanged. Once `content` is populated on a Note, AI generation works identically regardless of source.
- The existing Google Docs import endpoint is not being rewritten — only extended.
- The Cloudinary upload pattern is unchanged. New integrations reuse the existing upload helper.
- Redis caching for notes is unchanged. `source` is not part of the cache key.
- The Android app's `OwnerRefJsonAdapter` and API coverage do not need changes in this phase — the new endpoints follow the same response shape as existing note endpoints.

---

## Implementation Order (Suggested)

All of the following ship in a single PR.

1. `officeparser` install (no new OAuth, lowest risk — do this first)
2. Google Slides + Sheets (zero new auth, extends existing picker)
3. Anki export (single endpoint, no external service)
4. ICS calendar export (single endpoint, no external service)
5. YouTube import (single endpoint, no auth, URL input only)
6. Dropbox (frontend SDK + one new backend endpoint, no persistent token)
7. Notion (OAuth + connected accounts UI + import flow)
8. OneDrive (OAuth + connected accounts UI + picker + import flow)

Items 1–5 have no new OAuth flows and can be built in any order. Items 6–8 introduce new connected account infrastructure and should be built after the import screen is refactored to support multiple sources.

---

## Parser Deep Dives

Before Claude Code writes any implementation, read this section in full. It covers exactly how each parser works, what it returns, known limitations, and how to handle edge cases. Do not assume parser behavior from the library name alone.

---

### Current Parser: pdf-parse (Resume Upload — Reference Implementation)

**Find in codebase:** Search for `pdf-parse` in `package.json` and locate the service function that calls it — likely in the resume upload flow. This is the canonical reference for all PDF text extraction. Every new integration that receives a PDF should call the same existing service function, not create a parallel implementation.

**What it does:**
`pdf-parse` is a pure TypeScript, cross-platform module for extracting text, images, and tables from PDFs. It wraps Mozilla's PDF.js engine and returns a plain text string from any PDF buffer.

**Basic usage pattern (already in codebase):**
```js
const pdfParse = require('pdf-parse');
const data = await pdfParse(dataBuffer);
const text = data.text;         // full extracted text as a string
const numPages = data.numpages; // page count
const info = data.info;         // metadata: title, author, creation date
```

**Known limitations to handle explicitly:**

1. **Scanned PDFs return empty string.** There is no OCR. If `data.text.trim().length === 0` after parsing, return a user-facing error: `"This PDF appears to be a scanned image. Please upload a PDF with selectable text."` Never pass an empty string to Groq — it will return garbage output.

2. **Column layouts produce garbled text.** Two-column academic papers and newspaper-style PDFs are read left-to-right across the full page width rather than column by column. This is a known PDF.js limitation with no clean fix. Acceptable for now — document as a known issue.

3. **Password-protected PDFs throw.** Catch this error specifically and return: `"This PDF is password-protected. Please upload an unlocked version."`

4. **Worker setup on Render.** `pdf-parse` requires additional worker configuration in serverless/hosted environments. If parsing hangs or errors on Render, check the `docs/troubleshooting.md` in the package for the worker setup steps. This is a known deployment gotcha.

**Node.js version compatibility:** Requires Node.js 20 (>= 20.16.0), 22, 23, or 24. Node.js 21 and 19 and earlier are explicitly not supported. Verify the backend's Node.js version before assuming `pdf-parse` works in a new environment.

---

### New Parser: officeparser (DOCX, PPTX, XLSX and Open Document equivalents)

**Install:** `npm install officeparser` in the backend package.

**What it does:**
`officeparser` is a robust, strictly-typed Node.js library for parsing office files into a rich Abstract Syntax Tree (AST) and generating output in multiple formats. It parses: docx, pptx, xlsx, odt, odp, ods, pdf, rtf, csv, md, html. It generates: Markdown, HTML, CSV, plain text, and RAG chunks.

For Continuum the primary output is **plain text** for the Groq `content` field. Markdown output is a secondary option for DOCX imports where heading structure should be preserved.

**Buffer support (required — no file paths):**
As of April 2023, `officeparser` supports file buffers directly on `parseOfficeAsync`. This is essential for Continuum since content never writes to disk — it arrives as buffers from multer uploads, axios downloads, or Google Drive exports.

```js
const { parseOfficeAsync } = require('officeparser');

// Plain text — use for PPTX, XLSX, and Dropbox/OneDrive general imports
const text = await parseOfficeAsync(buffer);

// PPTX with speaker notes appended after slide text (recommended for lectures)
const text = await parseOfficeAsync(buffer, { putNotesAtLast: true });

// DOCX as Markdown — preserves heading hierarchy for better AI summaries
const markdown = await parseOfficeAsync(buffer, { outputFormat: 'md' });
```

**Configuration options relevant to Continuum:**

| Option | Default | When to use |
|---|---|---|
| `putNotesAtLast` | false | PPTX imports. Appends speaker notes after slide text. Turn ON by default — speaker notes contain the actual lecture explanation; slide bullets alone are often useless for Groq. |
| `ignoreNotes` | false | Only if speaker notes are confirmed irrelevant. Leave false for Continuum. |
| `outputFormat` | `'text'` | Use `'md'` for DOCX to preserve `# Heading` structure. Use `'text'` for PPTX and XLSX. |
| `newlineDelimiter` | `\n` | Leave as default. |

**Per-format behavior and recommendations:**

*DOCX (Word):*
Extracts all paragraph text, headings, table cell content, and list items in document order. Heading hierarchy is preserved in the AST. Use `outputFormat: 'md'` — Groq receives structured Markdown with heading syntax rather than a flat blob, producing noticeably better summaries and flashcard extraction.

*PPTX (PowerPoint / Google Slides export):*
Extracts slide text in slide order. Speaker notes are appended at the end when `putNotesAtLast: true`. Always use this option for Continuum — lecture slides without notes are often just bullet fragments, but the notes contain the full explanation. After parsing, optionally prepend `[Slide N]` markers before each slide's text block to help Groq reference specific slides in summaries.

*XLSX (Excel / Google Sheets export):*
Extracts all cell text values across all sheets. Does not preserve formulas — only computed cell values. Sheet names appear as section headers in the output. For Groq, prepend the prompt context: "The following content is from a spreadsheet. Treat each row as a data record." Raw cell text without framing produces poor summaries.

**Dependency check after install:**
As of October 2024, `officeparser` uses `yauzl` for in-memory zip extraction (no disk writes). Run `npm ls yauzl` after install to verify it does not conflict with any existing dependency.

**Single service function — required pattern:**
Create one `parseOfficeFile(buffer, mimeType, options)` function in a new or existing service file. All integrations call this function. Controllers never call `pdf-parse` or `parseOfficeAsync` directly.

```js
// services/fileParser.service.js
async function parseOfficeFile(buffer, mimeType, options = {}) {
  if (mimeType === 'application/pdf') {
    const data = await pdfParse(buffer);
    if (!data.text?.trim()) {
      throw new Error('PDF contains no extractable text. It may be a scanned image.');
    }
    return data.text;
  }

  const text = await parseOfficeAsync(buffer, options);
  if (!text?.trim()) {
    throw new Error('No text content could be extracted from this file.');
  }
  return text;
}
```

**Error handling for unsupported types:**
```js
} catch (err) {
  if (err.message?.includes('Unsupported file type')) {
    throw new Error('File type not supported. Please upload DOCX, PPTX, XLSX, or PDF.');
  }
  throw err;
}
```

---

### New Parser: notion-to-md + @notionhq/client (Notion Pages)

**Install:** `npm install @notionhq/client notion-to-md` in the backend package.

**Version:** Use `notion-to-md@^3.1.9` (v3 stable). v4 is in alpha and introduces breaking architectural changes. Check npm for the latest stable v3 release before installing.

**What it does:**
`notion-to-md` converts Notion pages and blocks to Markdown, supporting nesting, via `notion-sdk-js`. Handles all standard block types: paragraphs, headings, bulleted/numbered lists, toggles, callouts, code blocks, tables, and quotes. Output is a Markdown string stored as `note.content`.

**Full import flow:**
```js
const { Client } = require('@notionhq/client');
const { NotionToMarkdown } = require('notion-to-md');

// Initialize with the user's decrypted Notion access token
const notion = new Client({ auth: userNotionAccessToken });
const n2m = new NotionToMarkdown({ notionClient: notion });

// Step 1: fetch all top-level blocks with pagination
async function fetchAllBlocks(notion, blockId) {
  const blocks = [];
  let cursor = undefined;
  do {
    const response = await notion.blocks.children.list({
      block_id: blockId,
      page_size: 100,
      start_cursor: cursor,
    });
    blocks.push(...response.results);
    // Rate limit: 3 req/sec per integration token
    if (response.has_more) await new Promise(r => setTimeout(r, 400));
    cursor = response.has_more ? response.next_cursor : undefined;
  } while (cursor);
  return blocks;
}

// Step 2: convert blocks to Markdown AST
const blocks = await fetchAllBlocks(notion, pageId);
const mdBlocks = await n2m.blocksToMarkdown(blocks);

// Step 3: convert AST to Markdown string
const { parent: markdownString } = n2m.toMarkdownString(mdBlocks);
// markdownString is now ready to store as note.content
```

**Pagination — critical detail:**
By default `notion-to-md` converts only 100 blocks and silently ignores the rest. A Notion lecture note page can easily have 200+ blocks. Always use the explicit pagination loop above rather than relying on the `totalPage` argument. Check `response.has_more` on every request.

**Rate limiting:**
Notion allows 3 requests/second per integration token. The 400ms delay in the pagination loop keeps fetches within this limit. Do not parallelize block requests.

**Nested child blocks — V1 limitation:**
`n2m.blocksToMarkdown()` processes only the top-level blocks passed to it. Nested content inside toggles, synced blocks, or child pages will be absent from the import. This is an acceptable V1 limitation. Document in the import UI: "Nested toggle content and child pages are not imported." Add recursive fetching post-launch if users request it.

**Output characteristics:**
A typical Notion lecture note page produces clean Markdown:
```markdown
# Lecture 4: Binary Trees

## Key Concepts
- A binary tree has at most 2 children per node
- Height of a balanced tree is O(log n)

## Code Example
```python
def height(node):
    if node is None: return 0
    return 1 + max(height(node.left), height(node.right))
```
```

**Storage:** Store as `note.content`. Set `note.contentType = 'markdown'` so the frontend renders it with a Markdown renderer. Verify this enum value exists on the Note schema or add it.

**Groq compatibility:** Groq handles Markdown input well. Heading structure (`#`, `##`) produces better structured summaries and flashcard extraction than flat text. No prompt modification needed for Markdown input.

---

## Future Idea — Marketing Page Refresh: "Works With Your Tools"

This section is not an implementation task for this spec. It is a product and marketing direction to execute after integrations are shipped and stable. Add to the backlog.

### The positioning shift

The current marketing page communicates what Continuum *is*. After integrations ship, the page can communicate something more powerful: Continuum works *with* everything a student already uses. The framing shifts from "switch to Continuum" to "bring your existing tools into Continuum."

This removes the primary conversion objection before the visitor voices it. Students do not want to abandon years of Google Docs notes or Quizlet decks. Showing them upfront that they do not have to is a meaningful conversion driver — it is the difference between "interesting product" and "I should try this today."

### Specific changes to make

**1. Integration logo strip (high priority)**
A row of brand logos placed below the hero, above feature sections: Google Drive, Dropbox, OneDrive, Notion, Anki, Quizlet. Use the same `simple-icons` package and `IntegrationLogo` component built for the app.

Design: logos grayscale by default, full brand color on hover. Label: "Works with the tools you already use." On mobile, show 4 logos with "+more" to prevent wrapping.

This pattern (Zapier, Notion, Linear all use it) signals ecosystem maturity before a single feature is read.

**2. Import flow feature section**
A dedicated marketing section showing the end-to-end import experience: Google Slides lecture → Continuum import → AI flashcard set generated. This is the core value proposition made concrete and visual. A short animated demo or static before/after screenshot is more persuasive than any bullet list.

Show the source logo → Continuum logo → output as a three-step visual. List Notion, Dropbox, OneDrive as secondary sources with "and more" copy beneath.

**3. Export callout**
A smaller callout (not a full section) for the outbound direction. Copy: "Already use Anki? Export any flashcard set with one click." This speaks directly to the large cohort of students already invested in Anki who were previously unable to use Continuum alongside it.

**4. Quizlet migration CTA**
A specific callout targeting Quizlet users: "Switching from Quizlet? Import your existing decks in seconds." Quizlet removed free features in 2022, creating a persistent cohort of students actively looking for alternatives. This is a direct acquisition message for that group that costs nothing to add.

### Timing rule

Do not update the marketing page until Dropbox, Google Slides/Sheets, and Quizlet import are all shipped and tested with real files. The logos on the marketing page create an implicit promise. A broken or missing integration after a user clicks through from a logo is a trust-destroying experience — worse than not advertising the integration at all.

Sequence:
1. Ship integrations per implementation order in this spec
2. Validate each import flow with real test files from each source
3. Update marketing page: logo strip + import section + export callout + Quizlet CTA
4. Verify onboarding integration step uses identical copy and logos as the marketing page

---

## Content Normalization — The Most Important Section in This Spec

This section supersedes any conflicting guidance in the individual integration sections above. Read this before touching any parser.

### The Core Requirement

No matter what a user imports — a Google Doc, a PowerPoint lecture, an Excel sheet, a Notion page, a Word document — the resulting note must look identical in the app. Same rendering, same structure, same experience. The source of the content is invisible to the user after import. This is the core product promise of the integration feature.

### What Claude Code Must Investigate First

**Do not make any decisions about the internal content format until you have read the existing codebase.** Specifically:

1. **How is `note.content` currently stored?** Find the Note model and check the `content` field type. Is it plain text, HTML, Markdown, or a rich text format like ProseMirror JSON?

2. **How does the note viewer render content?** Find the frontend note viewer component. What does it pass `note.content` to — a plain `<p>` tag, a Markdown renderer (`react-markdown`, `marked`), a rich text renderer (TipTap, Quill, ProseMirror), or an HTML renderer (`dangerouslySetInnerHTML`)?

3. **How does the existing Google Docs import store content?** The current `POST /api/notes/import` endpoint already parses a Google Doc into `note.content`. Find what format that produces and trace how the frontend renders it. This is the ground truth for what "working correctly" looks like — every new integration must match it.

4. **What is the existing tooltip system?** Find where tooltips are implemented in the note viewer. What data do they consume — positions in the text, heading anchors, user-defined ranges, or something else? Understanding this determines what structure new imports need to produce to be compatible.

5. **Does an existing content normalization function exist?** Search for any existing `normalize`, `parseContent`, or `formatContent` utility in the backend services. If one exists, extend it. Do not create a parallel one.

The answers to these five questions determine the entire implementation approach for content normalization. The spec cannot prescribe the internal format in advance without seeing the codebase — that decision belongs to Claude Code after investigation.

### The Goal, Format-Agnostic

Whatever format the investigation reveals as the current standard, the normalization requirement is:

**Every parser's output must be converted to match that format before being stored.** The frontend has one rendering path. It does not branch on `note.source`.

The parsers available and their natural output formats are:
- `officeparser` — can output plain text, Markdown, HTML, or AST. Use whichever matches the existing format.
- `notion-to-md` — outputs Markdown. If the existing format is not Markdown, add a Markdown-to-X conversion step.
- `pdf-parse` — outputs plain text. Conversion to the existing format may be needed.
- Google Drive `files.export` — outputs plain text for Docs, PPTX buffer for Slides, XLSX buffer for Sheets.

### Header/Structure Extraction for the Tooltip System

Regardless of internal format, try to extract document structure — specifically headings — during import. Every source that supports heading detection should populate a `note.headings` field (or equivalent, check if this already exists on the schema) as an array of `{ level, text, anchor }` objects.

Sources with reliable heading detection:
- DOCX via `officeparser` — H1/H2/H3 styles map cleanly
- PPTX via `officeparser` — slide titles are natural headings
- Notion via `notion-to-md` — heading blocks are explicit in the API response
- XLSX via `officeparser` — sheet names are natural top-level headings

Sources with unreliable heading detection:
- PDF via `pdf-parse` — plain text with no structural metadata. Best effort only using heuristics (ALL CAPS short lines, lines ending in colon). Do not over-invest here.
- Google Docs plain text export — same limitation as PDF. If the Google Docs API is already used in the codebase (not just Drive export), heading styles can be extracted properly from the document structure.

Check how the existing tooltip system uses note structure today. If it already uses heading anchors, extend it. If it uses text positions or another mechanism, match that mechanism for new imports rather than introducing a new pattern.

### Testing Before Shipping

Before any integration goes to production, test it with a real file of each type:

- A Google Slides lecture deck with 15+ slides and populated speaker notes
- A Word document with H1/H2/H3 headings, body paragraphs, and a table
- A Notion page with headings, bullet lists, a code block, and a toggle
- An Excel sheet with multiple tabs and data tables
- A PDF of a lecture (scanned — to confirm the empty-string error fires correctly)

For each test file, verify:
1. `note.content` renders in the note viewer identically to how a manual note looks
2. Heading structure is captured correctly (check `note.headings` or equivalent)
3. Groq produces a coherent summary from the content — run manually in Postman before shipping
4. Groq produces usable flashcards from the content — run manually in Postman
5. The note viewer does not branch or behave differently based on `note.source`

If any test fails, fix the normalization before shipping. A broken import that produces garbled notes destroys user trust at the exact moment you are trying to build it.

---

## Integration 9 — YouTube Import (Inbound, Notes)

### How it works

No OAuth. No file upload. User pastes a YouTube URL.

This is the highest value import for students after Google Drive. Professors post lecture recordings to YouTube constantly. A student pastes the URL, Continuum pulls the transcript, and it becomes a note with AI summaries and flashcards in seconds. Zero friction.

**Frontend:**
On the import screen, add a "YouTube" source option with the YouTube logo (`siYoutube` from `simple-icons`, hex `FF0000`). Clicking it opens a simple URL input field — one text box, one "Import" button. No picker, no OAuth popup, no file chooser. Just a URL.

**Backend:** `POST /api/notes/import/youtube`

Request body: `{ url: 'https://www.youtube.com/watch?v=...' }`

1. Extract the video ID from the URL. Handle all YouTube URL formats:
   - `https://www.youtube.com/watch?v=VIDEO_ID`
   - `https://youtu.be/VIDEO_ID`
   - `https://www.youtube.com/embed/VIDEO_ID`
   - `https://www.youtube.com/live/VIDEO_ID`

2. Install and use `youtube-transcript-plus`:
```js
const { fetchTranscript, toPlainText } = require('youtube-transcript-plus');
const transcript = await fetchTranscript(videoId);
const text = toPlainText(transcript, ' '); // join segments with space
```

3. Fetch video metadata (title, channel name) to populate `note.title`. Use the `oEmbed` endpoint — no API key required:
```js
const meta = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
const { title, author_name } = await meta.json();
// note.title = title
// note.subtitle or metadata = author_name (channel = likely the professor)
```

4. Run the transcript text through the normalization pipeline (same as all other imports).
5. Set `note.externalUrl` to the original YouTube URL so the "View original" button opens the video.
6. Create Note document.

**Note fields populated:**
- `source`: `'youtube'`
- `title`: video title from oEmbed
- `content`: normalized transcript text
- `externalUrl`: original YouTube URL
- `pdfUrl`: `null` — no PDF viewer for YouTube imports. The "view original" button opens YouTube directly. Do not attempt to generate a PDF from a transcript.

**Error handling:**
- Video has no captions/transcript: `youtube-transcript-plus` throws `TranscriptsDisabled` or `NoTranscriptFound`. Return user-facing error: `"This video doesn't have captions available. Try a video with auto-generated or manual subtitles."`
- Invalid or private video: return `"This video couldn't be accessed. Make sure the URL is correct and the video is public."`
- Auto-generated captions exist but are low quality: this is acceptable — Groq's summarization handles noisy transcript text well. Do not filter or warn on this case.

**npm package:** `youtube-transcript-plus`
- Uses YouTube's internal Innertube API — no official API key required
- Supports both manual and auto-generated captions
- Supports translation (not needed for V1)
- Risk: uses undocumented YouTube endpoints. It may break if YouTube changes their internals. This is an accepted risk for a student-focused tool — the package has been maintained reliably and is widely used in production. If it breaks, swap to `youtube-transcript-node` (same interface, same risk profile).

**Logo:** Add `siYoutube` to the import screen and onboarding alongside the other integration logos.

---

## Updated Logo Table

Add YouTube to the brand logos section:

| Integration | simple-icons slug | Brand color (hex) | Usage |
|---|---|---|---|
| YouTube | `siYoutube` | `FF0000` | Import screen, onboarding |

All other logos from the earlier table remain unchanged.

---

## Testing Requirements

Every new endpoint and UI flow in this PR must have test coverage before the PR is merged. Follow the exact testing patterns already established in the codebase. Read the existing test suites before writing a single new test.

### Backend tests

All backend tests use Jest and Supertest against `mongodb-memory-server`. Follow the pattern of every existing test suite. Do not connect to Atlas in tests.

**Required test coverage for each new import endpoint:**

`POST /api/notes/import` extension (Google Slides, Google Sheets):
- Returns a Note with the correct `source` value
- Returns a Note with non-empty `content`
- Returns 400 if the file type is not supported
- Auth middleware rejects unauthenticated requests (401)
- Returns 400 if the Google file export returns empty content (mock the Drive API response)

`POST /api/notes/import/youtube`:
- Returns a Note with `source: 'youtube'` and non-empty `content` when a valid video ID is given
- Returns 400 with a user-friendly message when the video has no captions
- Returns 400 with a user-friendly message when the URL is invalid or the video ID cannot be extracted
- Auth middleware rejects unauthenticated requests (401)
- Does not set `pdfUrl` on the created Note

`POST /api/notes/import/dropbox`:
- Returns a Note with `source: 'dropbox'` and non-empty `content`
- Correctly routes DOCX, PPTX, XLSX, and PDF to the right parser
- Returns 400 for unsupported file types
- Auth middleware rejects unauthenticated requests (401)

`POST /api/notes/import/onedrive` and `POST /api/notes/import/notion`:
- Returns 401 if the user has not connected the respective account
- Returns a Note with correct `source` and non-empty `content` when properly authenticated
- Handles token expiry gracefully (mock an expired token response)
- Auth middleware rejects unauthenticated requests (401)

`GET /api/flashcard-sets/:id/export/anki`:
- Returns a binary response with correct `Content-Type: application/octet-stream`
- Returns correct `Content-Disposition` header with the set title as the filename
- Returns 404 if the flashcard set does not exist
- Returns 403 (or 404 per existing ownership convention) if the set belongs to another user
- Auth middleware rejects unauthenticated requests (401)

`GET /api/calendar/export.ics` and `GET /api/calendar/subscribe/:calToken.ics`:
- Returns a response with `Content-Type: text/calendar`
- ICS content contains at least one VEVENT for each task in the date range
- Subscribe endpoint does not require JWT auth (token in URL is the credential)
- Subscribe endpoint returns 404 for an invalid or unknown `calToken`
- Date range filtering works correctly (tasks outside range are excluded)

**Connected account OAuth endpoints** (`/api/integrations/onedrive/auth`, `/api/integrations/notion/auth`, and their callbacks):
- Callback stores encrypted tokens on the User document
- Callback redirects to the correct frontend URL on success
- Callback returns an error state on OAuth failure (user denied access)
- Tokens are encrypted at rest (verify the stored value is not the raw token)
- Disconnect endpoint removes tokens and clears the connected flag on User

### Web unit and E2E tests

Follow the existing Vitest unit test and Playwright E2E test patterns. Do not invent new testing infrastructure.

**Vitest unit tests:**
- `IntegrationLogo` component renders SVG with correct fill color for each brand
- URL parsing utility for YouTube correctly extracts video IDs from all four URL formats (watch, youtu.be, embed, live)
- `calToken` generation produces a URL-safe string of the expected length

**Playwright E2E tests:**
Add a new spec file for integrations. Cover:
- Import screen renders all integration cards with correct logos
- YouTube import: entering a URL and submitting creates a note visible in the notes list
- Anki export: clicking the export button on a flashcard set triggers a file download
- ICS export: "Copy subscribe URL" puts a valid URL on the clipboard
- Connected accounts: connecting and disconnecting Notion updates the card state in settings
- Onboarding integration step: all integration cards render with correct logos; step can be skipped

### Android tests

For any new API endpoints consumed by the Android app, add ViewModel and Repository unit tests following the existing MockK pattern. At minimum:
- `NotesViewModel` handles the new `source` values without crashing
- `NotesRepository` correctly calls the new import endpoints and maps responses to the existing Note data class
- Error states (no captions, unsupported file type) surface correctly in the ViewModel's error state

### Real file validation (manual, before merging)

Automated tests mock the parsers. Before the PR is merged, manually test with real files:

- A Google Slides deck with 10+ slides and speaker notes
- A Word document with headings and a table
- An Excel file with two sheets
- A Notion page with headings, bullets, and a code block
- A YouTube lecture video URL with auto-generated captions
- A Dropbox-hosted PDF

For each, verify in the running app:
1. The note appears in the notes list
2. The note content is readable and not garbled
3. AI summary generates successfully via Groq (run manually in the app)
4. AI flashcards generate successfully via Groq (run manually in the app)

---

## Copy Standards

These apply to every piece of user-facing text added in this PR: button labels, error messages, placeholder text, tooltips, onboarding copy, settings labels, and empty states.

**No em dashes.** Do not use the em dash character (--) anywhere in user-facing text. Use a comma, a colon, or rewrite the sentence instead.

Incorrect: "Import from Google Drive -- Docs, Slides, and Sheets"
Correct: "Import from Google Drive: Docs, Slides, and Sheets"

Incorrect: "No captions found -- try a different video"
Correct: "No captions found. Try a different video."

**Error messages must be user-friendly.** Never surface raw library errors, file parsing exceptions, or HTTP status codes to the user. Every error case in the testing section above has a specified user-facing message. Use those exact messages or improve them -- do not leave a raw error.

**Consistent button labels across all integration cards:**
- Not yet connected: "Connect"
- Already connected: "Connected" (with a checkmark icon, no button action)
- Disconnect action: "Disconnect"
- No auth needed (Dropbox, YouTube): "Import"
- Export actions: "Export to Anki", "Copy subscribe URL", "Download .ics"

**Confirmation copy for destructive or significant actions:**
- Making a note or flashcard set public (future): requires confirmation dialog
- Disconnecting an account: requires confirmation: "Disconnect [Service]? You will no longer be able to import files from this account."
- If any confirmation dialogs are added for other reasons, follow this pattern.
