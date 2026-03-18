# Feature: Add Task Type to Frontend UI

This is the **sole source of truth** for this feature. Read this file top to bottom and implement every section. Do not skip steps. Verify end-to-end before committing.

---

## Problem Summary

The Task model defines a `type` enum (`homework`, `study`, `project`, `exam`, `club`, `professional`, `personal`, `other`) but the frontend completely ignores it:

1. **Create form**: no way to select a task type when creating a task
2. **Edit form**: no way to change a task's type after creation
3. **Display**: task type is not shown anywhere — not on kanban cards, not in the detail modal

---

## Current State (What Exists)

### Backend Model

**File:** `backend/models/Task.js` (lines 73-76)

```js
type: {
    type: String,
    enum: ['homework', 'study', 'project', 'exam', 'club', 'professional', 'personal', 'other'],
    index: true,
```

- The field is optional (no `required: true`, no `default`)
- Mongoose enum validation will reject any value not in the list

### Backend Controller

**File:** `backend/controllers/tasks.controller.js`

| Function | Lines | Accepts `type`? |
|----------|-------|----------------|
| `createTask` | 21-65 | Yes — destructured at line 25, passed to `Task.create()` at line 58 |
| `updateTask` | 138-155 | Yes — destructured at line 143, passed to `findOneAndUpdate` at line 153 |

**No backend changes needed.** Both endpoints already accept and validate `type`.

### Frontend — Tasks Page

**File:** `web/src/pages/tasks/Tasks.jsx`

| What | Lines | Current State |
|------|-------|---------------|
| `PRIORITIES` constant | 15 | `const PRIORITIES = ['low', 'medium', 'high'];` — no equivalent `TYPES` constant |
| `emptyForm` | 29-31 | `{ title: '', description: '', priority: 'medium', status: 'todo', dueDate: '', isShared: false }` — no `type` field |
| Create form grid | 160-181 | Two-column grid with Priority and Status selects — no Type select |
| TaskCard component | 293-420 | Renders title, description, due date, priority, status — no type badge |
| Priority select pattern | 169-176 | Uses `<select className="input-field capitalize">` with `.map()` over `PRIORITIES` |

### Frontend — Task Detail Modal

**File:** `web/src/components/tasks/TaskDetailModal.jsx`

| What | Lines | Current State |
|------|-------|---------------|
| `PRIORITIES` constant | ~10 | Local constant for the edit form |
| `openEdit` / `setEditForm` | 57-64 | `{ title, description, priority, dueDate, isShared }` — no `type` |
| Edit form priority select | 140-150 | `<select>` with inline styles, maps over `PRIORITIES` |
| Detail display badges | 238-260 | Shows priority badge and shared badge — no type badge |

---

## What Needs to Change

### 1. Add `TYPES` Constant and Update Form State

**`web/src/pages/tasks/Tasks.jsx`:**

- Add a constant near line 15 (next to `PRIORITIES`):
  ```js
  const TYPES = ['homework', 'study', 'project', 'exam', 'club', 'professional', 'personal', 'other'];
  ```
- Update `emptyForm` (line 29-31) to include `type`:
  ```js
  const emptyForm = {
    title: '', description: '', priority: 'medium', status: 'todo',
    dueDate: '', isShared: false, type: '',
  };
  ```

**`web/src/components/tasks/TaskDetailModal.jsx`:**

- Add the same `TYPES` constant (or import from a shared location)
- Update `setEditForm` in the edit handler (lines 57-64) to include `type`:
  ```js
  type: task.type || '',
  ```

### 2. Add Type Select to Create Form

**`web/src/pages/tasks/Tasks.jsx`** — in the create form grid (around lines 160-181):

Add a Type `<select>` following the exact same pattern as the Priority select (lines 169-176):

```jsx
<div>
  <label className="text-sm font-medium text-foreground block mb-1.5">Type</label>
  <select
    className="input-field capitalize"
    value={form.type}
    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
  >
    <option value="">Select type</option>
    {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
  </select>
</div>
```

Key details:
- Include an empty `<option value="">Select type</option>` as the default since type is optional
- Use `capitalize` class so options render as "Homework", "Study", etc. instead of lowercase
- Place it in the 2-column grid alongside Priority and Status

### 3. Add Type Select to Edit Form

**`web/src/components/tasks/TaskDetailModal.jsx`** — in the edit form (near lines 140-150):

Add a Type `<select>` following the exact same pattern as the Priority select in this file:

```jsx
<label style={{ display: 'block', fontSize: 12, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#a087b0', marginBottom: 6 }}>
  Type
</label>
<select
  className="input-field capitalize"
  style={{ borderColor: '#ede9fe', borderRadius: 12 }}
  value={editForm.type}
  onChange={e => setEditForm(f => ({ ...f, type: e.target.value }))}
>
  <option value="">Select type</option>
  {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
</select>
```

Place it near the Priority select so the layout is consistent.

### 4. Display Type on Task Cards (Kanban)

**`web/src/pages/tasks/Tasks.jsx`** — in the TaskCard component (around lines 293-420):

Add a type badge near where the priority badge or other metadata is displayed (around line 366). Only render if the task has a type:

```jsx
{task.type && (
  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 capitalize">
    {task.type}
  </span>
)}
```

Use a distinct color from priority to differentiate (e.g., purple tones for type, existing colors for priority).

### 5. Display Type in Detail Modal

**`web/src/components/tasks/TaskDetailModal.jsx`** — in the badge/metadata section (around lines 238-260):

Add a type badge alongside the existing priority and shared badges:

```jsx
{task.type && (
  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 capitalize">
    {task.type}
  </span>
)}
```

### 6. Capitalize Display Everywhere

All type values must render in **Capitalized** format (e.g., "Homework" not "homework"). This is handled by the CSS `capitalize` class on both `<select>` elements and badge `<span>` elements. Verify:

- Select dropdown options: `capitalize` class → "Homework", "Study", etc.
- Task card badge: `capitalize` class → "Homework", "Study", etc.
- Detail modal badge: `capitalize` class → "Homework", "Study", etc.

Do **not** transform the value itself — store lowercase in the database, display capitalized via CSS.

---

## Documentation Updates

After implementation, update these docs to reflect the changes:

| Doc | What to Update |
|-----|---------------|
| `docs/backend/api_reference_guide.md` | Confirm `type` field is documented in `POST /tasks` and `PATCH /tasks/:id` request bodies |
| `docs/backend/backend_user_flows.md` | Update task creation and editing flows to mention type selection |
| `docs/product/product_requirements_document.md` | Mark task type UI as implemented |
| `docs/database/mongodb_schema_explaination.md` | Confirm type field is documented (it likely already is) |
| `docs/master_planning_doc.md` | Update feature status if task type was listed as pending |

Only update docs where the content actually needs to change — do not add information that is already present.

---

## Verification Checklist

Before committing, verify each item works end-to-end:

- [ ] **Create task with type**: select a type from dropdown → task is created with correct type in database
- [ ] **Create task without type**: leave type as "Select type" (empty) → task is created without type field (no error)
- [ ] **Type displays on kanban card**: task card shows capitalized type badge (e.g., "Homework")
- [ ] **Type displays in detail modal**: opening a task shows the type badge in the metadata section
- [ ] **Edit task type**: open edit form → type is pre-populated → change it → save → updated in database and UI
- [ ] **Clear task type**: in edit form, set type back to "Select type" → save → type is removed
- [ ] **All 8 types work**: test at least a few different types to confirm the enum values all render correctly
- [ ] **Capitalization**: all type displays show capitalized text, database stores lowercase

---

## Commit Names

Based on `docs/agile_workflow_guide.md` conventions:

```
feat: add task type selection to create and edit forms with capitalized display
docs: update api reference and user flows for task type UI changes
```
