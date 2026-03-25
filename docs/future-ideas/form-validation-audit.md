# Form Validation & Required Field Audit

## Problem
Required fields across the app have no visual indicator (no `*`) and submit silently when left empty — the form just does nothing, leaving the user with no feedback. This needs a full frontend audit and fix.

## Requirements
1. **Required field indicator** — any field required for submission shows a red `*` next to its label
2. **Inline validation** — on submit attempt, empty required fields show a red error message below the input (e.g. "Title is required")
3. **No silent failures** — forms never do nothing on submit; either submit successfully or show clear errors
4. **Consistent pattern** — same visual treatment across all forms (reuse existing `Input` component error prop if available, otherwise standardize)

---

## Forms to Audit

### Auth
| Form | Required Fields |
|------|----------------|
| Login | Email, Password |
| Register | First name, Last name, Username, Email, Password |
| Forgot Password | Email |
| Reset Password | New password, Confirm password |

### Tasks
| Form | Required Fields |
|------|----------------|
| Create Task | Title |
| Edit Task | Title |

### Notes
| Form | Required Fields |
|------|----------------|
| Create Note | Title |
| Edit Note | Title |

### Flashcards
| Form | Required Fields |
|------|----------------|
| Create Flashcard Set | Title |
| Add Card to Set | Front, Back |
| Edit Card | Front, Back |

### Applications
| Form | Required Fields |
|------|----------------|
| Create Application | Company, Role |
| Edit Application | Company, Role |

### Resumes
| Form | Required Fields |
|------|----------------|
| Upload Resume | File |

### Social
| Form | Required Fields |
|------|----------------|
| Send Message | Message content |
| Add Comment | Comment content |
| Share Note/Set | At least one recipient (if sharing with specific users) |

### Profile / Settings
| Form | Required Fields |
|------|----------------|
| Update Profile | First name, Last name, Username |
| Change Password | Current password, New password, Confirm password |

---

## Implementation Notes
- Use React Hook Form's `required` rule — it already handles validation state, just need to wire the error display
- Most forms already use React Hook Form; this is primarily a UI wiring pass, not a logic rewrite
- Error message style: small red text below the input, same font size as helper text (`fontSize: 12, color: '#dc2626'`)
- Required `*` style: `color: '#dc2626'`, placed after the label text
- Disable the submit button while the form has validation errors (optional but good UX)
- Auth forms may already have some validation — audit before adding duplicate logic

---

## Acceptance Criteria
- Every required field has a visible `*` indicator
- Submitting with empty required fields shows inline errors, never silently fails
- Errors clear when the user starts typing in the field
- Works on mobile viewport (375px)

## When Done — Update
- **Jest** — add validation tests to relevant test files (e.g. task creation with missing title should not hit the API; auth registration with missing fields returns 400)
- **Postman** — add "missing required field" error cases to each relevant collection folder (e.g. `POST /api/tasks` with no title → `400`)
- **`docs/backend/api_reference_guide.md`** — confirm required fields are documented per endpoint
- **`backend/tests/jest/README.md`** — update test coverage descriptions if new validation tests are added
- **`backend/tests/postman/README.md`** — add new error case rows to affected session tables
