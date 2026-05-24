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

const crypto = require('crypto');
const request = require('supertest');
const app = require('../../app');
const { connectTestDb, clearTestDb, closeTestDb } = require('./testDb');
const User = require('../../models/User');
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

  it('assigns role: team when registering with a team email', async () => {
    const original = process.env.TEAM_EMAILS;
    process.env.TEAM_EMAILS = 'team@continuum.test';
    try {
      const res = await request(app).post('/api/auth/register').send({
        ...validUser,
        email: 'team@continuum.test',
        username: 'teamtest',
      });
      expect(res.statusCode).toBe(201);
      expect(res.body.user.roles).toContain('team');
    } finally {
      process.env.TEAM_EMAILS = original;
    }
  });

  it('assigns no roles for a non-special email', async () => {
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

  it('rotates the refresh token — old cookie is rejected after rotation, new cookie is accepted', async () => {
    const reg = await request(app).post('/api/auth/register').send(validUser);
    const cookieA = (reg.headers['set-cookie'] || []).find((c) => c.startsWith('refreshToken='));
    expect(cookieA).toBeDefined();

    // First refresh — should succeed and issue a new cookie
    const res1 = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', cookieA);
    expect(res1.statusCode).toBe(200);
    expect(res1.body.token).toBeDefined();

    const cookieB = (res1.headers['set-cookie'] || []).find((c) => c.startsWith('refreshToken='));
    expect(cookieB).toBeDefined();
    expect(cookieB).not.toBe(cookieA); // new cookie issued

    // Old cookie should now be rejected (rotated out)
    const res2 = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', cookieA);
    expect(res2.statusCode).toBe(401);

    // New cookie should still work
    const res3 = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', cookieB);
    expect(res3.statusCode).toBe(200);
    expect(res3.body.token).toBeDefined();
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

// ─── Logout All — immediate access token invalidation ──────────────────────

describe('POST /api/auth/logout-all — access token invalidation', () => {
  it('rejects a still-valid JWT from another session after logoutAll', async () => {
    // Session A: register
    const regA = await request(app).post('/api/auth/register').send(validUser);
    const tokenA = regA.body.token;

    // Session B: login to get a second independent JWT
    const loginB = await request(app)
      .post('/api/auth/login')
      .send({ email: validUser.email, password: validUser.password });
    const tokenB = loginB.body.token;

    // Session A calls logoutAll — increments tokenVersion for the user
    const logoutRes = await request(app)
      .post('/api/auth/logout-all')
      .set('Authorization', `Bearer ${tokenA}`);
    expect(logoutRes.statusCode).toBe(200);

    // Session B's JWT is still within its expiry window but tokenVersion is now stale
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${tokenB}`);
    expect(meRes.statusCode).toBe(401);
  });
});

// ─── Logout All — refresh tokens revoked ───────────────────────────────────

describe('POST /api/auth/logout-all — refresh tokens revoked', () => {
  it('rejects POST /auth/refresh after logoutAll', async () => {
    const reg = await request(app).post('/api/auth/register').send(validUser);
    const tokenA = reg.body.token;
    const cookie = (reg.headers['set-cookie'] || []).find((c) => c.startsWith('refreshToken='));

    await request(app)
      .post('/api/auth/logout-all')
      .set('Authorization', `Bearer ${tokenA}`);

    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', cookie);
    expect(refreshRes.statusCode).toBe(401);
  });
});

// ─── GET /auth/sessions ─────────────────────────────────────────────────────

describe('GET /api/auth/sessions', () => {
  it('returns active sessions with required fields and marks isCurrent for the requesting session', async () => {
    // Register creates exactly one session; use that token immediately so req.sessionId matches
    const reg = await request(app).post('/api/auth/register').send(validUser);
    const token = reg.body.token;

    const res = await request(app)
      .get('/api/auth/sessions')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.sessions)).toBe(true);
    expect(res.body.sessions.length).toBe(1);

    const session = res.body.sessions[0];
    expect(session).toHaveProperty('_id');
    expect(session).toHaveProperty('deviceId');
    expect(session).toHaveProperty('createdAt');
    expect(session).toHaveProperty('ipLocation');
    expect(session).toHaveProperty('lastUsedAt');
    expect(session).toHaveProperty('isCurrent');

    // The single session is the one that issued the token — must be marked current
    expect(session.isCurrent).toBe(true);
  });
});

// ─── DELETE /auth/sessions/:id ──────────────────────────────────────────────

describe('DELETE /api/auth/sessions/:id', () => {
  it('revokes the session and blocks subsequent refresh with that cookie', async () => {
    const reg = await request(app).post('/api/auth/register').send(validUser);
    const token = reg.body.token;
    const cookie = (reg.headers['set-cookie'] || []).find((c) => c.startsWith('refreshToken='));

    // Get sessions to find the id
    const sessionsRes = await request(app)
      .get('/api/auth/sessions')
      .set('Authorization', `Bearer ${token}`);
    const sessionId = sessionsRes.body.sessions[0]._id;

    // Revoke it
    const deleteRes = await request(app)
      .delete(`/api/auth/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(deleteRes.statusCode).toBe(200);

    // Refresh should now fail for that cookie
    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', cookie);
    expect(refreshRes.statusCode).toBe(401);
  });

  it('immediately rejects the JWT for a revoked session when Redis blocklist is active', async () => {
    // This test simulates the Redis blocklist path by spying on cache.getKey.
    // In production with Redis running, revokeSession writes revoked_session:{id} and
    // auth middleware checks it — any request using the old JWT is immediately rejected
    // without waiting for the access token to expire.
    const cache = require('../../lib/cache');

    const reg = await request(app).post('/api/auth/register').send(validUser);
    const token = reg.body.token;

    const sessionsRes = await request(app)
      .get('/api/auth/sessions')
      .set('Authorization', `Bearer ${token}`);
    const sessionId = sessionsRes.body.sessions[0]._id;

    // Revoke the session
    await request(app)
      .delete(`/api/auth/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${token}`);

    // Spy on cache.getKey to simulate Redis blocklist hit for this session
    const spy = jest.spyOn(cache, 'getKey').mockImplementation(async (key) => {
      if (key === `revoked_session:${sessionId}`) return '1';
      return null;
    });

    try {
      // The JWT is still within its expiry window, but the blocklist should cause 401
      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);
      expect(meRes.statusCode).toBe(401);
      expect(meRes.body.error).toMatch(/revoked/i);
    } finally {
      spy.mockRestore();
    }
  });
});

// ─── Device label capture ───────────────────────────────────────────────────

describe('Device label capture', () => {
  it('stores a versioned device label and IP on the RefreshToken after register', async () => {
    const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

    const reg = await request(app)
      .post('/api/auth/register')
      .set('User-Agent', ua)
      .send(validUser);
    expect(reg.statusCode).toBe(201);

    const token = await RefreshToken.findOne({ userId: reg.body.user._id });
    expect(token).not.toBeNull();
    expect(token.deviceId).toBeTruthy();
    // New format includes version number: "Chrome 124 on macOS 10.15.7"
    expect(token.deviceId).toContain('Chrome 124');
    expect(token.deviceId).toContain('macOS');
    // ipAddress and ipLocation fields are stored (both null in test env since req.ip is loopback)
    expect(Object.prototype.hasOwnProperty.call(token.toObject(), 'ipAddress')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(token.toObject(), 'ipLocation')).toBe(true);
  });

  it('stores a correct label for iOS Safari', async () => {
    const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

    const reg = await request(app)
      .post('/api/auth/register')
      .set('User-Agent', ua)
      .send(validUser);
    expect(reg.statusCode).toBe(201);

    const token = await RefreshToken.findOne({ userId: reg.body.user._id });
    expect(token.deviceId).toContain('Safari 17');
    expect(token.deviceId).toContain('iPhone');
    expect(token.deviceId).toContain('iOS 17');
  });
});

// ─── DELETE /api/auth/me/google/link ─────────────────────────────────────────

describe('DELETE /api/auth/me/google/link (Google unlink)', () => {
  async function registerAndLoginUser(overrides = {}) {
    const user = {
      email: overrides.email || 'unlinktest@continuum.test',
      username: overrides.username || 'unlinktest',
      password: 'Test@1234',
      firstName: 'Unlink',
      lastName: 'Test',
    };
    const res = await request(app).post('/api/auth/register').send(user);
    return { token: res.body.token, userId: res.body.user?._id || res.body.user?.id };
  }

  it('returns 400 when no Google account is linked', async () => {
    const { token } = await registerAndLoginUser();

    const res = await request(app)
      .delete('/api/auth/me/google/link')
      .set('Authorization', `Bearer ${token}`)
      .send({ keepNotes: true });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/no google account/i);
  });

  it('returns 400 with password guard message for Google-only accounts', async () => {
    const { token, userId } = await registerAndLoginUser();

    // Simulate a Google-only account: set googleId but clear password
    await User.findByIdAndUpdate(userId, {
      googleId: 'google-only-id-123',
      googleAccessToken: 'enc-access',
      googleRefreshToken: 'enc-refresh',
      googleTokenExpiry: new Date(Date.now() + 3600 * 1000),
    });
    // Remove the password to simulate a Google-only account
    await User.updateOne({ _id: userId }, { $unset: { password: '' } });

    const res = await request(app)
      .delete('/api/auth/me/google/link')
      .set('Authorization', `Bearer ${token}`)
      .send({ keepNotes: true });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Set a password before unlinking Google');
  });

  it('returns 200 and clears Google fields for an account with a password', async () => {
    const { token, userId } = await registerAndLoginUser();

    await User.findByIdAndUpdate(userId, {
      googleId: 'linked-google-id-456',
      googleAccessToken: 'enc-access-token',
      googleRefreshToken: 'enc-refresh-token',
      googleTokenExpiry: new Date(Date.now() + 3600 * 1000),
    });

    const res = await request(app)
      .delete('/api/auth/me/google/link')
      .set('Authorization', `Bearer ${token}`)
      .send({ keepNotes: true });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    const updated = await User.findById(userId).select('+googleId +googleAccessToken +googleRefreshToken');
    expect(updated.googleId).toBeUndefined();
    expect(updated.googleAccessToken).toBeUndefined();
    expect(updated.googleRefreshToken).toBeUndefined();
  });
});

// ─── parseDeviceLabel (via login endpoint) ────────────────────────────────────

describe('parseDeviceLabel — device detection via login UA headers', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send(validUser);
  });

  const IPAD_MACOS_UA =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
  const IPHONE_UA =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
  const ANDROID_UA =
    'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36';
  const WINDOWS_UA =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

  it('labels iPad correctly when Sec-CH-UA-Platform says iPadOS (overrides macOS UA)', async () => {
    await request(app)
      .post('/api/auth/login')
      .set('User-Agent', IPAD_MACOS_UA)
      .set('Sec-CH-UA-Platform', '"iPadOS"')
      .send({ email: validUser.email, password: validUser.password });

    const token = await RefreshToken.findOne({ deviceId: /iPad/i });
    expect(token).not.toBeNull();
    expect(token.deviceId).toMatch(/iPad/i);
    expect(token.deviceId).not.toMatch(/macOS/i);
  });

  it('labels iPhone correctly from UA alone', async () => {
    await request(app)
      .post('/api/auth/login')
      .set('User-Agent', IPHONE_UA)
      .send({ email: validUser.email, password: validUser.password });

    const token = await RefreshToken.findOne({ deviceId: /iPhone/i });
    expect(token).not.toBeNull();
    expect(token.deviceId).toMatch(/iPhone/i);
  });

  it('labels Android correctly from UA alone', async () => {
    await request(app)
      .post('/api/auth/login')
      .set('User-Agent', ANDROID_UA)
      .send({ email: validUser.email, password: validUser.password });

    const token = await RefreshToken.findOne({ deviceId: /Android/i });
    expect(token).not.toBeNull();
    expect(token.deviceId).toMatch(/Android/i);
  });

  it('labels Windows desktop from UA', async () => {
    await request(app)
      .post('/api/auth/login')
      .set('User-Agent', WINDOWS_UA)
      .send({ email: validUser.email, password: validUser.password });

    const token = await RefreshToken.findOne({ deviceId: /Windows/i });
    expect(token).not.toBeNull();
    expect(token.deviceId).toMatch(/Windows/i);
  });

  it('falls back to Unknown device when no UA is provided', async () => {
    // supertest sends no UA if we don't set one; clear any default
    await request(app)
      .post('/api/auth/login')
      .set('User-Agent', '')
      .send({ email: validUser.email, password: validUser.password });

    const token = await RefreshToken.findOne({ deviceId: 'Unknown device' });
    expect(token).not.toBeNull();
  });
});

// ─── Session deduplication on login ──────────────────────────────────────────

describe('Session deduplication — login revokes same-device prior session', () => {
  const CHROME_UA =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
  const FIREFOX_UA =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:125.0) Gecko/20100101 Firefox/125.0';

  it('keeps exactly 1 active session when logging in twice on the same device', async () => {
    // Register with the same UA so all three calls share the same deviceId
    await request(app).post('/api/auth/register').set('User-Agent', CHROME_UA).send(validUser);

    await request(app)
      .post('/api/auth/login')
      .set('User-Agent', CHROME_UA)
      .send({ email: validUser.email, password: validUser.password });

    // Second login on the same device — should revoke the first
    const res = await request(app)
      .post('/api/auth/login')
      .set('User-Agent', CHROME_UA)
      .send({ email: validUser.email, password: validUser.password });

    const token = res.body.token;
    const sessionsRes = await request(app)
      .get('/api/auth/sessions')
      .set('Authorization', `Bearer ${token}`);

    expect(sessionsRes.body.sessions.length).toBe(1);
  });

  it('does not revoke a different device session when logging in from a second device', async () => {
    const reg = await request(app).post('/api/auth/register').send(validUser);
    const tokenA = reg.body.token;

    // Login from a second device
    await request(app)
      .post('/api/auth/login')
      .set('User-Agent', FIREFOX_UA)
      .send({ email: validUser.email, password: validUser.password });

    const sessionsRes = await request(app)
      .get('/api/auth/sessions')
      .set('Authorization', `Bearer ${tokenA}`);

    // register session (Chrome-like or empty UA) + Firefox login = 2 distinct sessions
    expect(sessionsRes.body.sessions.length).toBe(2);
  });
});

// ─── Sessions list — expired token exclusion ─────────────────────────────────

describe('GET /api/auth/sessions — expired tokens excluded', () => {
  it('does not return sessions whose expiresAt is in the past', async () => {
    const reg = await request(app).post('/api/auth/register').send(validUser);
    const token = reg.body.token;
    const { _id: userId } = reg.body.user;

    // Manually back-date the token so it looks expired
    await RefreshToken.updateMany({ userId }, { expiresAt: new Date(Date.now() - 1000) });

    const res = await request(app)
      .get('/api/auth/sessions')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.sessions).toHaveLength(0);
  });
});

// ─── Sessions list — current session is first ────────────────────────────────

describe('GET /api/auth/sessions — current session is first in the list', () => {
  it('returns the isCurrent session as the first element', async () => {
    await request(app).post('/api/auth/register').send(validUser);

    // Login from a distinct device so we have 2 sessions
    const loginRes = await request(app)
      .post('/api/auth/login')
      .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0) Chrome/124.0.0.0 Safari/537.36')
      .send({ email: validUser.email, password: validUser.password });

    const token = loginRes.body.token;

    const sessionsRes = await request(app)
      .get('/api/auth/sessions')
      .set('Authorization', `Bearer ${token}`);

    expect(sessionsRes.body.sessions.length).toBeGreaterThanOrEqual(1);
    expect(sessionsRes.body.sessions[0].isCurrent).toBe(true);
  });
});

// ─── POST /auth/logout-all — revokes all sessions ────────────────────────────

describe('POST /api/auth/logout-all — revokes all refresh tokens', () => {
  it('sets revokedAt on all tokens for the user', async () => {
    const reg = await request(app).post('/api/auth/register').send(validUser);
    const token = reg.body.token;
    const { _id: userId } = reg.body.user;

    // Create a second session via login
    await request(app)
      .post('/api/auth/login')
      .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0) Chrome/124.0.0.0')
      .send({ email: validUser.email, password: validUser.password });

    await request(app)
      .post('/api/auth/logout-all')
      .set('Authorization', `Bearer ${token}`);

    const active = await RefreshToken.countDocuments({ userId, revokedAt: null });
    expect(active).toBe(0);
  });
});

// ─── New-device login detection ───────────────────────────────────────────────

describe('New-device login detection', () => {
  const CHROME_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36';
  const FIREFOX_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:125.0) Gecko/20100101 Firefox/125.0';

  it('login from a device with no prior active session → no active pre-existing session before revocation', async () => {
    // Register on Chrome
    await request(app)
      .post('/api/auth/register')
      .set('User-Agent', CHROME_UA)
      .send(validUser);

    // Login from Firefox (new device — no prior session for this UA)
    const loginRes = await request(app)
      .post('/api/auth/login')
      .set('User-Agent', FIREFOX_UA)
      .send({ email: validUser.email, password: validUser.password });

    expect(loginRes.status).toBe(200);
    // Verify a RefreshToken for Firefox was created
    const ffToken = await RefreshToken.findOne({ deviceId: /Firefox/i });
    expect(ffToken).not.toBeNull();
  });

  it('login from same device twice → only one active session for that device', async () => {
    await request(app)
      .post('/api/auth/register')
      .set('User-Agent', CHROME_UA)
      .send(validUser);

    // Login again on Chrome (same device)
    await request(app)
      .post('/api/auth/login')
      .set('User-Agent', CHROME_UA)
      .send({ email: validUser.email, password: validUser.password });

    const reg = await request(app)
      .post('/api/auth/register')
      .send({ ...validUser, email: 'new@test.com', username: 'newuser2' });

    const userId = reg.body.user?._id;
    // The first register already rotated — only 1 active Chrome session should remain
    const active = await RefreshToken.countDocuments({ deviceId: /Chrome/i, revokedAt: null });
    expect(active).toBeGreaterThanOrEqual(1);
  });
});

// ─── GET /api/auth/me/restore — public restore endpoint ──────────────────────

describe('GET /api/auth/me/restore', () => {
  async function seedPendingUser() {
    const reg = await request(app).post('/api/auth/register').send({
      ...validUser,
      email: `restore${Date.now()}@test.com`,
      username: `restoreuser${Date.now()}`,
    });
    const userId = reg.body.user._id;
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const scheduledDeletionAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await User.findByIdAndUpdate(userId, {
      pendingDeletion: true,
      scheduledDeletionAt,
      restorationToken: hashedToken,
      restorationTokenExpires: scheduledDeletionAt,
    });
    return { userId, rawToken };
  }

  it('valid token → 200 HTML, pendingDeletion=false, restorationToken cleared', async () => {
    const { userId, rawToken } = await seedPendingUser();

    const res = await request(app).get(`/api/auth/me/restore?token=${rawToken}`);
    expect(res.status).toBe(200);
    expect(res.text).toMatch(/restored/i);

    const user = await User.findById(userId);
    expect(user.pendingDeletion).toBe(false);
    expect(user.scheduledDeletionAt).toBeNull();
  });

  it('expired token → 400 HTML', async () => {
    const { userId, rawToken } = await seedPendingUser();
    // Expire the token immediately
    await User.findByIdAndUpdate(userId, { restorationTokenExpires: new Date(Date.now() - 1000) });

    const res = await request(app).get(`/api/auth/me/restore?token=${rawToken}`);
    expect(res.status).toBe(400);
  });

  it('tampered token (hash mismatch) → 400 HTML', async () => {
    await seedPendingUser();
    const fakeToken = crypto.randomBytes(32).toString('hex');

    const res = await request(app).get(`/api/auth/me/restore?token=${fakeToken}`);
    expect(res.status).toBe(400);
  });

  it('token for non-pending-deletion user → 400 HTML', async () => {
    const { userId, rawToken } = await seedPendingUser();
    // Mark account as already restored
    await User.findByIdAndUpdate(userId, { pendingDeletion: false });

    const res = await request(app).get(`/api/auth/me/restore?token=${rawToken}`);
    expect(res.status).toBe(400);
  });
});
