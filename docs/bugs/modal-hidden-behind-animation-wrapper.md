# Bug: Modals Hidden Behind Animation Wrapper

**Status:** Fixed
**Introduced in:** `fix/frontend-polish` (POL-7 page fade-in animation)
**Affected:** All modals app-wide (TaskDetailModal, ShareModal, ConfirmModal, etc.)

## Symptom
Clicking any task card (or triggering any modal) shows the dimmed backdrop but the modal dialog box is invisible. The backdrop blur renders correctly but the white modal panel never appears.

## Root Cause
The `page-fade-in` CSS class applies `animation: fadeInUp` which uses `transform: translateY(8px → 0)`. Even at the final state (`translateY(0)`), a CSS `transform` on a parent element creates a **new stacking context**. This means any `position: fixed` child is positioned relative to that transformed ancestor instead of the viewport.

`Modal.jsx` renders a `div` with `className="fixed inset-0 z-50"`. Because its ancestor (`.page-fade-in`) has a transform, the fixed element is contained within that wrapper — it ends up clipped and mispositioned rather than covering the full viewport.

## Fix
Use `createPortal` in `Modal.jsx` to render the modal directly at `document.body`, which is above all stacking contexts and unaffected by any ancestor transforms.

```jsx
import { createPortal } from 'react-dom';
// Wrap the return JSX with:
return createPortal(<div className="fixed inset-0 z-50">...</div>, document.body);
```
