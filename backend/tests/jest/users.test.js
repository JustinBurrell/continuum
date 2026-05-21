/**
 * users.test.js
 *
 * Tests the Users endpoints:
 *   GET /api/users/search?q=   → { success, users }
 *   GET /api/users/:id         → { success, user }
 */

const request = require('supertest');
const app = require('../../app');
const User = require('../../models/User');
const { connectTestDb, clearTestDb, closeTestDb } = require('./testDb');
const { registerAndLogin, makeFriends } = require('./testHelpers');

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

    // some implementations return 400, others 404 — either is acceptable
    expect([400, 404]).toContain(res.statusCode);
  });

  it('includes role in public profile response', async () => {
    const alice = await registerAndLogin({ username: 'aliceprofile' });
    const bob = await registerAndLogin();

    const res = await request(app)
      .get(`/api/users/${alice.userId}`)
      .set('Authorization', `Bearer ${bob.token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.user).toHaveProperty('roles');
  });

  it('includes linkedinUrl and instagramHandle in public profile', async () => {
    const User = require('../../models/User');
    const alice = await registerAndLogin({ username: 'alicesocial' });
    const bob = await registerAndLogin();

    await User.findByIdAndUpdate(alice.userId, {
      linkedinUrl: 'https://linkedin.com/in/alice',
      instagramHandle: 'alice.gram',
    });

    const res = await request(app)
      .get(`/api/users/${alice.userId}`)
      .set('Authorization', `Bearer ${bob.token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.user).toHaveProperty('linkedinUrl', 'https://linkedin.com/in/alice');
    expect(res.body.user).toHaveProperty('instagramHandle', 'alice.gram');
  });
});

// ─── exactUsername lookup ─────────────────────────────────────────────────────

describe('GET /api/users/search?exactUsername= (@mention click navigation)', () => {
  it('returns the user with that exact username', async () => {
    const alice = await registerAndLogin({ username: 'exactalice' });
    const bob = await registerAndLogin();

    const res = await request(app)
      .get('/api/users/search?exactUsername=exactalice')
      .set('Authorization', `Bearer ${bob.token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.users).toHaveLength(1);
    expect(res.body.users[0].username).toBe('exactalice');
  });

  it('returns empty array when username does not exist', async () => {
    const { token } = await registerAndLogin();

    const res = await request(app)
      .get('/api/users/search?exactUsername=doesnotexist999')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.users).toHaveLength(0);
  });

  it('finds seed users (isSeedUser=true) by exact username', async () => {
    const { token } = await registerAndLogin();
    // Manually create a seed user (simulates demo friends like marcusjohnson_demo)
    await User.create({
      username: 'seeduserfind',
      email: 'seeduserfind@example.com',
      password: 'Test@1234',
      firstName: 'Seed',
      lastName: 'User',
      isSeedUser: true,
      emailVerified: true,
    });

    const res = await request(app)
      .get('/api/users/search?exactUsername=seeduserfind')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.users).toHaveLength(1);
    expect(res.body.users[0].username).toBe('seeduserfind');
  });
});

// ─── friendsOnly search includes seed friends ─────────────────────────────────

describe('GET /api/users/search?friendsOnly=true (mention autocomplete)', () => {
  it('returns seed-user friends when friendsOnly=true', async () => {
    const { alice, bob } = await makeFriends();
    // Mark bob as a seed user (simulates demo friend accounts)
    await User.updateOne({ _id: bob.userId }, { isSeedUser: true });

    const res = await request(app)
      .get(`/api/users/search?q=${bob.username.slice(0, 4)}&friendsOnly=true`)
      .set('Authorization', `Bearer ${alice.token}`);

    expect(res.statusCode).toBe(200);
    const usernames = res.body.users.map(u => u.username);
    expect(usernames).toContain(bob.username);
  });

  it('excludes non-friends even if they match the query', async () => {
    const alice = await registerAndLogin({ username: 'aliceonly' });
    const stranger = await registerAndLogin({ username: 'alicestranger' });

    const res = await request(app)
      .get('/api/users/search?q=alicestranger&friendsOnly=true')
      .set('Authorization', `Bearer ${alice.token}`);

    expect(res.statusCode).toBe(200);
    const usernames = res.body.users.map(u => u.username);
    expect(usernames).not.toContain('alicestranger');
  });

  it('general search (no friendsOnly) excludes seed users', async () => {
    const { token } = await registerAndLogin();
    await User.create({
      username: 'seedhidden',
      email: 'seedhidden@example.com',
      password: 'Test@1234',
      firstName: 'Seed',
      lastName: 'Hidden',
      isSeedUser: true,
      emailVerified: true,
    });

    const res = await request(app)
      .get('/api/users/search?q=seedhidden')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    const usernames = res.body.users.map(u => u.username);
    expect(usernames).not.toContain('seedhidden');
  });
});
