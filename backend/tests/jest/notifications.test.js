/**
 * notifications.test.js
 *
 * Tests the Notifications endpoints:
 *   GET    /api/notifications            -> list with cursor pagination + unreadCount
 *   PATCH  /api/notifications/read       -> mark all as read
 *   PATCH  /api/notifications/:id/read   -> mark one as read
 *   DELETE /api/notifications/:id        -> delete own notification
 *
 * Integration tests that verify notify() is called correctly from
 * downstream controllers (comments and friends).
 */

const request = require('supertest');
const app = require('../../app');
const Notification = require('../../models/Notification');
const { connectTestDb, clearTestDb, closeTestDb } = require('./testDb');
const { registerAndLogin, makeFriends } = require('./testHelpers');

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(closeTestDb);

// Helper: create a note owned by the token holder
async function createNote(token) {
  const res = await request(app)
    .post('/api/notes')
    .set('Authorization', `Bearer ${token}`)
    .send({ title: 'Test Note', content: 'Content', visibility: 'friends' });
  return res.body.note._id;
}

// Helper: seed a Notification document directly (bypasses notify() for unit-style checks)
async function seedNotif(userId, overrides = {}) {
  return Notification.create({
    userId,
    actorId: userId, // overridden in tests as needed
    type: 'comment_added',
    targetId: userId,
    targetType: 'note',
    message: 'Someone commented on your note',
    read: false,
    createdAt: new Date(),
    ...overrides,
  });
}

// ─── Auth guards ─────────────────────────────────────────────────────────────

describe('Notifications auth guards', () => {
  it('GET /api/notifications returns 401 without token', async () => {
    const res = await request(app).get('/api/notifications');
    expect(res.statusCode).toBe(401);
  });

  it('PATCH /api/notifications/read returns 401 without token', async () => {
    const res = await request(app).patch('/api/notifications/read');
    expect(res.statusCode).toBe(401);
  });

  it('PATCH /api/notifications/:id/read returns 401 without token', async () => {
    const res = await request(app).patch('/api/notifications/000000000000000000000001/read');
    expect(res.statusCode).toBe(401);
  });

  it('DELETE /api/notifications/:id returns 401 without token', async () => {
    const res = await request(app).delete('/api/notifications/000000000000000000000001');
    expect(res.statusCode).toBe(401);
  });
});

// ─── GET /api/notifications ───────────────────────────────────────────────────

describe('GET /api/notifications', () => {
  it('returns empty list for a new user', async () => {
    const { token } = await registerAndLogin();

    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.notifications).toHaveLength(0);
    expect(res.body.unreadCount).toBe(0);
  });

  it('returns notifications newest-first for the authenticated user only', async () => {
    const alice = await registerAndLogin();
    const bob = await registerAndLogin();

    // Create one notification for Alice and one for Bob
    await seedNotif(alice.userId, { message: 'Alice notif' });
    await seedNotif(bob.userId, { message: 'Bob notif' });

    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${alice.token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.notifications).toHaveLength(1);
    expect(res.body.notifications[0].message).toBe('Alice notif');
  });

  it('returns correct unreadCount', async () => {
    const { token, userId } = await registerAndLogin();

    await seedNotif(userId, { read: false });
    await seedNotif(userId, { read: false });
    await seedNotif(userId, { read: true });

    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.unreadCount).toBe(2);
    expect(res.body.notifications).toHaveLength(3);
  });

  it('returns hasMore: true and nextCursor when there are more results', async () => {
    const { token, userId } = await registerAndLogin();

    // Create 5 notifications but request limit=2
    for (let i = 0; i < 5; i++) {
      await seedNotif(userId, { message: `notif ${i}`, createdAt: new Date(Date.now() - i * 1000) });
    }

    const res = await request(app)
      .get('/api/notifications?limit=2')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.hasMore).toBe(true);
    expect(res.body.nextCursor).toBeTruthy();
    expect(res.body.notifications).toHaveLength(2);
  });
});

// ─── PATCH /api/notifications/read ───────────────────────────────────────────

describe('PATCH /api/notifications/read', () => {
  it('marks all unread notifications as read', async () => {
    const { token, userId } = await registerAndLogin();

    await seedNotif(userId, { read: false });
    await seedNotif(userId, { read: false });

    const res = await request(app)
      .patch('/api/notifications/read')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    const unread = await Notification.countDocuments({ userId, read: false });
    expect(unread).toBe(0);
  });

  it('is idempotent - no error when no unread notifications exist', async () => {
    const { token, userId } = await registerAndLogin();

    await seedNotif(userId, { read: true });

    const res = await request(app)
      .patch('/api/notifications/read')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
  });
});

// ─── PATCH /api/notifications/:id/read ───────────────────────────────────────

describe('PATCH /api/notifications/:id/read', () => {
  it('marks a single notification as read', async () => {
    const { token, userId } = await registerAndLogin();
    const notif = await seedNotif(userId, { read: false });

    const res = await request(app)
      .patch(`/api/notifications/${notif._id}/read`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    const updated = await Notification.findById(notif._id);
    expect(updated.read).toBe(true);
    expect(updated.readAt).toBeTruthy();
  });

  it('returns 403 when a different user tries to mark it read', async () => {
    const alice = await registerAndLogin();
    const bob = await registerAndLogin();
    const notif = await seedNotif(alice.userId);

    const res = await request(app)
      .patch(`/api/notifications/${notif._id}/read`)
      .set('Authorization', `Bearer ${bob.token}`);

    expect(res.statusCode).toBe(403);
  });

  it('returns 404 for a nonexistent notification', async () => {
    const { token } = await registerAndLogin();

    const res = await request(app)
      .patch('/api/notifications/000000000000000000000001/read')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(404);
  });
});

// ─── DELETE /api/notifications/:id ───────────────────────────────────────────

describe('DELETE /api/notifications/:id', () => {
  it('allows the owner to delete their notification', async () => {
    const { token, userId } = await registerAndLogin();
    const notif = await seedNotif(userId);

    const res = await request(app)
      .delete(`/api/notifications/${notif._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    const gone = await Notification.findById(notif._id);
    expect(gone).toBeNull();
  });

  it('returns 403 when a different user tries to delete it', async () => {
    const alice = await registerAndLogin();
    const bob = await registerAndLogin();
    const notif = await seedNotif(alice.userId);

    const res = await request(app)
      .delete(`/api/notifications/${notif._id}`)
      .set('Authorization', `Bearer ${bob.token}`);

    expect(res.statusCode).toBe(403);
  });

  it('returns 404 for a nonexistent notification', async () => {
    const { token } = await registerAndLogin();

    const res = await request(app)
      .delete('/api/notifications/000000000000000000000001')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(404);
  });
});

// ─── notify() integration - triggered by existing controller actions ──────────

describe('notify() integration via controller actions', () => {
  it('creates a comment_added Notification with commentPreview metadata for the note owner', async () => {
    const { alice, bob } = await makeFriends();
    const noteId = await createNote(alice.token);

    await request(app)
      .post('/api/comments')
      .set('Authorization', `Bearer ${bob.token}`)
      .send({ targetId: noteId, targetType: 'note', content: 'Nice note!' });

    await new Promise(r => setTimeout(r, 50));

    const notif = await Notification.findOne({ userId: alice.userId, type: 'comment_added' });
    expect(notif).not.toBeNull();
    expect(notif.targetType).toBe('note');
    expect(notif.metadata.commentPreview).toBe('Nice note!');
    expect(notif.metadata.commentId).toBeDefined();
  });

  it('like_added notification includes resourceId and resourceType metadata', async () => {
    const { alice, bob } = await makeFriends();
    const noteId = await createNote(alice.token);

    // Bob comments on Alice's note
    const commentRes = await request(app)
      .post('/api/comments')
      .set('Authorization', `Bearer ${bob.token}`)
      .send({ targetId: noteId, targetType: 'note', content: 'Great note' });

    const commentId = commentRes.body.comment._id;

    // Alice likes Bob's comment
    await request(app)
      .post(`/api/comments/${commentId}/like`)
      .set('Authorization', `Bearer ${alice.token}`);

    await new Promise(r => setTimeout(r, 50));

    const notif = await Notification.findOne({ userId: bob.userId, type: 'like_added' });
    expect(notif).not.toBeNull();
    expect(notif.metadata.resourceId).toBe(noteId);
    expect(notif.metadata.resourceType).toBe('note');
    expect(notif.metadata.commentPreview).toBeTruthy();
  });

  it('comment_reply notification includes resourceId and resourceType metadata', async () => {
    const { alice, bob } = await makeFriends();
    const noteId = await createNote(alice.token);

    // Bob comments on Alice's note (Bob is the parent comment author)
    const parentRes = await request(app)
      .post('/api/comments')
      .set('Authorization', `Bearer ${bob.token}`)
      .send({ targetId: noteId, targetType: 'note', content: 'Original comment' });

    const parentId = parentRes.body.comment._id;

    // Alice replies to Bob's comment - Bob gets a comment_reply notification
    // (Alice is the note owner but Bob is the parent author, so the guard passes)
    await request(app)
      .post('/api/comments')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ targetId: noteId, targetType: 'note', content: 'My reply', parentId });

    await new Promise(r => setTimeout(r, 50));

    const notif = await Notification.findOne({ userId: bob.userId, type: 'comment_reply' });
    expect(notif).not.toBeNull();
    expect(notif.metadata.commentPreview).toBe('My reply');
    expect(notif.metadata.commentId).toBeDefined();
    expect(notif.metadata.resourceId).toBe(noteId);
    expect(notif.metadata.resourceType).toBe('note');
  });

  it('creates a friend_accepted Notification for the requester when their request is accepted', async () => {
    const alice = await registerAndLogin();
    const bob = await registerAndLogin();

    const reqRes = await request(app)
      .post('/api/friends/request')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ recipientId: bob.userId });

    const friendshipId = reqRes.body.friendship._id;

    await request(app)
      .put(`/api/friends/request/${friendshipId}`)
      .set('Authorization', `Bearer ${bob.token}`)
      .send({ action: 'accept' });

    await new Promise(r => setTimeout(r, 50));

    const notif = await Notification.findOne({ userId: alice.userId, type: 'friend_accepted' });
    expect(notif).not.toBeNull();
  });

  it('does not create a notification when a user comments on their own note', async () => {
    const { token, userId } = await registerAndLogin();
    const noteId = await createNote(token);

    await request(app)
      .post('/api/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({ targetId: noteId, targetType: 'note', content: 'My own comment' });

    await new Promise(r => setTimeout(r, 50));

    const count = await Notification.countDocuments({ userId, type: 'comment_added' });
    expect(count).toBe(0);
  });

  it('creates a mention notification when a comment @mentions a friend', async () => {
    const { alice, bob } = await makeFriends();
    // Carol is also friends with bob so bob can @mention carol
    const carol = await registerAndLogin({ username: 'carol_test' });
    // Make bob and carol friends
    const reqRes = await request(app)
      .post('/api/friends/request')
      .set('Authorization', `Bearer ${bob.token}`)
      .send({ recipientId: carol.userId });
    await request(app)
      .put(`/api/friends/request/${reqRes.body.friendship._id}`)
      .set('Authorization', `Bearer ${carol.token}`)
      .send({ action: 'accept' });

    const noteId = await createNote(alice.token);

    await request(app)
      .post('/api/comments')
      .set('Authorization', `Bearer ${bob.token}`)
      .send({ targetId: noteId, targetType: 'note', content: `Hey @carol_test check this out` });

    await new Promise(r => setTimeout(r, 50));

    const notif = await Notification.findOne({ userId: carol.userId, type: 'mention' });
    expect(notif).not.toBeNull();
    expect(notif.message).toMatch(/mentioned you in a comment/);
    expect(notif.metadata.commentPreview).toContain('@carol_test');
    expect(notif.metadata.resourceId).toBe(noteId);
    expect(notif.metadata.resourceType).toBe('note');
    expect(notif.metadata.commentId).toBeDefined();
  });

  it('does not send a mention notification when mentioning a non-friend', async () => {
    const { alice, bob } = await makeFriends();
    const stranger = await registerAndLogin({ username: 'stranger_test' });
    const noteId = await createNote(alice.token);

    await request(app)
      .post('/api/comments')
      .set('Authorization', `Bearer ${bob.token}`)
      .send({ targetId: noteId, targetType: 'note', content: `@stranger_test check this` });

    await new Promise(r => setTimeout(r, 50));

    const count = await Notification.countDocuments({ userId: stranger.userId, type: 'mention' });
    expect(count).toBe(0);
  });

  it('does not send a mention notification to self', async () => {
    const { alice, bob } = await makeFriends();
    const noteId = await createNote(alice.token);

    await request(app)
      .post('/api/comments')
      .set('Authorization', `Bearer ${bob.token}`)
      .send({ targetId: noteId, targetType: 'note', content: `@${bob.username} reminding myself` });

    await new Promise(r => setTimeout(r, 50));

    const count = await Notification.countDocuments({ userId: bob.userId, type: 'mention' });
    expect(count).toBe(0);
  });

  it('does not send duplicate mention to content owner already notified via comment_added', async () => {
    const { alice, bob } = await makeFriends();
    const noteId = await createNote(alice.token);

    await request(app)
      .post('/api/comments')
      .set('Authorization', `Bearer ${bob.token}`)
      .send({ targetId: noteId, targetType: 'note', content: `@${alice.username} great note` });

    await new Promise(r => setTimeout(r, 50));

    const mentionCount = await Notification.countDocuments({ userId: alice.userId, type: 'mention' });
    const commentCount = await Notification.countDocuments({ userId: alice.userId, type: 'comment_added' });
    expect(mentionCount).toBe(0);
    expect(commentCount).toBe(1);
  });

  it('notification messages include full name (first + last)', async () => {
    const { alice, bob } = await makeFriends();
    const noteId = await createNote(alice.token);

    await request(app)
      .post('/api/comments')
      .set('Authorization', `Bearer ${bob.token}`)
      .send({ targetId: noteId, targetType: 'note', content: 'Test comment' });

    await new Promise(r => setTimeout(r, 50));

    const notif = await Notification.findOne({ userId: alice.userId, type: 'comment_added' });
    expect(notif).not.toBeNull();
    expect(notif.message).toMatch(/^Test User commented/);
  });
});
