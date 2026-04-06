# Plan: Marketing Pages Redesign — `feat/marketing-pages-refresh`

## Context

The marketing pages (landing, product, about, legal, auth) need a comprehensive visual redesign to match a unified, restrained design system. The authenticated app is intentionally out of scope and must not be touched. The spec (`docs/future-ideas/continuum-marketing-redesign.md`) is prescriptive — every change is specified exactly and must be followed without aesthetic interpretation.

---

## 1. Branch Confirmation

Currently on **`main`**. The branch `feat/marketing-pages-refresh` does not yet exist locally or remotely. It must be created before any code is written:

```
git checkout -b feat/marketing-pages-refresh
```

---

## 2. Font Setup Plan

### Current state
- Fonts loaded via npm packages (`@fontsource-variable/dm-sans`, `@fontsource/lora`) with `@import` at the top of `src/index.css`
- `tailwind.config.js`: `font-sans: ['DM Sans']`, `font-serif: ['Lora']`
- No `public/fonts/` directory exists

### Lora audit result — safe to remove
Lora is **completely unused**. The `@fontsource/lora` import exists in `index.css`, and it is referenced in:
- `index.css` line 202: `.page-title { font-family: 'Lora', serif }` — this class is **never used in any JSX file** (confirmed via full-codebase grep)
- `tailwind.config.js`: `font-serif: ['Lora']` — the `font-serif` Tailwind class is **never applied in any JSX file**

`Georgia, serif` is heavily used inline as headings across ~25 authenticated app files (Dashboard, Notes, Flashcards, Tasks, Calendar, Messages, and more) — but those reference Georgia as a system font, not Lora, and are completely out of scope. Removing the Lora import has zero effect on them.

**Decision: remove the 3 Lora `@import` lines from `index.css`, remove the `.page-title` class from `index.css`, and remove `font-serif` from `tailwind.config.js`.** This is a dead-code cleanup that happens to coincide with this redesign. No page's rendering changes.

### Font scoping decision (Q1 resolved — Option B)
Do **not** override `font-sans` or the global `body { font-family }` rule. DM Sans stays as the body font for the authenticated app. Instead:
- Add a `font-marketing` Tailwind token pointing to Plus Jakarta Sans
- Add a `font-display` Tailwind token pointing to Fraunces
- Apply `className="font-marketing"` on the outermost wrapper `<div>` of each marketing page and each auth page

### Steps

**Step 1 — User downloads font files manually**

Go to `https://gwfh.mranftl.com/fonts` and download the following. For each font, select **subset: latin** and **format: woff2 only**:

| Font | Styles to select | Files you will get |
|------|-----------------|-------------------|
| **Fraunces** | 700 (Bold), 900 (Black) | `fraunces-v32-latin-700.woff2`, `fraunces-v32-latin-900.woff2` |
| **Plus Jakarta Sans** | 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold) | `plus-jakarta-sans-v8-latin-400.woff2`, etc. |

After downloading, **rename the files** to this exact naming convention and place them at `web/public/fonts/`:

```
web/public/fonts/
  fraunces-700.woff2
  fraunces-900.woff2
  plus-jakarta-sans-400.woff2
  plus-jakarta-sans-500.woff2
  plus-jakarta-sans-600.woff2
  plus-jakarta-sans-700.woff2
```

**User confirms when files are in place before implementation continues.**

**Step 2 — Update `src/index.css`**
- Remove the 3 `@fontsource/lora` `@import` lines
- Remove the `.page-title` component class
- Add 6 `@font-face` blocks (verbatim from spec) using `url('/fonts/...')`, placed after the DM Sans `@import` and before `@tailwind base`
- Leave DM Sans import and all CSS variables untouched

**Step 3 — Update `tailwind.config.js`**
- Remove `font-serif: ['Lora', 'Georgia', 'serif']`
- Add to `theme.extend.fontFamily`:
  ```js
  display: ['Fraunces', 'Georgia', 'serif'],
  marketing: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
  ```
- Leave `font-sans: ['DM Sans']` untouched

**Step 4 — Apply scoped font**
On each marketing page and auth page, the outermost wrapper gets `className="font-marketing"`. This ensures Plus Jakarta Sans applies to all text within those pages without touching the global body rule.

**Step 5 — User verifies in browser**
DevTools → Network → Font. Confirm all 6 woff2 files load from localhost (not any CDN). User confirms before page implementation begins.

---

## 3. File Inventory

### Files to Modify

| File | Route(s) Served | Shared with Auth App? | Action |
|------|-----------------|-----------------------|--------|
| `web/src/index.css` | Global | Yes — global | Remove 3 Lora `@import` lines + `.page-title` class. Add 6 `@font-face` blocks. No other changes. |
| `web/tailwind.config.js` | Global | Yes — global | Remove `font-serif`. Add `font-display` and `font-marketing` tokens. Leave `font-sans` untouched. |
| `web/src/components/layout/MarketingNav.jsx` | `/`, `/product`, `/about`, `/privacy`, `/terms` | No — marketing-only | Safe to edit. Full nav redesign: sticky, backdrop blur, logo left, center links, CTA right. |
| `web/src/components/layout/MarketingFooter.jsx` | `/`, `/product`, `/about`, `/privacy`, `/terms` | No — marketing-only | Safe to edit. Full footer redesign: dark `#111827` background. |
| `web/src/pages/Landing.jsx` | `/` | No | Full redesign per spec. |
| `web/src/pages/Product.jsx` | `/product` | No | Full redesign per spec. |
| `web/src/pages/About.jsx` | `/about` | No | Full redesign per spec. |
| `web/src/pages/auth/Login.jsx` | `/login` | No | Split panel layout + full restyle. |
| `web/src/pages/auth/Register.jsx` | `/register` | No | Split panel layout + full restyle. Remove confirm-password field, add eye-icon toggle. |
| `web/src/pages/auth/ForgotPassword.jsx` | `/forgot-password` | No | Split panel layout + global auth styles. Headline: "Forgot your password?" Subtext: "Enter your email and we'll send you a reset link." Existing form logic untouched. |
| `web/src/pages/auth/ResetPassword.jsx` | `/reset-password` | No | Split panel layout + full restyle. Remove confirm-password field, add eye-icon toggle. Check/implement success and expired-link states. |
| `web/src/pages/legal/PrivacyPolicy.jsx` | `/privacy` | No | Background fix + full typography restyle. No CTA section — goes directly to footer. |
| `web/src/pages/legal/TermsOfService.jsx` | `/terms` | No | Background fix + full typography restyle. No CTA section — goes directly to footer. |

### Files to Create

| File | Purpose |
|------|---------|
| `web/public/fonts/fraunces-700.woff2` | User downloads manually |
| `web/public/fonts/fraunces-900.woff2` | User downloads manually |
| `web/public/fonts/plus-jakarta-sans-400.woff2` | User downloads manually |
| `web/public/fonts/plus-jakarta-sans-500.woff2` | User downloads manually |
| `web/public/fonts/plus-jakarta-sans-600.woff2` | User downloads manually |
| `web/public/fonts/plus-jakarta-sans-700.woff2` | User downloads manually |

### Shared Components — Handling

| Component | Used in Authenticated App? | Decision |
|-----------|---------------------------|----------|
| `Button.jsx` | Yes — pervasively across all app pages | **Do not edit.** Auth and marketing pages use inline button styles matching the spec. |
| `Input.jsx` | No — only auth pages | Technically safe, but auth pages will use inline `auth-input` styles per spec rather than editing the component. No change to `Input.jsx`. |
| `Card.jsx` | Yes — Notes, Flashcards, Calendar | **Do not edit.** All marketing card styling is inline. |
| `AuthLayout.jsx` | No — wraps auth routes only | Not edited. Each auth page implements the split panel grid directly within its own component. |
| `Avatar.jsx`, `Badge.jsx`, `Modal.jsx`, `Toast.jsx`, `Skeleton.jsx` | Yes | **Do not edit.** Not used on marketing pages. |

---

## 4. Global Pass Inventory

### 4a. Banned Colors Found (across all in-scope files)

| File | Line(s) | Banned Value | Replace With |
|------|---------|-------------|--------------|
| `Landing.jsx` | 25 | `#fffade` (stats section variable) | `#F8F9FA` |
| `Landing.jsx` | 100 | `#fef7ff` (page background) | `#F8F9FA` |
| `Landing.jsx` | 404 | `#fffade` (section background) | `#F8F9FA` |
| `Product.jsx` | 308 | `#fef7ff` (page background) | `#F8F9FA` |
| `About.jsx` | 32 | `#fef7ff` (page background) | `#F8F9FA` |
| `About.jsx` | 116 | `#fffade` (timeline accent) | `#F3F0FF` |
| `About.jsx` | 193 | `#fffade` (section background) | `#F8F9FA` |
| `PrivacyPolicy.jsx` | 147 | `#fef7ff` (page background) | `#F8F9FA` |
| `TermsOfService.jsx` | 155 | `#fef7ff` (page background) | `#F8F9FA` |
| `MarketingFooter.jsx` | 5 | `#fef7ff` (footer background) | `#111827` (full dark footer per spec) |

Individual feature cards with non-white backgrounds (Landing.jsx feature grid) are addressed during the Landing page pass — each card gets `background: #FFFFFF`.

### 4b. Georgia / Italic Serif Instances in In-Scope Files

All `fontFamily: 'Georgia, serif'` in in-scope files are replaced during the global pass. Headlines that become `font-display` (Fraunces) get `fontFamily: 'Fraunces, Georgia, serif'; fontStyle: 'normal'`. Body text incorrectly using Georgia gets `fontFamily: 'inherit'`.

| File | Instances | Lines |
|------|-----------|-------|
| `Landing.jsx` | 6 | 130, 250, 367, 417, 480, 518 |
| `Product.jsx` | 4 Georgia + 1 `fontStyle: italic` | 322, 350, 388, 422 (Georgia); 78 (italic sans) |
| `About.jsx` | 8 | 50, 69, 206, 228, 252, 351, 398 + one more |
| `PrivacyPolicy.jsx` | 2 | 153, 196 |
| `TermsOfService.jsx` | 2 | 161, 204 |
| `auth/Login.jsx` | 1 | 31 |
| `auth/Register.jsx` | 1 | 38 |
| `auth/ForgotPassword.jsx` | 2 | 35, 58 |
| `auth/ResetPassword.jsx` | 1 | 31 |

**Total: 28 instances across 9 in-scope files.** All removed in the global pass.

**Not touched:** `Georgia, serif` appears in ~25 authenticated app files (Dashboard, NotesList, NoteEditor, NoteDetail, FlashcardSets, FlashcardSetDetail, FlashcardHistory, StudyMode, Tasks, Calendar, Messages, Friends, ApplicationsList, ApplicationDetail, Resumes, Profile, Activity, UserProfile, MessagesLayout, Card.jsx, Modal.jsx, TaskDetailModal.jsx). These are out of scope and will not be touched.

---

## 5. Page Implementation Order

Strictly sequential. One commit per step. Report done before moving to the next.

| # | Step | Commit message |
|---|------|---------------|
| 1 | Font setup (after user places files: index.css @font-face + tailwind config + Lora removal) | `feat(marketing): self-host Fraunces and Plus Jakarta Sans, remove unused Lora` |
| 2 | Global pass (banned colors + Georgia/italic removal across all in-scope files) | `feat(marketing): global pass - banned colors and serif italic removal` |
| 3 | Landing page (`/`) | `feat(marketing): landing page redesign per spec` |
| 4 | Product page (`/product`) | `feat(marketing): product page redesign per spec` |
| 5 | About page (`/about`) | `feat(marketing): about page redesign per spec` |
| 6 | Sign In page (`/login`) | `feat(marketing): sign in page redesign per spec` |
| 7 | Sign Up page (`/register`) | `feat(marketing): sign up page redesign per spec` |
| 8 | Forgot Password page (`/forgot-password`) | `feat(marketing): forgot password page redesign per spec` |
| 9 | Reset Password page (`/reset-password`) | `feat(marketing): reset password page redesign per spec` |
| 10 | Terms of Service (`/terms`) | `feat(marketing): terms page redesign per spec` |
| 11 | Privacy Policy (`/privacy`) | `feat(marketing): privacy page redesign per spec` |
