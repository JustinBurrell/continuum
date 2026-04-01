/**
 * auth.test.js
 *
 * Tests the core authentication endpoints:
 *   POST /api/auth/register
 *   POST /api/auth/login
 *   GET  /api/auth/me
 *   POST /api/auth/forgot-password
 *   POST /api/auth/reset-password
 *
 * Each test gets a fresh in-memory database — no real MongoDB touched.
 * Resend and Cloudinary are mocked — no emails or uploads sent.
 */

const request = require('supertest');
const app = require('../../app');
const { connectTestDb, clearTestDb, closeTestDb } = require('./testDb');
const User = require('../../models/User');

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

// ─── Register ──────────────────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  it('creates a user and returns a token', async () => {
    const res = await request(app).post('/api/auth/register').send(validUser);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(validUser.email);
    expect(res.body.user.username).toBe(validUser.username);
    // password should never be returned
    expect(res.body.user.password).toBeUndefined();
  });

  it('returns 409 when email is already taken', async () => {
    await request(app).post('/api/auth/register').send(validUser);
    const res = await request(app).post('/api/auth/register').send(validUser);

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('returns 409 when username is already taken', async () => {
    await request(app).post('/api/auth/register').send(validUser);
    const res = await request(app).post('/api/auth/register').send({
      ...validUser,
      email: 'different@continuum.test',
    });

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 for missing required fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'nopassword@continuum.test' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('assigns role: founder when registering with a founder email', async () => {
    const original = process.env.FOUNDER_EMAILS;
    process.env.FOUNDER_EMAILS = 'founder@continuum.test';
    try {
      const res = await request(app).post('/api/auth/register').send({
        ...validUser,
        email: 'founder@continuum.test',
        username: 'foundertest',
      });
      expect(res.statusCode).toBe(201);
      expect(res.body.user.roles).toContain('founder');
    } finally {
      process.env.FOUNDER_EMAILS = original;
    }
  });

  it('assigns role: null for a non-special email', async () => {
    const res = await request(app).post('/api/auth/register').send(validUser);
    expect(res.statusCode).toBe(201);
    expect(res.body.user.roles).toEqual([]);
  });
});

// ─── Login ─────────────────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send(validUser);
  });

  it('returns a token for valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: validUser.email, password: validUser.password });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
  });

  it('returns 401 for wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: validUser.email, password: 'WrongPassword!99' });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 for unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@continuum.test', password: 'Test@1234' });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

// ─── Refresh Token (cookie) ─────────────────────────────────────────────────

describe('POST /api/auth/refresh', () => {
  it('sets a refreshToken cookie on login and exchanges it for a new access token', async () => {
    const reg = await request(app).post('/api/auth/register').send(validUser);
    expect(reg.statusCode).toBe(201);

    // Cookie should be set — body should NOT contain refreshToken
    const setCookieHeader = reg.headers['set-cookie'] || [];
    expect(setCookieHeader.some((c) => c.startsWith('refreshToken='))).toBe(true);
    expect(reg.body.refreshToken).toBeUndefined();

    // Extract the cookie value for the refresh call
    const cookieString = setCookieHeader.find((c) => c.startsWith('refreshToken='));

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', cookieString);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
  });

  it('returns 400 when no cookie is sent', async () => {
    const res = await request(app).post('/api/auth/refresh');

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ─── Get Current User ───────────────────────────────────────────────────────

describe('GET /api/auth/me', () => {
  it('returns the authenticated user', async () => {
    const reg = await request(app).post('/api/auth/register').send(validUser);
    const token = reg.body.token;

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe(validUser.email);
  });

  it('response includes role field', async () => {
    const reg = await request(app).post('/api/auth/register').send(validUser);
    const token = reg.body.token;

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.user).toHaveProperty('roles');
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 with a tampered token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer thisisnotatoken');

    expect(res.statusCode).toBe(401);
  });
});

// ─── Forgot Password ────────────────────────────────────────────────────────

describe('POST /api/auth/forgot-password', () => {
  it('returns 200 for an unknown email — never reveals if email exists', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'nobody@continuum.test' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 400 for an unverified account', async () => {
    // registerAndLogin creates an unverified user by default
    await request(app).post('/api/auth/register').send(validUser);

    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: validUser.email });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 200 for a verified account and sets a reset token', async () => {
    const reg = await request(app).post('/api/auth/register').send(validUser);
    await User.findByIdAndUpdate(reg.body.user._id, { emailVerified: true });

    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: validUser.email });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    // Confirm the reset token was stored on the user
    const user = await User.findOne({ email: validUser.email }).select('+passwordResetToken +passwordResetExpires');
    expect(user.passwordResetToken).toBeDefined();
    expect(user.passwordResetExpires).toBeDefined();
  });
});

// ─── Reset Password ─────────────────────────────────────────────────────────

describe('POST /api/auth/reset-password', () => {
  // Helper: register, verify, and generate a reset token — returns { rawToken, email }
  async function setupResetToken() {
    const reg = await request(app).post('/api/auth/register').send(validUser);
    const user = await User.findById(reg.body.user._id).select('+password');
    user.emailVerified = true;
    const rawToken = user.createPasswordResetToken();
    await user.save();
    return { rawToken, email: validUser.email };
  }

  it('resets the password with a valid token', async () => {
    const { rawToken } = await setupResetToken();

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: rawToken, newPassword: 'ResetPass@99' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('new password works for login after reset', async () => {
    const { rawToken } = await setupResetToken();
    const newPassword = 'ResetPass@99';

    await request(app)
      .post('/api/auth/reset-password')
      .send({ token: rawToken, newPassword });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: validUser.email, password: newPassword });

    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.body.token).toBeDefined();
  });

  it('token cannot be reused after a successful reset', async () => {
    const { rawToken } = await setupResetToken();

    await request(app)
      .post('/api/auth/reset-password')
      .send({ token: rawToken, newPassword: 'ResetPass@99' });

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: rawToken, newPassword: 'AnotherPass@99' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 for an invalid token', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'completelyfaketoken', newPassword: 'ResetPass@99' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when new password does not meet complexity requirements', async () => {
    const { rawToken } = await setupResetToken();

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: rawToken, newPassword: 'weakpassword' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when token is an empty string', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: '', newPassword: 'ResetPass@99' });

    // Empty string hashes to a value that won't match any user → 400
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
