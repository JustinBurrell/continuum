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
const app = require('../app');
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
