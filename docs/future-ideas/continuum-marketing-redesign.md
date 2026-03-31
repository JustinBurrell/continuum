# Continuum — Marketing Pages Redesign Spec
**Branch: `feat/marketing-pages-refresh`**
**For Claude Code — Read completely before touching any file.**

---

## SCOPE — READ THIS FIRST, IT IS MANDATORY

This redesign covers **only** the following routes. Do not touch anything else.

| Route | Page |
|-------|------|
| `/` | Landing page |
| `/product` | Product page |
| `/about` | About page |
| `/privacy` | Privacy Policy |
| `/terms` | Terms of Service |
| `/login` | Sign In page |
| `/register` | Sign Up page |
| `/forgot-password` | Forgot Password page (enter email, request reset link) |
| `/reset-password` | Reset Password page (set new password after clicking email link) |

**DO NOT touch any of the following under any circumstances:**
- Any authenticated/dashboard routes: `/dashboard`, `/notes`, `/flashcards`, `/tasks`, `/calendar`, `/social`, `/career`, `/settings`, `/messages`, or any sub-route thereof
- Any backend files, API routes, controllers, services, or middleware
- Any route not listed in the table above
- Any shared component that is also rendered inside the authenticated app — check before editing any shared component. If it renders inside the dashboard, leave it alone and create a marketing-specific version instead.
- Any routing configuration, file structure, or component naming

The authenticated app UI is intentionally out of scope. It is working and should not be touched.

**When in doubt about whether something is in scope: stop and ask before touching it.**

---

## HOW TO USE THIS DOCUMENT

This is not a suggestion list. Every change described here must be implemented exactly as specified. Do not apply your own aesthetic judgment. Do not introduce new colors, fonts, animations, or layout patterns not described here. If something is not mentioned in this spec, leave it alone.

**You will work in two phases: Plan first, then implement.**

### Phase 1 — Plan Mode (do this before writing any code)

Read the entire spec. Then produce a written plan that covers:

1. **Branch confirmation** — confirm you are on `feat/marketing-pages-refresh` or state that you need to create it
2. **Font setup plan** — list the exact steps you will take to download, place, and configure Fraunces and Plus Jakarta Sans locally. State the exact directory path you will use for font files. State the exact Tailwind config change you will make. Ask if you are unsure about the project's directory structure before assuming.
3. **File inventory** — list every file you plan to modify or create, mapped to the route it serves. Flag any file that might be shared with the authenticated app and state how you will handle it (create a marketing-specific copy rather than editing the shared file).
4. **Global pass plan** — list every banned color and every instance of italic serif font styling you find across the in-scope files.
5. **Page order** — confirm the order you will implement pages: Landing → Product → About → Sign In → Sign Up → Forgot Password → Reset Password → Terms → Privacy.
6. **Questions** — if anything in the spec is ambiguous given the actual codebase structure, ask those questions now. Keep them minimal and specific.

Do not write any code during Phase 1. Wait for explicit approval of the plan before proceeding.

### Phase 2 — Implementation (only after plan is approved)

Work in this order:
1. Font setup first — download, place files, add `@font-face`, update Tailwind config, verify in browser
2. Global pass — banned colors and italic serif removal across all in-scope files, commit
3. Landing page — implement completely, commit, report done
4. Each remaining page — one at a time, commit after each, report done before moving on

Commit message format: `feat(marketing): [page name] redesign per spec`
Example: `feat(marketing): landing page redesign per spec`

The goal is a **consistent, professional, restrained design system** — not creative novelty. Every page should look like it came from the same product.

---

## GLOBAL DESIGN SYSTEM

These rules apply to every single page and component on the site. Apply them before anything else.

### Fonts — Self-Hosted Setup (Complete Instructions)

This project self-hosts all fonts locally for security and performance. No external CDN requests are allowed. Two new fonts are being introduced as part of this redesign and must be downloaded and configured before any styling work begins.

**The two fonts:**
- **Fraunces** — used for all marketing page hero headlines and section headlines only. Variable serif with optical sizing. Gives the site editorial weight and visual distinction at large sizes.
- **Plus Jakarta Sans** — used for all body text, UI labels, buttons, nav, cards, and any text under ~24px. Modern geometric sans, cleaner and more distinctive than Inter.

**Step-by-step font setup — complete this before writing any CSS or component code:**

**1. Download the font files**
Go to `https://gwfh.mranftl.com/fonts` (google-webfonts-helper — a tool for downloading self-hosted Google Fonts as `.woff2` files with generated `@font-face` CSS).

Download **Fraunces**:
- Select subsets: `latin`
- Select styles: `700` (Bold), `900` (Black)
- Download the `.woff2` files only (modern browsers, no need for `.woff` or `.ttf`)

Download **Plus Jakarta Sans**:
- Select subsets: `latin`
- Select styles: `400` (Regular), `500` (Medium), `600` (SemiBold), `700` (Bold)
- Download the `.woff2` files only

**2. Place the files**
Find where the current project stores local font files. Look for a `fonts/` directory inside `public/` or `src/assets/`. Place all downloaded `.woff2` files there. If no fonts directory exists yet, create `public/fonts/` and place them there.

File naming convention to use:
```
fraunces-700.woff2
fraunces-900.woff2
plus-jakarta-sans-400.woff2
plus-jakarta-sans-500.woff2
plus-jakarta-sans-600.woff2
plus-jakarta-sans-700.woff2
```

**3. Add @font-face declarations**
Open the global CSS file (likely `src/index.css` or `src/styles/global.css`). Add the following `@font-face` blocks. Adjust the `url()` paths to match wherever you placed the files in step 2:

```css
@font-face {
  font-family: 'Fraunces';
  src: url('/fonts/fraunces-700.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Fraunces';
  src: url('/fonts/fraunces-900.woff2') format('woff2');
  font-weight: 900;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Plus Jakarta Sans';
  src: url('/fonts/plus-jakarta-sans-400.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Plus Jakarta Sans';
  src: url('/fonts/plus-jakarta-sans-500.woff2') format('woff2');
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Plus Jakarta Sans';
  src: url('/fonts/plus-jakarta-sans-600.woff2') format('woff2');
  font-weight: 600;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Plus Jakarta Sans';
  src: url('/fonts/plus-jakarta-sans-700.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
```

**4. Register fonts in Tailwind**
Open `tailwind.config.js`. Add both fonts to the `fontFamily` key inside `theme.extend`:

```js
theme: {
  extend: {
    fontFamily: {
      display: ['Fraunces', 'Georgia', 'serif'],
      sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
    },
  },
},
```

This means:
- `font-display` Tailwind class → Fraunces (headlines only)
- `font-sans` Tailwind class → Plus Jakarta Sans (everything else)

The fallback chain ensures the page is still readable if fonts fail to load.

**5. Set the base font**
In the global CSS file, update or add the base body rule:

```css
body {
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
}
```

**6. Verify before continuing**
Load the site in the browser. Open DevTools → Network → filter by "Font". Confirm:
- `fraunces-700.woff2` and `fraunces-900.woff2` are loading from localhost (not fonts.googleapis.com)
- All four Plus Jakarta Sans weights are loading from localhost
- Zero requests to any external font CDN

If any font is loading from an external URL, stop and fix it before proceeding.

**Font usage rules throughout this spec:**
- `font-display` (Fraunces): hero headlines, section headlines only — any `text-4xl` and above on marketing pages
- `font-sans` (Plus Jakarta Sans): everything else — body, nav, buttons, cards, labels, captions, legal pages
- Do NOT use Fraunces below `text-3xl`
- Do NOT add any new `@import` or `<link>` font tags anywhere in the project

---

### Color Palette — Strict, No Exceptions

| Token | Hex Value | Where Used |
|-------|-----------|------------|
| Brand purple | `#6B21A8` | CTAs, icons, eyebrow labels, active states, accents |
| Deep purple | `#3B0764` | Dark section backgrounds (auth panel, mission block) |
| Page background | `#F8F9FA` | Every page background across the entire site |
| White surface | `#FFFFFF` | All cards, modals, form inputs, content panels |
| Border | `#E5E7EB` | All card borders, dividers, input borders |
| Text primary | `#111827` | All headlines, high-emphasis labels |
| Text secondary | `#6B7280` | Body copy, subtext, metadata |
| Text muted | `#9CA3AF` | Placeholders, captions, disabled text |
| Success green | `#059669` | Completed task states only |
| Warning amber | `#D97706` | In-progress / upcoming deadline states only |
| Error red | `#DC2626` | Overdue items, error messages only |
| Purple tint | `#F3F0FF` | Icon container backgrounds, info badge backgrounds |

**BANNED — search the entire codebase and remove every instance:**
- Any yellow or cream background: `#FEFCE8`, `#FAFAC0`, `#FEF9C3`, or any similar warm yellow tint used as a section or card background
- Mint / teal card backgrounds: any `#ECFDF5`, `#D1FAE5` used on feature cards
- Peach / salmon card backgrounds: any `#FFF7ED`, `#FFEDD5` used on feature cards
- Lavender / light purple page backgrounds: `#FAF5FF`, `#F5F3FF`, `#EDE9FE` — replace all with `#F8F9FA`
- Any individual feature card with its own unique background color — all cards use white

### Typography — Strict Rules

**CRITICAL — apply globally before anything else:**
- Search for every instance of `font-style: italic` combined with a serif `font-family` (Georgia, serif, etc.) and remove it
- These appear on: About page hero headline, About mission section headline, all three auth page headlines (Sign In, Sign Up, Reset Password)
- All headlines site-wide: `font-style: normal`, `font-weight: 700`, `color: #111827`, `font-family: inherit`

**Hierarchy:**
- Page hero headline: `font-size: clamp(2.5rem, 5vw, 3.75rem)` bold dark
- Section headline: `font-size: 2rem–2.5rem` bold dark
- Card/feature headline: `font-size: 1.125rem–1.5rem` semibold dark
- Body text: `font-size: 1rem` `line-height: 1.625` `color: #6B7280`
- Section eyebrow: `font-size: 0.75rem` `font-weight: 600` `letter-spacing: 0.1em` `text-transform: uppercase` `color: #6B21A8`

### Card System — One Style, Used Everywhere

```css
.card {
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.2s, border-color 0.2s;
}
.card:hover {
  box-shadow: 0 4px 16px rgba(107, 33, 168, 0.10);
  border-color: #6B21A8;
}
```

Product mockup cards (larger, used in feature sections):
```css
.mockup-card {
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}
```

### Section Structure — Apply to Every Section

Every major section must follow this exact rhythm:
```
[eyebrow label]      ← optional but preferred
[section headline]   ← required
[subtext]            ← required, max-width: 560px
[content]            ← cards, features, etc.
```

Section padding: `padding: 96px 0` on all major sections — no exceptions. Currently sections have inconsistent padding; standardize everything to 96px.

### Navigation — Sticky with Backdrop Blur

```css
nav {
  position: sticky;
  top: 0;
  z-index: 50;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.85);
  border-bottom: 1px solid #E5E7EB;
  transition: background 0.2s;
}
```

Nav content: Logo left | Product · About center | Sign in · Get started right
"Get started" button: `background: #6B21A8 color: white border-radius: 8px padding: 8px 20px font-weight: 600`

### CTA Section Pattern — Identical on Every Page

Every page ends with this section before the footer:
- Section background: solid `#6B21A8` (full-width, not a card)
- Headline: `color: white font-size: 2.5rem font-weight: 700` — "Ready to get started?"
- Subtext: `color: rgba(255,255,255,0.75) font-size: 1.125rem`
- Primary button: `background: white color: #6B21A8 font-weight: 600 border-radius: 8px padding: 12px 28px`
- Button hover: `background: #F3F0FF`
- **Remove "Sign in" secondary button from ALL CTA sections** — wrong conversion intent
- Below button: `font-size: 0.75rem color: rgba(255,255,255,0.55) margin-top: 12px` — "Free forever. No credit card required."
- Section padding: `96px 0`

### Footer — Identical on Every Page

```css
footer {
  background: #111827;
  padding: 64px 0 0;
}
footer .footer-main { padding-bottom: 48px; }
footer .footer-divider { border-top: 1px solid #374151; }
footer .footer-bottom { padding: 24px 0; }

/* Text */
footer p, footer span { color: #9CA3AF; }
footer a { color: #9CA3AF; transition: color 0.2s; }
footer a:hover { color: #FFFFFF; }
footer .copyright { color: #6B7280; font-size: 0.875rem; }
```

Logo in footer: white/light version of the Continuum wordmark + infinity icon.

---

## LANDING PAGE (`/`)

### Section 1 — Hero (minor fixes only)

The hero is working. Apply only these changes:

- "See how it works" secondary button: change border color to `#6B21A8`, text to `#6B21A8`
- App mockup: add `box-shadow: 0 20px 60px rgba(107,33,168,0.12)` and `border-radius: 12px`
- Increase gap between subtext and CTA buttons to `32px`
- No other changes to the hero

### Section 2 — Stats ("The Problem Continuum Solves")

**Remove the yellow/cream background box completely.**

Replacement:
```
Container: white background, border: 1px solid #E5E7EB, border-radius: 16px, padding: 48px
Layout: 3 columns with 1px solid #E5E7EB vertical dividers between them
```

Each stat:
- Number (`4+`, `2h`, `1`): `font-size: 3.75rem font-weight: 900 color: #6B21A8`
- Descriptor: `font-size: 0.875rem color: #6B7280 max-width: 160px text-align: center margin: 0 auto margin-top: 8px`

Section eyebrow "THE PROBLEM CONTINUUM SOLVES": `color: #6B21A8 font-size: 0.75rem font-weight: 600 letter-spacing: 0.1em text-transform: uppercase`

### Section 3 — Feature Cards ("Six tools. One platform.")

**This is the most broken section on the page. Full redesign.**

**Remove ALL individual card background colors** — every card gets identical white treatment.

Section headline: `font-size: 2.5rem font-weight: 700 color: #111827`
Section subtext: `color: #6B7280` — "Every feature connects your academic work to your career goals."

Card grid: 3 columns × 2 rows, `gap: 24px`

Every card (all 6, identical):
```css
{
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  padding: 28px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  transition: box-shadow 0.2s, border-color 0.2s;
}
:hover {
  box-shadow: 0 4px 16px rgba(107,33,168,0.10);
  border-color: #6B21A8;
}
```

Icon container (inside each card):
```css
{
  width: 40px; height: 40px;
  border-radius: 10px;
  background: #F3F0FF;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 16px;
}
/* Icon color: #6B21A8, size: 20px */
```

Card title: `font-size: 1.125rem font-weight: 600 color: #111827 margin-bottom: 8px`
Card body: `font-size: 0.875rem color: #6B7280 line-height: 1.625`

The "Smart Notes" card that was previously solid purple — convert to white like all others.

### Section 4 — Three Floating Bullets ("Unified Calendar", "Private by default", "AI in every feature")

**Option A (preferred): Remove this section** and consolidate these three features into the grid above as additional cards, making it an extended feature list.

**Option B (if keeping):** Wrap all three in a single container:
```css
{
  background: #F8F9FA;
  border: 1px solid #E5E7EB;
  border-radius: 16px;
  padding: 48px;
}
```
Layout: 3-column grid. Each column: icon top (40×40px, `#F3F0FF` bg, `#6B21A8` icon) → bold title → body text. Add `1px solid #E5E7EB` vertical dividers between columns.

### Section 5 — AI Feature Block ("Let AI do the heavy lifting")

Keep the full-bleed dark purple background. Fix the right side only.

**Replace the three plain rectangular buttons** ("Note summaries", "Flashcard generation", "Resume feedback") with three stacked content cards:

Each mini card:
```css
{
  background: rgba(255,255,255,0.10);
  border: 1px solid rgba(255,255,255,0.20);
  border-radius: 10px;
  padding: 16px 20px;
  display: flex; gap: 12px; align-items: flex-start;
}
```

Each card content:
- Icon: current icons, white, 18px
- Title: `font-weight: 600 color: white font-size: 0.9375rem`
- Proof line below title: `font-size: 0.75rem color: rgba(255,255,255,0.65) margin-top: 2px`
  - Note summaries: "Generated in under 3 seconds. Cached on every visit."
  - Flashcard generation: "Up to 20 Q&A pairs extracted automatically from any note."
  - Resume feedback: "Scored across 5 dimensions with keyword gap detection."

Left side (headline + body): no changes.

### Section 6 — Social Proof (ADD — CURRENTLY MISSING)

Insert between Section 5 and the CTA section.

Section eyebrow: "WHAT STUDENTS ARE SAYING"
Section headline: `font-size: 2rem font-weight: 700 color: #111827` — "Built for how students actually work"

3 testimonial cards in a row:
```css
{
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
```

Each card:
- Stars: five ★ characters in `color: #6B21A8 font-size: 0.875rem margin-bottom: 12px`
- Quote: `font-size: 0.9375rem color: #111827 line-height: 1.625 margin-bottom: 16px`
- Author name: `font-size: 0.875rem font-weight: 600 color: #111827`
- School/major: `font-size: 0.75rem color: #6B7280`
- Avatar: initials in a `40×40px border-radius: 50% background: #F3F0FF color: #6B21A8 font-weight: 700` circle

Placeholder quotes:
1. "Finally stopped switching between 6 apps every night before an exam. Everything I need is just there." — Priya M., Computer Science, Junior
2. "The AI flashcard generation alone saves me an hour before every midterm. I don't know how I studied without it." — Marcus T., Biology, Sophomore
3. "Tracking internship applications in a spreadsheet was chaos. The pipeline view is exactly what I needed." — Jordan K., Business, Senior

### Section 7 — CTA Section

Apply the Global CTA pattern exactly. See Global Design System above.

### Section 8 — Footer

Apply the Global Footer. See Global Design System above.

---

## PRODUCT PAGE (`/product`)

### Section 1 — Page Hero

Current: headline and subtext with no visual anchor.

Add below the subtext a **feature tab strip** — horizontally scrollable row of anchor links:
```
Notes  ·  Flashcards  ·  Tasks  ·  Career Pipeline  ·  Resume  ·  Messaging
```

Tab pill style:
```css
{
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 999px;
  padding: 8px 18px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6B7280;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.active, :hover {
  background: #6B21A8;
  color: white;
  border-color: #6B21A8;
}
```

The tab strip becomes sticky on scroll (`position: sticky; top: 57px; z-index: 40; background: rgba(255,255,255,0.90); backdrop-filter: blur(8px); border-bottom: 1px solid #E5E7EB; padding: 12px 0`). Active tab updates as user scrolls past each feature section using IntersectionObserver.

Below the tab strip: a 3-up mini mockup row (dashboard + note card + kanban side by side), max height `260px`, `border-radius: 16px`, `box-shadow: 0 20px 60px rgba(107,33,168,0.12)`. This acts as a "product preview" before the feature walkthrough.

### Section 2 — All Six Feature Sections (Alternating Layout)

Keep the alternating left/right layout. Apply these changes uniformly to all six:

**Layout:**
- Section padding: `96px 0` between each feature section
- Text column: `max-width: 480px`
- Mockup column: `max-width: 560px`
- Vertical alignment: `align-items: center`

**Eyebrow labels** ("WORKSPACE", "CAREER", "SOCIAL"):
`font-size: 0.75rem font-weight: 600 letter-spacing: 0.1em text-transform: uppercase color: #6B21A8`

**Feature headline:** `font-size: 2.25rem font-weight: 700 color: #111827`

**Body text:** `color: #6B7280 font-size: 1rem line-height: 1.625 max-width: 440px`

**Bullet lists → Replace with check-icon rows:**
Remove plain `•` bullets from all six feature sections. Replace with:
```jsx
<div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
  <svg /* checkmark icon, color #6B21A8, 16×16px, strokeWidth 2.5 */ />
  <span style={{ fontSize: '0.9375rem', color: '#374151' }}>Feature bullet text</span>
</div>
```

**Mockup cards** — all get:
```css
{
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.08);
  overflow: hidden;
}
```

**Smart Notes mockup:** Tag chips (`#economics`, `#macro`, etc.): `background: #F3F0FF color: #6B21A8 border-radius: 999px padding: 2px 10px font-size: 0.75rem`

**Flashcard mockup — fix buttons (most wrong on the page):**
- "Again" button: `border: 1px solid #E5E7EB background: white color: #6B7280 border-radius: 8px`
- "Got it" button: `background: #6B21A8 color: white border-radius: 8px`
- Progress dots: active dots `#6B21A8`, inactive `#E5E7EB`

**Kanban mockup — fix column headers:**
- "TO DO" header: `color: #6B21A8 background: #F3F0FF font-size: 0.6875rem font-weight: 700 letter-spacing: 0.08em`
- "IN PROGRESS" header: `color: #D97706 background: #FFFBEB`
- "DONE" header: `color: #059669 background: #ECFDF5`
- Task cards inside columns: `background: white border: 1px solid #E5E7EB border-radius: 8px padding: 12px`
- Overdue dates (e.g., "Thu, Oct 26"): keep `color: #DC2626` — this is intentional
- "+ Add task" ghost rows: `color: #9CA3AF border: 1px dashed #E5E7EB`

**Career Pipeline mockup — fix status badges:**
- "Interview": `background: #6B21A8 color: white border-radius: 999px padding: 2px 10px font-size: 0.75rem`
- "Applied": `background: #F3F0FF color: #6B21A8 border: 1px solid #6B21A8 border-radius: 999px padding: 2px 10px font-size: 0.75rem`
- "Saved": `background: #F3F4F6 color: #6B7280 border-radius: 999px padding: 2px 10px font-size: 0.75rem`
- Company initial avatars: `background: #F3F0FF color: #6B21A8 font-weight: 700 border-radius: 8px`

**Resume Tracking mockup — fix progress bars (most broken section in the entire app):**
- Overall score `84/100`: `color: #6B21A8 font-size: 2.5rem font-weight: 900`
- Remove ALL multi-color progress bars (green, teal, purple, orange, pink)
- ALL bars: single `#6B21A8` fill at the appropriate percentage width. The score number next to each bar provides the differentiation — no need for multiple colors.
- Score numbers: `color: #6B21A8 font-weight: 600`
- Section labels (Experience, Education, Skills, Keywords, Formatting): `color: #374151 font-size: 0.875rem`

**Social/Messaging mockup:**
- Sent bubble (right): `background: #6B21A8 color: white border-radius: 18px 18px 4px 18px` — keep
- Received bubble (left): `background: #F3F4F6 color: #111827 border-radius: 18px 18px 18px 4px` — keep
- Online indicator: `background: #059669` — keep
- Input field focus: `border-color: #6B21A8`

### Section 3 — AI Section ("AI built into every layer")

Keep the full-bleed dark purple background.

**Fix the cards — replace barely-visible purple-on-purple with white cards:**
```css
.ai-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 28px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
}
```

Each card:
- Icon: `#6B21A8` on white, 24px
- Title: `font-size: 1.0625rem font-weight: 600 color: #111827 margin-bottom: 8px`
- Description: `font-size: 0.875rem color: #6B7280 line-height: 1.625`
- Proof line at bottom: `font-size: 0.75rem color: #9CA3AF margin-top: 8px`
  - Note Summaries: "Generated in under 3 seconds. Cached on every subsequent visit."
  - Flashcard Generation: "Extracts up to 20 Q&A pairs per note automatically."
  - Resume Feedback: "Scored across 5 dimensions with keyword gap detection."

Section eyebrow "AI-POWERED" pill: `background: rgba(255,255,255,0.15) color: white border: 1px solid rgba(255,255,255,0.25) border-radius: 999px padding: 4px 14px font-size: 0.75rem`
Section headline "AI built into every layer": `color: white font-size: 2.5rem font-weight: 700`
Section subtext: `color: rgba(255,255,255,0.75)`

### Section 4 — CTA + Footer

Apply the Global CTA pattern and Global Footer exactly.

---

## ABOUT PAGE (`/about`)

### Section 1 — Hero

- Eyebrow "Our story" pill: `border: 1px solid #E5E7EB background: white color: #6B21A8 font-size: 0.75rem font-weight: 500 border-radius: 999px padding: 6px 14px`
- Headline "Built for the student who is trying to do it all": keep exactly, `font-size: clamp(2.5rem, 5vw, 3.5rem) font-weight: 700 color: #111827 text-align: center`
- Subtext: `color: #6B7280 font-size: 1.125rem text-align: center max-width: 560px margin: 0 auto`
- Padding below hero before next section: `80px`

### Section 2 — "How it started" (Two-column)

**Left column — founder story text:**
- Section label with left border: keep — `border-left: 3px solid #6B21A8 padding-left: 16px margin-bottom: 24px`
- Label text "How it started": `font-size: 1.5rem font-weight: 700 color: #111827`
- Body paragraphs: `color: #6B7280 font-size: 1rem line-height: 1.75 margin-bottom: 20px`
- Bold inline references ("TEI 2026", "Google Play", "All Star Code"): `font-weight: 700 color: #111827`
- Add pull quote as final element in left column: `font-size: 1.0625rem font-style: italic color: #6B21A8 font-weight: 500 border-left: 2px solid #6B21A8 padding-left: 16px margin-top: 24px` — *"Every feature in Continuum exists because a student needed it."*

**Right column — build timeline card:**
```css
.timeline-card {
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
}
```

Card header: `font-size: 0.75rem font-weight: 600 letter-spacing: 0.1em text-transform: uppercase color: #6B21A8 margin-bottom: 24px` — "BUILD TIMELINE"

**Fix all timeline step icons — remove all unique colors:**
Every step icon container: `width: 36px height: 36px border-radius: 50% background: #F3F0FF flex-shrink: 0`
Every icon inside: `color: #6B21A8` stroke-only, 18px
Connector line between steps: `width: 1px background: #E5E7EB height: 20px margin: 4px auto margin-left: 17px`

Step layout:
```
[icon container]  [text column]
                  [step title: font-weight: 600 color: #111827 font-size: 0.9375rem]
                  [step description: color: #6B7280 font-size: 0.8125rem margin-top: 2px]
```

Steps:
1. Ideation — "What if one app replaced all of them?"
2. Brainstorming — "Mapping every student pain point"
3. Building — "70 endpoints, 3 AI integrations, full-stack"
4. Testing — "130+ integration tests across 12 suites"
5. Storytelling — "Built for the student doing it all"

### Section 3 — Stats ("The Problem We Set Out to Fix")

Identical fix to landing page stats section:
- Remove yellow/cream background entirely
- White container: `border: 1px solid #E5E7EB border-radius: 16px padding: 48px`
- Stat numbers: `font-size: 3.75rem font-weight: 900 color: #6B21A8`
- Descriptors: `font-size: 0.875rem color: #6B7280 max-width: 160px text-align: center`
- Vertical dividers: `1px solid #E5E7EB` between columns
- Eyebrow: `color: #6B21A8 font-size: 0.75rem font-weight: 600 letter-spacing: 0.1em text-transform: uppercase`

### Section 4 — Mission (Full-bleed purple)

Keep the full-bleed dark purple background (`#3B0764`).

**Fix the headline — remove italic serif completely:**
- `font-family: inherit font-style: normal font-weight: 700 font-size: 2.75rem color: white text-align: center`
- Text: "Give every student a single, intelligent workspace." — keep

- Subtext: `color: rgba(255,255,255,0.75) font-size: 1.125rem text-align: center max-width: 560px margin: 24px auto 0`
- Eyebrow "THE MISSION": `color: rgba(255,255,255,0.60) font-size: 0.75rem font-weight: 600 letter-spacing: 0.1em text-transform: uppercase`
- Section padding: `96px 0`

Add two thin decorative lines (purely CSS, no images):
```css
.mission-headline::before,
.mission-headline::after {
  content: '';
  display: block;
  width: 80px;
  height: 1px;
  background: rgba(255,255,255,0.20);
  margin: 20px auto;
}
```

### Section 5 — Founder Card ("Meet Justin")

Section eyebrow "THE FOUNDER": `color: #6B21A8 font-size: 0.75rem font-weight: 600 letter-spacing: 0.1em text-transform: uppercase margin-bottom: 12px`
Section headline "Meet Justin": `font-size: 1.875rem font-weight: 700 color: #111827 margin-bottom: 32px`

Card:
```css
{
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
}
```

**Remove the random purple top border stripe** — delete it entirely.

Card layout: two-column at large viewport
- Left column (1/3): photo + badge
- Right column (2/3): name, title, bio, links

Photo: keep as-is, `border-radius: 12px width: 120px height: 120px object-fit: cover`

"Founder" badge below photo:
```css
{
  background: #F3F0FF;
  color: #6B21A8;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 999px;
  padding: 4px 12px;
  display: inline-block;
  margin-top: 12px;
}
```

Name: `font-size: 1.25rem font-weight: 700 color: #111827`
Title "Senior at Lehigh University, Computer Science": `font-size: 0.875rem color: #6B7280 margin-top: 4px`
Bio paragraphs: `font-size: 0.9375rem color: #6B7280 line-height: 1.75 margin-top: 16px`

Social links — unify ALL to same base style, Resume is the only filled button:
- LinkedIn, GitHub, Website: `border: 1px solid #E5E7EB background: white color: #111827 border-radius: 8px padding: 8px 16px font-size: 0.875rem font-weight: 500`
  - Hover: `border-color: #6B21A8 color: #6B21A8`
- Resume: `background: #6B21A8 color: white border-radius: 8px padding: 8px 16px font-size: 0.875rem font-weight: 500` — keep as primary action

### Section 6 — Backers ("Organizations that made this possible")

Section eyebrow "BACKED BY": `color: #6B21A8 font-size: 0.75rem font-weight: 600 letter-spacing: 0.1em text-transform: uppercase`
Section headline: keep "Organizations that made this possible"

**Upgrade backer cards — these are your biggest credibility assets:**

```css
.backer-card {
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
}
```

Each card layout:
```
[org monogram / logo placeholder]   ← large first letter, font-size: 3rem font-weight: 900 color: #6B21A8
[org name]                          ← font-size: 1.125rem font-weight: 700 color: #111827
[type badge]                        ← "Partnership" / "Nonprofit" in purple pill
[thin divider: 1px solid #E5E7EB margin: 16px 0]
[description]                       ← color: #6B7280 font-size: 0.9375rem line-height: 1.625
[specific contribution line]        ← font-size: 0.75rem font-weight: 500 color: #6B21A8 margin-top: 8px
```

Google Play contribution line: "Provided mobile distribution support and resources for student-built technology"
All Star Code contribution line: "Provided mentorship and expanded CS access for underrepresented young men in tech"

Type badge: `background: #F3F0FF color: #6B21A8 font-size: 0.75rem font-weight: 500 border-radius: 999px padding: 4px 12px`

Layout: 2-column grid, equal width, `gap: 24px`

### Section 7 — CTA + Footer

Apply Global CTA pattern and Global Footer exactly.

---

## AUTH PAGES (`/sign-in`, `/sign-up`, `/reset-password`)

### Global Auth Layout — Split Panel

**Replace the current centered card on gray background across all three auth pages.**

New layout: two-column split panel, full viewport height

```css
.auth-layout {
  display: grid;
  grid-template-columns: 40% 60%;
  min-height: 100vh;
}
@media (max-width: 768px) {
  .auth-layout {
    grid-template-columns: 1fr;
  }
  .auth-left-panel { display: none; }
}
```

**Left panel — brand panel:**
```css
.auth-left-panel {
  background: #3B0764;
  padding: 40px;
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
  height: 100vh;
}
```

Left panel content:
- Logo (white version) at top: `margin-bottom: auto`
- Center block:
  - Headline: `font-size: 1.5rem font-weight: 700 color: white line-height: 1.4 max-width: 320px margin-bottom: 40px`
    Text: "One place for notes, flashcards, tasks, and your career. Everything connected."
  - Three trust signals:
    ```
    [✓ icon, #6B21A8 bg white checkmark, 20×20px]  [signal text, color: rgba(255,255,255,0.80) font-size: 0.875rem]
    ```
    Signals:
    1. "AI summaries and flashcards built in"
    2. "Google Drive import in one click"
    3. "Free to use, no credit card required"
    Gap between signals: `16px`
- Bottom: `font-size: 0.75rem color: rgba(255,255,255,0.40) margin-top: auto` — "Backed by Google Play & All Star Code"

**Right panel — form panel:**
```css
.auth-right-panel {
  background: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  overflow-y: auto;
}
.auth-form-container {
  width: 100%;
  max-width: 400px;
}
```

### Auth Input — Global Style (apply to all inputs on all auth pages)

```css
.auth-input {
  width: 100%;
  border: 1px solid #D1D5DB;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 0.9375rem;
  color: #111827;
  background: white;
  transition: border-color 0.2s, box-shadow 0.2s;
  outline: none;
}
.auth-input::placeholder { color: #9CA3AF; }
.auth-input:focus {
  border-color: #6B21A8;
  box-shadow: 0 0 0 3px rgba(107, 33, 168, 0.12);
}
```

Input label: `font-size: 0.875rem font-weight: 500 color: #374151 margin-bottom: 6px display: block`
**Remove red asterisks** from all form field labels.

### Auth Button — Global Style

Primary submit button (Sign in, Create account, Send reset link):
```css
.auth-btn-primary {
  width: 100%;
  background: #6B21A8;
  color: white;
  font-weight: 600;
  font-size: 0.9375rem;
  border-radius: 8px; /* NOT pill shape — match input border-radius */
  padding: 12px 24px;
  border: none;
  cursor: pointer;
  transition: background 0.2s;
}
.auth-btn-primary:hover { background: #5B1A99; }
```

Google OAuth button:
```css
.auth-btn-google {
  width: 100%;
  background: white;
  border: 1.5px solid #D1D5DB;
  border-radius: 10px;
  padding: 12px 24px;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #111827;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  transition: box-shadow 0.2s, border-color 0.2s;
  display: flex; align-items: center; justify-content: center; gap: 10px;
}
.auth-btn-google:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.12);
  border-color: #9CA3AF;
}
```

Google button sub-label: `font-size: 0.75rem color: #9CA3AF text-align: center margin-top: 8px`

Divider ("or sign in with email"):
```css
.auth-divider {
  display: flex; align-items: center; gap: 16px;
  margin: 20px 0;
  font-size: 0.8125rem; color: #9CA3AF;
}
.auth-divider::before, .auth-divider::after {
  content: ''; flex: 1; height: 1px; background: #E5E7EB;
}
```

### Sign In Page — Specific Changes

Headline: `font-size: 1.875rem font-weight: 700 color: #111827 margin-bottom: 6px` — "Welcome back"
**Remove all italic and serif styling** from this headline.
Subtext: `font-size: 0.9375rem color: #6B7280 margin-bottom: 28px` — "Sign in to your Continuum account"

Google button sub-label: "Most students use Google sign-in"

Fields: Email → Password (2 fields only)

Forgot password link: `font-size: 0.8125rem color: #6B21A8 text-align: right display: block margin-top: 4px` — hover underline

Bottom link: `font-size: 0.875rem color: #6B7280 text-align: center margin-top: 24px`
"Don't have an account? " + `color: #6B21A8 font-weight: 600` "Sign up"

### Sign Up Page — Specific Changes

Headline: `font-size: 1.875rem font-weight: 700 color: #111827 margin-bottom: 6px` — "Create your account"
**Remove all italic and serif styling.**
Subtext: `font-size: 0.9375rem color: #6B7280 margin-bottom: 28px` — "Start your journey with Continuum"

Google button sub-label: "Fastest way to get started"

Fields in order:
1. First name + Last name — 2-column row: `display: grid; grid-template-columns: 1fr 1fr; gap: 12px`
2. Username
3. Email
4. Password (with eye icon toggle inside the input, right-aligned)
5. **~~Confirm password~~ — REMOVE THIS FIELD** — replace with a password visibility toggle eye icon inside the Password field

Eye icon toggle:
```css
.password-wrapper { position: relative; }
.eye-toggle {
  position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
  color: #9CA3AF; cursor: pointer; background: none; border: none; padding: 0;
}
.eye-toggle:hover { color: #6B7280; }
```

Legal text: `font-size: 0.75rem color: #9CA3AF text-align: center margin-top: 16px`
"By signing up, you agree to our " + `color: #6B21A8 hover:underline` "Terms of Service" + " and " + `color: #6B21A8` "Privacy Policy."

Bottom link: `font-size: 0.875rem color: #6B7280 text-align: center margin-top: 20px`
"Already have an account? " + `color: #6B21A8 font-weight: 600` "Sign in"

### Reset Password Page (`/reset-password`) — Specific Changes

This is the page the user lands on after clicking the reset link in their email. It is distinct from `/forgot-password` (which only collects their email). This page collects and sets the new password.

Uses the same split panel layout as all other auth pages. Left panel content is identical.

Headline: `font-size: 1.875rem font-weight: 700 color: #111827` — "Set new password"
**Remove the purple italic serif styling** — same fix as all other auth headlines.
Subtext: `font-size: 0.9375rem color: #6B7280 margin-bottom: 28px` — "Choose a strong password for your account"

Fields:
- "New password" — apply auth-input styles, add eye icon toggle (same as Sign Up password field)
- **Remove "Confirm new password" field** — same reasoning as Sign Up: use the eye icon toggle instead. Remove the red asterisk from the label.

"Reset password" button: apply `auth-btn-primary` styles. Specifically fix the border-radius — currently pill-shaped (`border-radius: 999px`), change to `border-radius: 8px` to match all other auth buttons and inputs.

"Back to sign in" link: `font-size: 0.875rem color: #6B21A8 font-weight: 500 text-align: center display: block margin-top: 16px` — hover underline.

**Success and error states — check before implementing:**
Before adding these states, inspect the current `/reset-password` component and check whether a success state (password updated confirmation) and an expired/invalid token error state already exist in the code. If they do, apply the visual styling below to the existing states rather than rewriting the logic. If they do not exist, implement them in full.

Success state styling (apply to existing or implement new):
```jsx
<div style={{ textAlign: 'center', padding: '20px 0' }}>
  {/* Checkmark icon, color: #059669, size: 48px, margin-bottom: 20px */}
  <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>
    Password updated
  </h2>
  <p style={{ fontSize: '0.9375rem', color: '#6B7280', marginBottom: '24px' }}>
    Your password has been reset successfully.
  </p>
  <a href="/login" style={{ fontSize: '0.9375rem', color: '#6B21A8', fontWeight: 500 }}>
    Sign in to your account
  </a>
</div>
```

Expired/invalid token error state styling (apply to existing or implement new):
```jsx
<div style={{ textAlign: 'center', padding: '20px 0' }}>
  {/* X/error icon, color: #DC2626, size: 48px, margin-bottom: 20px */}
  <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>
    Link expired
  </h2>
  <p style={{ fontSize: '0.9375rem', color: '#6B7280', marginBottom: '24px' }}>
    This reset link has expired or already been used. Request a new one.
  </p>
  <a href="/forgot-password" style={{ fontSize: '0.9375rem', color: '#6B21A8', fontWeight: 500 }}>
    Request a new link
  </a>
</div>
```

---

## LEGAL PAGES (`/terms`, `/privacy`)

These are content pages. Changes are minimal — do not restructure the content or add marketing elements.

### Page Layout

```css
.legal-page {
  background: #F8F9FA; /* replace current lavender */
  min-height: 100vh;
}
.legal-content {
  max-width: 720px;
  margin: 0 auto;
  padding: 80px 24px;
}
```

### Page Title

"Terms of Service" / "Continuum Privacy Policy":
`font-size: 2.5rem font-weight: 700 color: #111827 margin-bottom: 8px`
**Remove any serif or italic styling.**

"Last updated: March 2026": `font-size: 0.875rem color: #6B21A8 font-weight: 500`

### Table of Contents Card

```css
.toc-card {
  background: white;
  border: 1px solid #E5E7EB;
  border-left: 3px solid #6B21A8;
  border-radius: 12px;
  padding: 24px 32px;
  margin: 32px 0 48px;
}
.toc-label {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #6B7280;
  margin-bottom: 16px;
}
.toc-link {
  display: block;
  font-size: 0.9375rem;
  color: #6B21A8;
  line-height: 2;
  text-decoration: none;
}
.toc-link:hover { text-decoration: underline; }
```

### Section Headings

`font-size: 1.25rem font-weight: 700 color: #111827 margin-top: 48px margin-bottom: 12px font-family: inherit font-style: normal`

### Body Text

`font-size: 1rem color: #374151 line-height: 1.75 margin-bottom: 16px`

Bold inline terms (e.g., "Account information.", "Content you create."): `font-weight: 700 color: #111827`

Inline links and email addresses: `color: #6B21A8 hover:underline`

Inline code (e.g., `drive.readonly`): `background: #F3F4F6 color: #111827 border-radius: 4px padding: 2px 6px font-size: 0.875rem`

### Footer

Apply Global Footer exactly (dark `#111827` background).
Legal pages do NOT get a CTA section — go directly from last content section to footer.

---

## WHAT NOT TO CHANGE

- **Scope**: Only touch files serving the 8 routes listed at the top of this document. Nothing else.
- Do not change any routing, component names, or file structure
- Do not introduce any new fonts not currently used in the project
- Do not add animations or transitions beyond the hover states specified in this document
- Do not change any color not explicitly named in this spec
- Do not add any new sections, pages, or components beyond those specified
- The entire authenticated app (dashboard and all routes behind login) is **completely out of scope**
- Do not touch any backend files, API routes, middleware, or authentication logic
- Do not modify any shared component that is also used inside the authenticated app — if in doubt, create a marketing-specific copy instead of modifying the original
