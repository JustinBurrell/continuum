/**
 * auth.test.js
 *
 * Tests the core authentication endpoints:
 *   POST /api/auth/register
 *   POST /api/auth/login
 *   GET  /api/auth/me
 *
 * Each test gets a fresh in-memory database — no real MongoDB touched.
 */

const request = require('supertest');
const app = require('../../app');
const { connectTestDb, clearTestDb, closeTestDb } = require('./testDb');

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
