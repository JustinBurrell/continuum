> **Status: Implemented** — `feat/accessibility` (May 2026)
> All items in this spec were addressed. The public Accessibility Statement is live at `/accessibility`.
> This file is retained as the original design spec.

# Accessibility — Audit + Statement Page

## Goal

Audit the app and marketing site for WCAG AA compliance, fix violations, and add an Accessibility Statement page linked in the marketing footer under Legal.

---

## Part 1: Site Audit

Run axe DevTools (Chrome extension) and Lighthouse accessibility audit on every public and app route. Fix all reported violations. Key areas to address:

| Area | What to fix |
|---|---|
| Color contrast | All text must meet WCAG AA (4.5:1 normal text, 3:1 large). The `#a087b0` secondary color is borderline — audit all uses |
| Keyboard navigation | Every button, input, modal, and dropdown must be reachable and operable via Tab + Enter/Space |
| Focus indicators | Visible focus ring on all focusable elements — do not suppress `outline` without a visible replacement |
| Screen reader labels | All icon-only buttons need `aria-label`. All form inputs need an associated `<label>` |
| Modal focus trap | When a modal opens, focus must be trapped inside it and returned to the trigger element on close |
| Image alt text | All `<img>` tags need descriptive `alt` attributes |
| Live regions | Toasts, loading states, and other dynamic content changes should use `aria-live` |

Routes to audit:
- Marketing: `/`, `/product`, `/about`, `/privacy`, `/terms`
- Auth: `/login`, `/register`, `/forgot-password`, `/reset-password`
- App: `/dashboard`, `/notes`, `/tasks`, `/calendar`, `/flashcards`, `/friends`, `/messages`, `/applications`, `/resumes`, `/activity`, `/profile`

---

## Part 2: Accessibility Statement Page

Create `web/src/pages/legal/Accessibility.jsx` and route it at `/accessibility`.

The page should cover:
- Our commitment to WCAG AA compliance
- What assistive technologies are supported (keyboard navigation, screen readers)
- Known limitations (if any)
- How to report an accessibility issue (link to `support@usecontinuum.dev`)
- Date of last review

Match the visual style of the existing `/privacy` and `/terms` pages.

---

## Part 3: Footer Link

Add the Accessibility page to the Legal column in `web/src/components/layout/MarketingFooter.jsx`:

```jsx
<li>
  <Link to="/accessibility" className="text-sm no-underline" style={{ color: '#6b7280' }}>
    Accessibility
  </Link>
</li>
```

Add it after Terms of Service in both the footer column and the bottom bar links row.

Also add the route in the router and to `TitleManager.jsx` (title: `Continuum | Accessibility`).

---

## References

- [axe DevTools](https://www.deque.com/axe/) Chrome extension
- [WCAG 2.1 AA guidelines](https://www.w3.org/TR/WCAG21/)
- Lighthouse accessibility audit (built into Chrome DevTools → Lighthouse tab)
