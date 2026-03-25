# Backend Testing

## Overview

The backend has two layers of testing that coexist:

| Layer | Tool | When to use |
|-------|------|-------------|
| **Integration tests** | Jest + Supertest | Automated — runs on every PR via GitHub Actions |
| **Manual / exploratory** | Postman | Ad-hoc testing, new endpoint smoke tests, demo flows |

Seed scripts for dev data live in `tests/mongodb/`.

---

## Integration Tests (Jest + Supertest)

### What's tested

57 tests across 7 suites covering every core feature:

| Suite | File | What it covers |
|-------|------|----------------|
| Auth | `auth.test.js` | Register, login, `GET /me`, token validation, password not leaked in response |
| Notes | `notes.test.js` | CRUD, ownership isolation (Alice can't read Bob's notes) |
| Tasks | `tasks.test.js` | CRUD, status update, ownership isolation, shared tasks (participant visibility, owner exclusion) |
| Flashcard Sets | `flashcards.test.js` | Create set, add card, ownership isolation, shared sets (friends visibility, private exclusion) |
| Applications | `applications.test.js` | Create, read, update status, delete (owner-only) |
| Messages | `messages.test.js` | Friend flow → create conversation → send message → read messages, non-participant blocked, message delete (soft, per-user), conversation delete (Instagram-style) |
| Activity | `activity.test.js` | Feed accessible when authenticated, blocked when not |

### How it works

**No real database is touched.** `mongodb-memory-server` spins up a real MongoDB process in RAM for the duration of the test run. It's torn down when Jest exits. This means:

- Tests run offline
- Tests run in CI without needing Atlas credentials
- Every test file gets a clean database (`afterEach` wipes all collections)
- Tests can run in parallel without stepping on each other's data (we use `--runInBand` for simplicity, but isolation is guaranteed regardless)

**No real Express server is started on a port.** Tests import `app.js` directly and pass it to `supertest`. Supertest handles opening and closing the connection internally — no port conflicts.

### Running locally

```bash
cd backend
npm test          # run all suites once
npm run test:watch  # re-run affected suites on file save
```

### How to add a new test suite

1. Create `backend/tests/jest/<feature>.test.js`
2. Copy this boilerplate:

```js
const request = require('supertest');
const app = require('../../app');
const { connectTestDb, clearTestDb, closeTestDb } = require('./testDb');
const { registerAndLogin } = require('./testHelpers');

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(closeTestDb);

describe('POST /api/<feature>', () => {
  it('creates a <feature>', async () => {
    const { token } = await registerAndLogin();

    const res = await request(app)
      .post('/api/<feature>')
      .set('Authorization', `Bearer ${token}`)
      .send({ /* required fields */ });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
  });
});
```

3. Run `npm test` — Jest picks it up automatically. No config changes needed.

### Adding a new env var requirement

If a new route requires an API key or env var at module load time (e.g., a new SDK that throws if the key is missing), add a dummy value in two places:

- `backend/tests/jest/setup.js` — for local test runs
- `.github/workflows/ci.yml` under the `env:` block of the `Run tests` step — for CI

Both need the same key. The value can be anything — tests don't make real external calls.

### Response shape conventions

All controllers return `{ success: true, <resourceName> }` on success and `{ success: false, error }` on failure. Resource keys match the model name (singular for single objects, plural for lists):

| Resource | Single | List |
|----------|--------|------|
| Note | `note` | `notes` |
| Task | `task` | `tasks` |
| Flashcard Set | `set` | `sets` |
| Application | `application` | `applications` |
| Conversation | `conversation` | `conversations` |
| Message | `message` | `messages` |

---

## GitHub Actions CI

Every push to any branch and every PR targeting `main` triggers the CI workflow (`.github/workflows/ci.yml`). The workflow:

1. Checks out the code on an Ubuntu runner
2. Installs Node 24
3. Runs `npm ci` in `backend/`
4. Caches the `mongodb-memory-server` binary (saves ~30s per run)
5. Runs `npm test` with all required env vars set to dummy values

**Blocking merges:** Go to GitHub → Settings → Branches → Add rule for `main` → enable **"Require status checks to pass before merging"** → select **`Jest test suite`**. After that, any PR with failing tests cannot be merged.

---

## Postman Collections

Located in `backend/tests/postman/`. Collections are organized by session:

| File | Coverage |
|------|---------|
| `continuum-session3-4.postman_collection.json` | Auth, Notes |
| `continuum-session5.postman_collection.json` | Flashcards, Tasks |
| `continuum-session6.postman_collection.json` | Calendar, Friends |
| `continuum-session7.postman_collection.json` | Messages, Conversations |
| `continuum-session8.postman_collection.json` | Applications, Resumes |
| `continuum-session9.postman_collection.json` | Activity, Google, AI endpoints |
| `continuum-session10.postman_collection.json` | Full flow smoke test |

Use `continuum-local.postman_environment.json` to set `baseUrl` and `token` variables when running locally.

---

## MongoDB Seed Scripts

Located in `backend/tests/mongodb/`. These connect to your real dev database (not the in-memory one) and insert sample data for development and demos.

```bash
# From backend/
node tests/mongodb/test-db-connection.js       # verify connection
node tests/mongodb/test-seed-core-models.js    # users, notes, tasks, flashcards
node tests/mongodb/test-seed-social-and-career-models.js  # friends, messages, applications
```

Never run seed scripts against the production database.
