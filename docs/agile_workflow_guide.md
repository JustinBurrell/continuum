# Agile Workflow Guide
**Continuum — Solo Developer Git & GitHub Workflow**

---

## Overview

Every ticket follows the same cycle:

```
Branch → Code → Commit → Push → PR → Review → Merge → Pull Main
```

---

## Branch Naming Convention

Format: `type/TICKET-ID-short-description`

| Type | When to use | Example |
|------|------------|---------|
| `feat/` | New feature or model | `feat/DB-2-note-model` |
| `fix/` | Bug fix | `fix/POL-9-login-redirect` |
| `test/` | Tests or seed data | `test/DB-5-seed-script` |
| `refactor/` | Code restructuring | `refactor/POL-2-error-responses` |
| `docs/` | Documentation only | `docs/POL-11-demo-script` |

---

## Commit Message Convention

Format: `type: short description`

```
feat: add note model with embedded summary
fix: resolve duplicate email validation error
test: add seed script for core models
refactor: standardize error responses
docs: prepare demo script
```

Keep it under 72 characters. Focus on **what** changed, not **how**.

---

## Full Workflow (Step by Step)

### 1. Start from an up-to-date main

```bash
git checkout main
git pull origin main
```

### 2. Create a feature branch

```bash
git checkout -b feat/DB-2-note-model
```

### 3. Do your work

Write code, test it, make sure it works.

### 4. Stage and commit

```bash
# Stage specific files (preferred — avoids accidentally committing .env, etc.)
git add backend/models/Note.js

# Commit with a descriptive message
git commit -m "feat: add note model with embedded summary"
```

**Multiple commits are fine** — if your work has logical chunks, commit each one:
```bash
git add backend/models/Note.js
git commit -m "feat: add note schema with ownership and content fields"

git add backend/models/Note.js
git commit -m "feat: add embedded summary, indexes, and text search to note model"
```

### 5. Push to GitHub

```bash
# First push (sets upstream tracking)
git push -u origin feat/DB-2-note-model

# Subsequent pushes on the same branch
git push
```

### 6. Create a Pull Request

```bash
gh pr create --title "DB-2: feat: add note model with embedded summary" --body "$(cat <<'EOF'
Closes #2

## Summary
- Note schema with userId, title, content, googleDocId, tags, visibility
- Embedded summary (quickSummary, detailedSummary, generatedAt, model)
- Text index on title, content, tags
- Soft delete support

## Reference
See [Schema Implementation Order](docs/database/mongodb_schema_implementation_order.md)
EOF
)"
```

**Key**: `Closes #2` links the PR to issue #2 and auto-closes it on merge.

### 7. Review and merge in GitHub UI

1. Go to the PR link in your browser
2. Review the "Files changed" tab
3. Click **"Merge pull request"** → **"Confirm merge"**
4. Branch auto-deletes (if you enabled it in repo settings)

### 8. Update local main

```bash
git checkout main
git pull origin main
```

### 9. Clean up local branch (optional)

```bash
git branch -d feat/DB-2-note-model
```

---

## Cookie Cutter Template

Copy-paste this and fill in the blanks:

```bash
# Start fresh
git checkout main
git pull origin main

# Create branch
git checkout -b feat/___TICKET-ID___-___short-description___

# ... do your work ...

# Stage and commit
git add ___files___
git commit -m "feat: ___description___"

# Push
git push -u origin feat/___TICKET-ID___-___short-description___

# Create PR
gh pr create --title "___TICKET-ID___: feat: ___description___" --body "$(cat <<'EOF'
Closes #___ISSUE-NUMBER___

## Summary
- ___bullet points of what changed___

## Reference
___link to relevant docs___
EOF
)"

# After merging in GitHub UI:
git checkout main
git pull origin main
git branch -d feat/___TICKET-ID___-___short-description___
```

---

## Useful gh Commands

```bash
# List your open PRs
gh pr list

# View a specific PR
gh pr view 63

# List issues for a milestone
gh issue list --milestone "Sprint 1 (2/23)"

# Close an issue manually
gh issue close 1

# Check what branch you're on
git branch

# See all branches (local)
git branch -a

# See status of your working directory
git status
```

---

## GitHub Repo Settings (One-Time Setup)

Go to GitHub → repo → **Settings** → **Pull Requests**:
- [x] **Automatically delete head branches** — cleans up merged branches
- [x] **Allow squash merging** — optional, combines all commits into one on merge

---

## Labels

| Label | Color | Purpose |
|-------|-------|---------|
| `phase-1-database` | Blue | MongoDB schemas and models |
| `phase-2-api` | Green | Express REST APIs |
| `phase-3-frontend` | Yellow | React web + React Native mobile |
| `phase-4-polish` | Red | Polish, testing, showcase prep |
| `database` | Light blue | MongoDB/Mongoose schema work |
| `api` | Light green | Express API endpoints |
| `web` | Light yellow | React web frontend |
| `mobile` | Light pink | React Native/Expo mobile |
| `test` | Gray | Testing and seed data |
| `must-ship` | Dark red | Required for showcase |
| `stretch` | Yellow | Nice to have, cut if needed |

---

## Sprint Milestones

| Sprint | Date | Focus |
|--------|------|-------|
| Sprint 1 | 2/23 | Core Models (User, Note, FlashcardSet, Flashcard, Task) |
| Sprint 2 | 3/2 | Social & Career Models (Friendship, Comment, Resume, Application) |
| Sprint 3 | 3/9 | Auth & Notes APIs |
| Sprint 4 | 3/16 | AI, Flashcards & Tasks APIs |
| Sprint 5 | 3/23 | Social & Career APIs |
| Sprint 6 | 3/30 | Auth, Notes & Learning UI (Web + Mobile) |
| Sprint 7 | 4/6 | Social, Career & Polish (Web + Mobile) |
| Sprint 8 | 4/13 | Final Polish & Showcase Prep |

---

*Last Updated: February 17, 2026*
