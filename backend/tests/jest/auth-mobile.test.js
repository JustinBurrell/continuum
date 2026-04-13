/**
 * auth-mobile.test.js
 *
 * Tests the mobile auth endpoints added for the Android app:
 *   POST /api/auth/mobile/login
 *   POST /api/auth/mobile/refresh
 *   POST /api/auth/google/mobile
 *
 * These endpoints mirror the web auth routes but return the refresh token
 * in the JSON body instead of setting an httpOnly cookie, because Android's
 * OkHttp cannot read or send httpOnly cookies.
 *
 * Each test gets a fresh in-memory database — no real MongoDB touched.
 * Resend and Cloudinary are mocked — no emails or uploads sent.
 */

const request = require('supertest');
const app = require('../../app');
const { connectTestDb, clearTestDb, closeTestDb } = require('./testDb');
const RefreshToken = require('../../models/RefreshToken');

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(closeTestDb);

const validUser = {
  email: 'alice@continuum.test',
  username: 'alice',
  password: 'Test@1234',
  firstName: 'Alice',
  lastName: 'Smith',
};

// Helper: register a user and return the account (via web register endpoint)
async function registerUser(overrides = {}) {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ ...validUser, ...overrides });
  return res;
}

// ─── Mobile Login ───────────────────────────────────────────────────────────

describe('POST /api/auth/mobile/login', () => {
  beforeEach(async () => {
    await registerUser();
  });

  it('returns 200 with JWT and refreshToken in body for valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/mobile/login')
      .set('X-Client-Type', 'android')
      .send({ email: validUser.email, password: validUser.password });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(typeof res.body.token).toBe('string');
    expect(res.body.refreshToken).toBeDefined();
    expect(typeof res.body.refreshToken).toBe('string');
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(validUser.email);
    expect(res.body.user.password).toBeUndefined();
  });

  it('does NOT set an httpOnly refreshToken cookie — token is in body only', async () => {
    const res = await request(app)
      .post('/api/auth/mobile/login')
      .set('X-Client-Type', 'android')
      .send({ email: validUser.email, password: validUser.password });

    expect(res.statusCode).toBe(200);
    const setCookieHeader = (res.headers['set-cookie'] || []).join('');
    expect(setCookieHeader).not.toContain('refreshToken=');
  });

  it('returns 401 for wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/mobile/login')
      .set('X-Client-Type', 'android')
      .send({ email: validUser.email, password: 'WrongPassword!99' });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
  });

  it('returns 401 for unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/mobile/login')
      .set('X-Client-Type', 'android')
      .send({ email: 'nobody@continuum.test', password: validUser.password });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('stores the RefreshToken record in the database', async () => {
    const res = await request(app)
      .post('/api/auth/mobile/login')
      .set('X-Client-Type', 'android')
      .send({ email: validUser.email, password: validUser.password });

    expect(res.statusCode).toBe(200);
    const tokenDoc = await RefreshToken.findOne({ deviceId: 'Android App' });
    expect(tokenDoc).not.toBeNull();
  });
});

// ─── Mobile Refresh ─────────────────────────────────────────────────────────

describe('POST /api/auth/mobile/refresh', () => {
  // Helper: mobile login and return { token, refreshToken }
  async function mobileLogin() {
    await registerUser();
    const res = await request(app)
      .post('/api/auth/mobile/login')
      .set('X-Client-Type', 'android')
      .send({ email: validUser.email, password: validUser.password });
    return { token: res.body.token, refreshToken: res.body.refreshToken };
  }

  it('returns 200 with new JWT and refreshToken in body for a valid refresh token', async () => {
    const { refreshToken } = await mobileLogin();

    const res = await request(app)
      .post('/api/auth/mobile/refresh')
      .set('X-Client-Type', 'android')
      .send({ refreshToken });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(typeof res.body.token).toBe('string');
    expect(res.body.refreshToken).toBeDefined();
    expect(typeof res.body.refreshToken).toBe('string');
  });

  it('issues a different refreshToken each time (rotation occurred)', async () => {
    const { refreshToken: original } = await mobileLogin();

    const res = await request(app)
      .post('/api/auth/mobile/refresh')
      .set('X-Client-Type', 'android')
      .send({ refreshToken: original });

    expect(res.statusCode).toBe(200);
    expect(res.body.refreshToken).not.toBe(original);
  });

  it('rejects the old refresh token after rotation (replay prevention)', async () => {
    const { refreshToken: original } = await mobileLogin();

    // First refresh — consumes the original token
    const res1 = await request(app)
      .post('/api/auth/mobile/refresh')
      .set('X-Client-Type', 'android')
      .send({ refreshToken: original });
    expect(res1.statusCode).toBe(200);

    // Replay the original token — must be rejected
    const res2 = await request(app)
      .post('/api/auth/mobile/refresh')
      .set('X-Client-Type', 'android')
      .send({ refreshToken: original });
    expect(res2.statusCode).toBe(401);
    expect(res2.body.success).toBe(false);
  });

  it('returns 400 when refreshToken is missing from the request body', async () => {
    const res = await request(app)
      .post('/api/auth/mobile/refresh')
      .set('X-Client-Type', 'android')
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 for a completely invalid refresh token string', async () => {
    const res = await request(app)
      .post('/api/auth/mobile/refresh')
      .set('X-Client-Type', 'android')
      .send({ refreshToken: 'this-is-not-a-real-token-abc123' });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('does NOT set an httpOnly cookie — new refreshToken is in body only', async () => {
    const { refreshToken } = await mobileLogin();

    const res = await request(app)
      .post('/api/auth/mobile/refresh')
      .set('X-Client-Type', 'android')
      .send({ refreshToken });

    expect(res.statusCode).toBe(200);
    const setCookieHeader = (res.headers['set-cookie'] || []).join('');
    expect(setCookieHeader).not.toContain('refreshToken=');
  });
});

// ─── Google Mobile Login ────────────────────────────────────────────────────

describe('POST /api/auth/google/mobile', () => {
  it('returns 400 when idToken is missing from the request body', async () => {
    const res = await request(app)
      .post('/api/auth/google/mobile')
      .set('X-Client-Type', 'android')
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
  });

  it('returns 401 for an invalid (non-Google) ID token', async () => {
    const res = await request(app)
      .post('/api/auth/google/mobile')
      .set('X-Client-Type', 'android')
      .send({ idToken: 'this-is-not-a-valid-google-id-token' });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
  });

  it('returns 401 for a structurally-valid JWT that is not a Google ID token', async () => {
    // A JWT signed with a random secret — not a Google ID token
    const jwt = require('jsonwebtoken');
    const fakeToken = jwt.sign(
      { sub: '123456', email: 'fake@example.com' },
      'not-googles-private-key'
    );

    const res = await request(app)
      .post('/api/auth/google/mobile')
      .set('X-Client-Type', 'android')
      .send({ idToken: fakeToken });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  // Note: testing a successful Google Sign-In flow requires a real Google ID token
  // (obtained from an Android device or Google OAuth Playground), which has a 1-hour TTL
  // and cannot be generated in unit tests without mocking google-auth-library.
  // Integration testing of this endpoint is done via Postman (see continuum-session16.postman_collection.json).
});
