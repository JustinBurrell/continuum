# Spec: Notes Rendering Rework

**Status:** Not started
**Priority:** Pre-launch polish
**Affects:** Frontend only — `NoteDetail.jsx`, `NoteEditor.jsx`

---

## Problem

Notes are written as plain text in a `<textarea>` (NoteEditor.jsx), but displayed as HTML via `dangerouslySetInnerHTML` with Tailwind `prose` classes (NoteDetail.jsx). This causes two issues:

1. **Markdown symbols show raw** — if a note contains `**bold**` or `# Heading`, it renders as literal characters because the content was never converted to HTML. The `prose` class styles HTML tags, but the stored content is just a plain string.

2. **Line breaks are lost** — plain text newlines (`\n`) are ignored by HTML rendering. A note with 10 paragraphs separated by blank lines appears as one wall of text.

The editor is a `<textarea>`, not a rich-text editor. Content is and should remain **plain text**. The fix is in the display layer only.

---

## What to build

### 1. Fix `NoteDetail.jsx` — render plain text correctly

Replace the `dangerouslySetInnerHTML` block with a plain-text renderer that preserves line breaks.

**Current:**
```jsx
<div
  className="prose prose-sm max-w-none"
  style={{ color: '#1f2937', lineHeight: 1.7 }}
  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(note.content) }}
/>
```

**Fix — Option A (simplest, no dependency):**
```jsx
<div style={{ color: '#1f2937', lineHeight: 1.7, fontSize: '0.95rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
  {note.content}
</div>
```

`white-space: pre-wrap` preserves newlines and wraps long lines. No HTML parsing, no DOMPurify needed, no markdown symbols.

**Fix — Option B (if markdown support is wanted later):**
Install `react-markdown` and render content through it. Keep the `<textarea>` editor — it becomes a lightweight markdown editor (no toolbar). Display uses `<ReactMarkdown>` with the existing `prose` classes.

**Recommendation: Option A** — the app has no markdown editor UI (no toolbar, no preview toggle, no syntax hints to the user). Rendering plain text with line breaks matches what users actually type. Option B can be revisited if a proper markdown editor (e.g. with a toolbar) is added to NoteEditor.

---

### 2. Fix `NoteEditor.jsx` — set `white-space: pre-wrap` on preview (if one exists)

The editor is already a `<textarea>` which natively preserves newlines. No change needed to the editor itself.

If a preview mode is added in the future, apply the same `white-space: pre-wrap` rule.

---

### 3. Audit other places notes are displayed

| Location | How content is shown | Fix needed? |
|----------|---------------------|-------------|
| `NoteDetail.jsx` content block | `dangerouslySetInnerHTML` | Yes — replace with `pre-wrap` div |
| `NotesList.jsx` preview snippet | Likely a `.slice(0, N)` text truncation | Probably fine — check for HTML bleed-through |
| AI summary card (NoteDetail) | Shows AI-generated text, not note content | No change |
| Shared notes on `UserProfile.jsx` | Shows title only | No change |

---

## What NOT to change

- The `<textarea>` in NoteEditor — works correctly, no change
- The database schema — content is stored as plain string, stays that way
- AI summarization — operates on raw text content, unaffected
- DOMPurify import — can be removed from NoteDetail once `dangerouslySetInnerHTML` is gone, but confirm it's not used elsewhere in the file first

---

## Testing

Manual only — no backend changes, no new API calls.

Verification steps:
1. Create a note with multiple paragraphs separated by blank lines → detail view shows paragraphs with spacing
2. Create a note with `**bold**` or `# Heading` → shows as literal text, not rendered markdown
3. Create a note with a very long word or URL with no spaces → wraps instead of overflowing the card
4. Existing notes with content that contains angle brackets (`<`, `>`) → display safely without HTML injection (since we're no longer using `dangerouslySetInnerHTML`, XSS risk is eliminated entirely)

---

## Notes

- Removing `dangerouslySetInnerHTML` also eliminates the remaining XSS surface on this page. DOMPurify was the mitigation; plain text rendering makes the mitigation unnecessary.
- If the product roadmap later calls for a rich-text or markdown editor (e.g. with formatting toolbar, block types, or import from PDF), that is a separate and larger feature. This spec only fixes the display mismatch for the existing plain-text editor.
