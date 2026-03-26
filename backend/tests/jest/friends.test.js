/**
 * friends.test.js
 *
 * Tests the Friends endpoints:
 *   POST   /api/friends/request          → send a request
 *   PUT    /api/friends/request/:id      → accept or decline
 *   DELETE /api/friends/request/:id      → cancel a sent request
 *   GET    /api/friends                  → list accepted friends
 *   GET    /api/friends?status=pending   → list pending received requests
 *   GET    /api/friends?status=sent      → list sent requests
 *   DELETE /api/friends/:id              → remove a friend
 */

const request = require('supertest');
const app = require('../../app');
const { connectTestDb, clearTestDb, closeTestDb } = require('./testDb');
const { registerAndLogin } = require('./testHelpers');

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(closeTestDb);

// ─── Auth guards ─────────────────────────────────────────────────────────────

describe('Friends auth guards', () => {
  it('GET /api/friends returns 401 without token', async () => {
    const res = await request(app).get('/api/friends');
    expect(res.statusCode).toBe(401);
  });

  it('POST /api/friends/request returns 401 without token', async () => {
    const res = await request(app).post('/api/friends/request').send({ recipientId: '000000000000000000000001' });
    expect(res.statusCode).toBe(401);
  });
});

// ─── Send request ────────────────────────────────────────────────────────────

describe('POST /api/friends/request', () => {
  it('sends a friend request and returns the friendship', async () => {
    const alice = await registerAndLogin();
    const bob = await registerAndLogin();

    const res = await request(app)
      .post('/api/friends/request')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ recipientId: bob.userId });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.friendship).toBeDefined();
    expect(res.body.friendship.status).toBe('pending');
  });

  it('returns 400 when sending a request to yourself', async () => {
    const alice = await registerAndLogin();

    const res = await request(app)
      .post('/api/friends/request')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ recipientId: alice.userId });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when a request already exists', async () => {
    const alice = await registerAndLogin();
    const bob = await registerAndLogin();

    await request(app)
      .post('/api/friends/request')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ recipientId: bob.userId });

    const res = await request(app)
      .post('/api/friends/request')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ recipientId: bob.userId });

    expect(res.statusCode).toBe(400);
  });

  it('returns 404 for nonexistent recipient', async () => {
    const alice = await registerAndLogin();

    const res = await request(app)
      .post('/api/friends/request')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ recipientId: '000000000000000000000001' });

    expect(res.statusCode).toBe(404);
  });
});

// ─── Accept / decline request ────────────────────────────────────────────────

describe('PUT /api/friends/request/:id', () => {
  it('accepts a friend request', async () => {
    const alice = await registerAndLogin();
    const bob = await registerAndLogin();

    const reqRes = await request(app)
      .post('/api/friends/request')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ recipientId: bob.userId });

    const friendshipId = reqRes.body.friendship._id;

    const res = await request(app)
      .put(`/api/friends/request/${friendshipId}`)
      .set('Authorization', `Bearer ${bob.token}`)
      .send({ action: 'accept' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.friendship.status).toBe('accepted');
  });

  it('declines a friend request', async () => {
    const alice = await registerAndLogin();
    const bob = await registerAndLogin();

    const reqRes = await request(app)
      .post('/api/friends/request')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ recipientId: bob.userId });

    const friendshipId = reqRes.body.friendship._id;

    const res = await request(app)
      .put(`/api/friends/request/${friendshipId}`)
      .set('Authorization', `Bearer ${bob.token}`)
      .send({ action: 'decline' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 403 when the sender tries to accept their own request', async () => {
    const alice = await registerAndLogin();
    const bob = await registerAndLogin();

    const reqRes = await request(app)
      .post('/api/friends/request')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ recipientId: bob.userId });

    const friendshipId = reqRes.body.friendship._id;

    // Alice (sender) tries to accept — only the recipient (Bob) can
    const res = await request(app)
      .put(`/api/friends/request/${friendshipId}`)
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ action: 'accept' });

    expect(res.statusCode).toBe(403);
  });
});

// ─── Cancel sent request ─────────────────────────────────────────────────────

describe('DELETE /api/friends/request/:id', () => {
  it('cancels a sent friend request', async () => {
    const alice = await registerAndLogin();
    const bob = await registerAndLogin();

    const reqRes = await request(app)
      .post('/api/friends/request')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ recipientId: bob.userId });

    const friendshipId = reqRes.body.friendship._id;

    const res = await request(app)
      .delete(`/api/friends/request/${friendshipId}`)
      .set('Authorization', `Bearer ${alice.token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 403 when the recipient tries to cancel (not the sender)', async () => {
    const alice = await registerAndLogin();
    const bob = await registerAndLogin();

    const reqRes = await request(app)
      .post('/api/friends/request')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ recipientId: bob.userId });

    const friendshipId = reqRes.body.friendship._id;

    const res = await request(app)
      .delete(`/api/friends/request/${friendshipId}`)
      .set('Authorization', `Bearer ${bob.token}`);

    expect(res.statusCode).toBe(403);
  });
});

// ─── List friends ────────────────────────────────────────────────────────────

describe('GET /api/friends', () => {
  it('returns accepted friends list', async () => {
    const alice = await registerAndLogin();
    const bob = await registerAndLogin();

    const reqRes = await request(app)
      .post('/api/friends/request')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ recipientId: bob.userId });

    await request(app)
      .put(`/api/friends/request/${reqRes.body.friendship._id}`)
      .set('Authorization', `Bearer ${bob.token}`)
      .send({ action: 'accept' });

    const res = await request(app)
      .get('/api/friends')
      .set('Authorization', `Bearer ${alice.token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.friends.length).toBeGreaterThanOrEqual(1);
  });

  it('returns empty list when user has no accepted friends', async () => {
    const { token } = await registerAndLogin();

    const res = await request(app)
      .get('/api/friends')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.friends).toHaveLength(0);
  });

  it('returns pending received requests with status=pending', async () => {
    const alice = await registerAndLogin();
    const bob = await registerAndLogin();

    await request(app)
      .post('/api/friends/request')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ recipientId: bob.userId });

    const res = await request(app)
      .get('/api/friends?status=pending')
      .set('Authorization', `Bearer ${bob.token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.friends.length).toBeGreaterThanOrEqual(1);
  });

  it('returns sent requests with status=sent', async () => {
    const alice = await registerAndLogin();
    const bob = await registerAndLogin();

    await request(app)
      .post('/api/friends/request')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ recipientId: bob.userId });

    const res = await request(app)
      .get('/api/friends?status=sent')
      .set('Authorization', `Bearer ${alice.token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.friends.length).toBeGreaterThanOrEqual(1);
  });

  it('does not show pending requests in the default accepted list', async () => {
    const alice = await registerAndLogin();
    const bob = await registerAndLogin();

    // Send but do NOT accept
    await request(app)
      .post('/api/friends/request')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ recipientId: bob.userId });

    const res = await request(app)
      .get('/api/friends')
      .set('Authorization', `Bearer ${alice.token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.friends).toHaveLength(0);
  });
});

// ─── Remove friend ───────────────────────────────────────────────────────────

describe('DELETE /api/friends/:id', () => {
  it('removes an accepted friendship', async () => {
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

    const res = await request(app)
      .delete(`/api/friends/${friendshipId}`)
      .set('Authorization', `Bearer ${alice.token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    // Confirm friendship is gone
    const listRes = await request(app)
      .get('/api/friends')
      .set('Authorization', `Bearer ${alice.token}`);

    expect(listRes.body.friends).toHaveLength(0);
  });

  it('returns 403 or 404 when a third party tries to remove the friendship', async () => {
    const alice = await registerAndLogin();
    const bob = await registerAndLogin();
    const charlie = await registerAndLogin();

    const reqRes = await request(app)
      .post('/api/friends/request')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ recipientId: bob.userId });

    const friendshipId = reqRes.body.friendship._id;

    await request(app)
      .put(`/api/friends/request/${friendshipId}`)
      .set('Authorization', `Bearer ${bob.token}`)
      .send({ action: 'accept' });

    const res = await request(app)
      .delete(`/api/friends/${friendshipId}`)
      .set('Authorization', `Bearer ${charlie.token}`);

    expect([403, 404]).toContain(res.statusCode);
  });
});
