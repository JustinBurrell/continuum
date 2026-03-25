/**
 * messages.test.js
 *
 * Tests the Conversations and Messages endpoints:
 *   POST /api/conversations               → { success, conversation }
 *   GET  /api/conversations               → { success, conversations }
 *   POST /api/conversations/:id/messages  → { success, message }
 *   GET  /api/conversations/:id/messages  → { success, messages }
 *
 * Conversations require an accepted friendship — each test that needs one
 * calls makeFriends() to set up alice ↔ bob before proceeding.
 */

const request = require('supertest');
const app = require('../../app');
const { connectTestDb, clearTestDb, closeTestDb } = require('./testDb');
const { registerAndLogin } = require('./testHelpers');

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(closeTestDb);

/**
 * Creates an accepted friendship between alice and bob.
 * Returns { alice, bob } with tokens and userIds.
 */
async function makeFriends() {
  const alice = await registerAndLogin();
  const bob = await registerAndLogin();

  // Alice sends request
  const req = await request(app)
    .post('/api/friends/request')
    .set('Authorization', `Bearer ${alice.token}`)
    .send({ recipientId: bob.userId });

  const friendshipId = req.body.friendship._id;

  // Bob accepts
  await request(app)
    .put(`/api/friends/request/${friendshipId}`)
    .set('Authorization', `Bearer ${bob.token}`)
    .send({ action: 'accept' });

  return { alice, bob };
}

// ─── Auth guard ─────────────────────────────────────────────────────────────

describe('Conversations auth guard', () => {
  it('GET /api/conversations returns 401 without token', async () => {
    const res = await request(app).get('/api/conversations');
    expect(res.statusCode).toBe(401);
  });
});

// ─── Create conversation ─────────────────────────────────────────────────────

describe('POST /api/conversations', () => {
  it('creates a conversation between two friends', async () => {
    const { alice, bob } = await makeFriends();

    const res = await request(app)
      .post('/api/conversations')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ participantId: bob.userId });

    expect([200, 201]).toContain(res.statusCode);
    expect(res.body.success).toBe(true);
    expect(res.body.conversation).toBeDefined();
  });

  it('returns same conversation if already exists (idempotent)', async () => {
    const { alice, bob } = await makeFriends();

    const first = await request(app)
      .post('/api/conversations')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ participantId: bob.userId });

    const second = await request(app)
      .post('/api/conversations')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ participantId: bob.userId });

    expect([200, 201]).toContain(second.statusCode);
    expect(second.body.conversation._id).toBe(first.body.conversation._id);
  });

  it('returns 403 when trying to message a non-friend', async () => {
    const alice = await registerAndLogin();
    const bob = await registerAndLogin();

    const res = await request(app)
      .post('/api/conversations')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ participantId: bob.userId });

    expect(res.statusCode).toBe(403);
  });
});

// ─── List conversations ──────────────────────────────────────────────────────

describe('GET /api/conversations', () => {
  it('returns the user\'s conversations', async () => {
    const { alice, bob } = await makeFriends();

    await request(app)
      .post('/api/conversations')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ participantId: bob.userId });

    const res = await request(app)
      .get('/api/conversations')
      .set('Authorization', `Bearer ${alice.token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.conversations.length).toBeGreaterThanOrEqual(1);
  });
});

// ─── Send and read messages ──────────────────────────────────────────────────

describe('Messages in a conversation', () => {
  it('sends a message and retrieves it', async () => {
    const { alice, bob } = await makeFriends();

    const conv = await request(app)
      .post('/api/conversations')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ participantId: bob.userId });

    const convId = conv.body.conversation._id;

    const send = await request(app)
      .post(`/api/conversations/${convId}/messages`)
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ content: 'Hey Bob!' });

    expect(send.statusCode).toBe(201);
    expect(send.body.message.content).toBe('Hey Bob!');

    const read = await request(app)
      .get(`/api/conversations/${convId}/messages`)
      .set('Authorization', `Bearer ${alice.token}`);

    expect(read.statusCode).toBe(200);
    const contents = read.body.messages.map((m) => m.content);
    expect(contents).toContain('Hey Bob!');
  });

  it('soft-deletes a message for the sender only (other participant unaffected)', async () => {
    const { alice, bob } = await makeFriends();

    const conv = await request(app)
      .post('/api/conversations')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ participantId: bob.userId });

    const convId = conv.body.conversation._id;

    const send = await request(app)
      .post(`/api/conversations/${convId}/messages`)
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ content: 'This message will be deleted' });

    const msgId = send.body.message._id;

    // Alice deletes the message for herself
    const del = await request(app)
      .delete(`/api/messages/${msgId}`)
      .set('Authorization', `Bearer ${alice.token}`);

    expect(del.statusCode).toBe(200);
    expect(del.body.success).toBe(true);

    // Alice can no longer see the message
    const aliceView = await request(app)
      .get(`/api/conversations/${convId}/messages`)
      .set('Authorization', `Bearer ${alice.token}`);

    const aliceContents = aliceView.body.messages.map((m) => m.content);
    expect(aliceContents).not.toContain('This message will be deleted');

    // Bob still sees the message
    const bobView = await request(app)
      .get(`/api/conversations/${convId}/messages`)
      .set('Authorization', `Bearer ${bob.token}`);

    const bobContents = bobView.body.messages.map((m) => m.content);
    expect(bobContents).toContain('This message will be deleted');
  });

  it('returns 401 or 403 when non-participant tries to read messages', async () => {
    const { alice, bob } = await makeFriends();
    const eve = await registerAndLogin();

    const conv = await request(app)
      .post('/api/conversations')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ participantId: bob.userId });

    const convId = conv.body.conversation._id;

    const res = await request(app)
      .get(`/api/conversations/${convId}/messages`)
      .set('Authorization', `Bearer ${eve.token}`);

    expect([401, 403, 404]).toContain(res.statusCode);
  });
});

// ─── Delete conversation ──────────────────────────────────────────────────────

describe('DELETE /api/conversations/:id', () => {
  async function makeConversation() {
    const { alice, bob } = await makeFriends();
    const res = await request(app)
      .post('/api/conversations')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ participantId: bob.userId });
    return { alice, bob, convId: res.body.conversation._id };
  }

  it('hides conversation for the deleting user but not the other participant', async () => {
    const { alice, bob, convId } = await makeConversation();

    const del = await request(app)
      .delete(`/api/conversations/${convId}`)
      .set('Authorization', `Bearer ${alice.token}`);

    expect(del.statusCode).toBe(200);
    expect(del.body.success).toBe(true);

    // Alice no longer sees it in her inbox
    const aliceInbox = await request(app)
      .get('/api/conversations')
      .set('Authorization', `Bearer ${alice.token}`);
    const aliceIds = aliceInbox.body.conversations.map((c) => c._id);
    expect(aliceIds).not.toContain(convId);

    // Bob still sees it in his inbox
    const bobInbox = await request(app)
      .get('/api/conversations')
      .set('Authorization', `Bearer ${bob.token}`);
    const bobIds = bobInbox.body.conversations.map((c) => c._id);
    expect(bobIds).toContain(convId);
  });

  it('returns 403 when a non-participant tries to delete', async () => {
    const { convId } = await makeConversation();
    const eve = await registerAndLogin();

    const res = await request(app)
      .delete(`/api/conversations/${convId}`)
      .set('Authorization', `Bearer ${eve.token}`);

    expect(res.statusCode).toBe(403);
  });

  it('after alice deletes, starting a new DM with bob creates a fresh conversation', async () => {
    const { alice, bob, convId } = await makeConversation();

    await request(app)
      .delete(`/api/conversations/${convId}`)
      .set('Authorization', `Bearer ${alice.token}`);

    const newConv = await request(app)
      .post('/api/conversations')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ participantId: bob.userId });

    expect([200, 201]).toContain(newConv.statusCode);
    // Should be a new conversation, not the deleted one
    expect(newConv.body.conversation._id).not.toBe(convId);
  });
});
