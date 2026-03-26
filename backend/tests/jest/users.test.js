/**
 * users.test.js
 *
 * Tests the Users endpoints:
 *   GET /api/users/search?q=   → { success, users }
 *   GET /api/users/:id         → { success, user }
 */

const request = require('supertest');
const app = require('../../app');
const { connectTestDb, clearTestDb, closeTestDb } = require('./testDb');
const { registerAndLogin } = require('./testHelpers');

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(closeTestDb);

// ─── Auth guards ─────────────────────────────────────────────────────────────

describe('Users auth guards', () => {
  it('GET /api/users/search returns 401 without token', async () => {
    const res = await request(app).get('/api/users/search?q=alice');
    expect(res.statusCode).toBe(401);
  });

  it('GET /api/users/:id returns 401 without token', async () => {
    const { userId } = await registerAndLogin();
    const res = await request(app).get(`/api/users/${userId}`);
    expect(res.statusCode).toBe(401);
  });
});

// ─── Search ──────────────────────────────────────────────────────────────────

describe('GET /api/users/search', () => {
  it('returns matching users by username', async () => {
    const alice = await registerAndLogin({ username: 'alicesearch', firstName: 'Alice', lastName: 'Smith' });
    const searcher = await registerAndLogin();

    const res = await request(app)
      .get('/api/users/search?q=alicesearch')
      .set('Authorization', `Bearer ${searcher.token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    const usernames = res.body.users.map((u) => u.username);
    expect(usernames).toContain('alicesearch');
  });

  it('excludes the searching user from results', async () => {
    const alice = await registerAndLogin({ username: 'aliceself' });

    const res = await request(app)
      .get('/api/users/search?q=aliceself')
      .set('Authorization', `Bearer ${alice.token}`);

    expect(res.statusCode).toBe(200);
    const usernames = res.body.users.map((u) => u.username);
    expect(usernames).not.toContain('aliceself');
  });

  it('returns empty array for no matches', async () => {
    const { token } = await registerAndLogin();

    const res = await request(app)
      .get('/api/users/search?q=zzznomatch999')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.users).toHaveLength(0);
  });

  it('returns 400 or empty when query param is missing', async () => {
    const { token } = await registerAndLogin();

    const res = await request(app)
      .get('/api/users/search')
      .set('Authorization', `Bearer ${token}`);

    expect([200, 400]).toContain(res.statusCode);
  });

  it('does not leak password field in results', async () => {
    await registerAndLogin({ username: 'nosecrets' });
    const searcher = await registerAndLogin();

    const res = await request(app)
      .get('/api/users/search?q=nosecrets')
      .set('Authorization', `Bearer ${searcher.token}`);

    expect(res.statusCode).toBe(200);
    res.body.users.forEach((u) => {
      expect(u.password).toBeUndefined();
    });
  });
});

// ─── Get profile by ID ───────────────────────────────────────────────────────

describe('GET /api/users/:id', () => {
  it('returns a user\'s public profile', async () => {
    const alice = await registerAndLogin({ firstName: 'Alice', lastName: 'Smith' });
    const bob = await registerAndLogin();

    const res = await request(app)
      .get(`/api/users/${alice.userId}`)
      .set('Authorization', `Bearer ${bob.token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user._id).toBe(alice.userId);
  });

  it('does not expose password in the response', async () => {
    const alice = await registerAndLogin();
    const bob = await registerAndLogin();

    const res = await request(app)
      .get(`/api/users/${alice.userId}`)
      .set('Authorization', `Bearer ${bob.token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.user.password).toBeUndefined();
  });

  it('returns 404 for a nonexistent user ID', async () => {
    const { token } = await registerAndLogin();
    const fakeId = '000000000000000000000001';

    const res = await request(app)
      .get(`/api/users/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 for an invalid (non-ObjectId) ID', async () => {
    const { token } = await registerAndLogin();

    const res = await request(app)
      .get('/api/users/not-a-valid-id')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(400);
  });
});
