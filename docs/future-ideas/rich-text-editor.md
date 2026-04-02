# Rich Text Editor for Notes

**Status:** Implemented — April 2026 (`feat/rich-text-editor`)
**Scope:** Frontend only (NoteEditor + NoteDetail)
**Replaces:** Plain textarea + react-markdown rendering

---

## Problem

The current note editor is a plain `<textarea>`. Users who want bold or italic text have to type raw markdown syntax (`**bold**`, `*italic*`). There is no toolbar, no visual feedback, and no indication that formatting is even possible. Users writing plain prose get a fine experience. Users who want structure have no obvious path.

The current `react-markdown` renderer in NoteDetail handles the output side, but the input experience is disconnected from it — you type symbols, save, then see the formatted result only after navigating away and back.

---

## Goal

Replace the textarea with a WYSIWYG rich text editor. Clicking a word and pressing Ctrl+B makes it bold — no markdown syntax ever visible. The note content stored in the database changes from markdown strings to a structured format (HTML or JSON).

---

## Recommended Library: Tiptap

Tiptap (built on ProseMirror) is the right choice for this stack:

- React-first API, headless (no forced styles)
- Outputs HTML or JSON — both work with the existing backend
- Extensions for bold, italic, underline, lists, headings, blockquote, code blocks, links
- Active development and good docs
- MIT licensed

Alternatives considered: Quill (older, less React-native), Slate.js (more flexible but much more work to build a usable editor), react-quill (Quill wrapper, works but feels dated), TipTap is the best balance of power and ease.

---

## What Changes

**NoteEditor.jsx:**
- Remove the `<textarea>` and replace with `<EditorContent editor={editor} />` from Tiptap
- Add a toolbar component with buttons for: bold, italic, underline, bullet list, numbered list, blockquote, code block, undo, redo
- `editor.getHTML()` replaces the current `content` state value on save
- No markdown involved at any point

**NoteDetail.jsx:**
- Remove `react-markdown` and its custom component overrides
- Replace with `dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(note.content) }}`
- Add `prose prose-sm` class for Tailwind Typography styling
- DOMPurify is needed again since the stored content is now HTML

**Database:** No migration needed. Existing notes stored as markdown strings will render as plain text (markdown symbols visible) until re-saved through the new editor. That is acceptable for an MVP of this feature — a migration script can clean up old content later if needed.

---

## What the Toolbar Should Include

Keep it minimal — this is a note editor, not a word processor:

- **B** — bold
- *I* — italic
- U — underline
- Bullet list
- Numbered list
- `</>` — inline code
- Blockquote
- Undo / Redo

Do not include: font size controls, font family, color pickers, text alignment, tables, image embeds. Those belong in a document editor, not a notes app.

---

## What Does NOT Change

- The backend API — content is still stored as a string in the `content` field
- The note data model
- All other note functionality (tags, type, visibility, sharing, AI summary, flashcard generation)
- NotesList card previews — `stripHtml()` already handles HTML content correctly

---

## Out of Scope for This Spec

- Real-time collaborative editing
- Markdown import/export
- Custom font or color controls
- Note templates
- Image embeds within note content (attachments via PDF upload already exist separately)

---

## Implementation Order

1. Install Tiptap: `npm install @tiptap/react @tiptap/pm @tiptap/starter-kit`
2. Build the toolbar component (`NoteToolbar.jsx`)
3. Swap the textarea in `NoteEditor.jsx`
4. Update `NoteDetail.jsx` to render HTML with DOMPurify
5. Re-add DOMPurify: `npm install dompurify`
6. Test: create a note, apply formatting, save, view — formatting should survive the round trip
7. Test edge cases: empty notes, notes with only whitespace, very long notes

---

## Design Notes

The toolbar should sit directly above the editor content area, visually attached to it (same card, thin border separator between toolbar and content). Active formatting states (bold is on) should visually toggle the button. The editor area should feel like the existing textarea — same padding, same font size, same line height — just with formatting capability added.
