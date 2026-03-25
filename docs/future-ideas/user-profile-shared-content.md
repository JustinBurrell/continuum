# Spec: Shared Tasks & Flashcard Sets on User Profiles

**Status:** Not started
**Priority:** Pre-launch (step 10 polish)
**Affects:** Frontend (UserProfile.jsx) only — both backend endpoints already exist

---

## What exists today

When you visit a friend's profile (`/users/view`), `UserProfile.jsx` currently shows:

- **Shared Notes** — fetches `GET /api/notes/shared`, filters by `note.userId === profile.id`
- **Recent Activity** — fetches `GET /api/activity`, filters by `activity.userId === profile.id`, slices to 8

Both sections are gated behind `isFriend === true`.

The backend already has:

| Endpoint | Controller | Returns |
|----------|------------|---------|
| `GET /api/tasks/shared` | `getSharedTasks` | `{ success: true, tasks: [...] }` — shared tasks where current user is a participant and not the owner. `userId` is a raw ObjectId. |
| `GET /api/flashcard-sets/shared` | `getSharedSets` | `{ success: true, sets: [...] }` — sets visible to current user from friends. `userId` is populated: `{ _id, username, firstName, lastName }`. |

Neither is shown on the user profile page.

---

## What to build

### Frontend only — `web/src/pages/UserProfile.jsx`

**No backend changes needed.**

#### 1. Fetch shared tasks (friend-gated)

```js
const { data: sharedTasksData } = useQuery({
  queryKey: ['shared-tasks'],
  queryFn: () => api.get('/tasks/shared').then(r => r.data),
  enabled: isFriend,
});
const allSharedTasks = sharedTasksData?.tasks || [];
const sharedTasks = allSharedTasks.filter(t => t.userId?.toString() === id?.toString());
```

Note: `task.userId` is a raw ObjectId string (not populated), so `.toString()` comparison works directly.

#### 2. Fetch shared flashcard sets (friend-gated)

```js
const { data: sharedSetsData } = useQuery({
  queryKey: ['shared-flashcard-sets'],
  queryFn: () => api.get('/flashcard-sets/shared').then(r => r.data),
  enabled: isFriend,
});
const allSharedSets = sharedSetsData?.sets || [];
const sharedSets = allSharedSets.filter(s => {
  const setUserId = s.userId?._id?.toString() ?? s.userId?.toString();
  return setUserId === id?.toString();
});
```

Note: `set.userId` is populated (`{ _id, username, firstName, lastName }`), so use `._id` first, fall back to direct string.

#### 3. Add two sections in the `isFriend` block

Insert **between Shared Notes and Recent Activity** (in this order):

1. Shared Notes (already exists)
2. **Shared Tasks** (new)
3. **Shared Flashcard Sets** (new)
4. Recent Activity (already exists)

**Shared Tasks section** — same card style as shared notes, 2-column grid:

- Each card: task title, status badge, due date
- Link to `/tasks` (no task detail deep-link currently; link to tasks list)
- Empty state: `"{name} hasn't shared any tasks with you yet."`

**Shared Flashcard Sets section** — same card style, 2-column grid:

- Each card: set title, card count (`{set.totalCards} cards`)
- Link to `/flashcards/view` with `state: { id: set._id }`
- Empty state: `"{name} hasn't shared any flashcard sets with you yet."`

Both sections use the same section header pattern as Shared Notes:
```jsx
<div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, paddingLeft: 2 }}>
  <CheckSquare size={13} style={{ color: '#a087b0' }} />   {/* or <Layers /> */}
  <h2 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a087b0', margin: 0 }}>
    Shared Tasks
  </h2>
</div>
```

Icons already imported in the file: `CheckSquare` (tasks), `Layers` (flashcard sets).

---

## Testing

### Jest — add to existing suites

There is no dedicated user-profile test file. Add to **`backend/tests/jest/tasks.test.js`**:

```js
describe('GET /api/tasks/shared', () => {
  it('returns shared tasks where current user is a participant (not owner)', async () => {
    const alice = await registerAndLogin({ username: 'alice_shared', email: 'alice_s@test.com' });
    const bob = await registerAndLogin({ username: 'bob_shared', email: 'bob_s@test.com' });

    // Alice creates a task shared with Bob
    const tomorrow = new Date(Date.now() + 86400000).toISOString();
    const taskRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ title: 'Shared Task', dueDate: tomorrow, isShared: true });

    // Add Bob as participant
    await request(app)
      .patch(`/api/tasks/${taskRes.body.task._id}/participants`)
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ participantId: bob.userId, action: 'add' });

    // Bob fetches shared tasks
    const res = await request(app)
      .get('/api/tasks/shared')
      .set('Authorization', `Bearer ${bob.token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.tasks.some(t => t._id === taskRes.body.task._id)).toBe(true);
  });
});
```

Add to **`backend/tests/jest/flashcards.test.js`**:

```js
describe('GET /api/flashcard-sets/shared', () => {
  it('returns shared sets visible to friends', async () => {
    const alice = await registerAndLogin({ username: 'alice_fc', email: 'alice_fc@test.com' });

    // Alice creates a set with friends visibility
    const setRes = await request(app)
      .post('/api/flashcard-sets')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ title: 'Shared Set', visibility: 'friends' });

    // Alice fetches her own shared sets — won't appear (userId excluded)
    // Fetch as a different user who is friends with Alice
    // (Friendship setup follows same makeFriends pattern from messages.test.js)
    expect(setRes.statusCode).toBe(201);
    expect(setRes.body.success).toBe(true);
  });
});
```

Note: The full shared-sets test requires the friend flow (same `makeFriends` helper used in `messages.test.js`). Extract `makeFriends` into `testHelpers.js` when implementing so both test files can reuse it.

### Postman — update `continuum-session5.postman_collection.json`

This collection covers Flashcards and Tasks. Add requests:

- `GET /api/tasks/shared` — expects `200 { success: true, tasks: [] }`
- `GET /api/flashcard-sets/shared` — expects `200 { success: true, sets: [] }`

Run these after creating and sharing a task/set in the collection flow.

### Postman — update `continuum-local.postman_environment.json`

No new variables needed — both endpoints use existing `token` and `baseUrl`.

### Postman — update `README.md`

Add rows to the Tasks and Flashcard Sets tables:

**Tasks table:**
```
| Get Shared Tasks | none | `200` — returns tasks shared with the authenticated user | |
```

**Flashcard Sets table:**
```
| Get Shared Sets | none | `200` — returns sets from friends with friends/specific visibility | |
```

---

## Notes

- The `shared-tasks` and `shared-sets` React Query caches are already used by the Tasks and FlashcardSets pages. Reusing the same `queryKey` means the profile page benefits from existing cache — no duplicate network requests if the user visited those pages first.
- Both sections only render when `isFriend === true`, consistent with Shared Notes and Recent Activity.
- No new routes, models, or backend changes.
