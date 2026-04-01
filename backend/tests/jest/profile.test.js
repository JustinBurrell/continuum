/**
 * profile.test.js
 *
 * Tests every profile and account management route:
 *   PATCH  /api/auth/me/profile      → update display name, bio, avatar URL
 *   PATCH  /api/auth/me/password     → change password (requires current password)
 *   PATCH  /api/auth/me/username     → change username
 *   DELETE /api/auth/me              → soft-delete account
 *   POST   /api/auth/me/restore      → restore a soft-deleted account
 *   POST   /api/auth/logout          → revoke current refresh token
 *   POST   /api/auth/logout-all      → revoke all refresh tokens
 *   POST   /api/auth/send-verification → send verification email
 *   GET    /api/auth/verify-email    → verify email via token
 *   POST   /api/auth/me/google/link  → link Google account
 *   DELETE /api/auth/me/google/link  → unlink Google account
 *   Demo guard                       → isDemo users blocked on all writes
 */

const request = require('supertest');
const app = require('../../app');
const { connectTestDb, clearTestDb, closeTestDb } = require('./testDb');
const { registerAndLogin } = require('./testHelpers');
const User = require('../../models/User');

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(closeTestDb);

// ─── Update profile ──────────────────────────────────────────────────────────

describe('PATCH /api/auth/me/profile', () => {
  it('updates bio and returns the updated user', async () => {
    const { token } = await registerAndLogin();

    const res = await request(app)
      .patch('/api/auth/me/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ bio: 'Hello, I am a test user' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.bio).toBe('Hello, I am a test user');
  });

  it('updates firstName and lastName', async () => {
    const { token } = await registerAndLogin();

    const res = await request(app)
      .patch('/api/auth/me/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ firstName: 'Updated', lastName: 'Name' });

    expect(res.statusCode).toBe(200);
    expect(res.body.user.firstName).toBe('Updated');
    expect(res.body.user.lastName).toBe('Name');
  });

  it('does not expose password in the response', async () => {
    const { token } = await registerAndLogin();

    const res = await request(app)
      .patch('/api/auth/me/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ bio: 'no password please' });

    expect(res.statusCode).toBe(200);
    expect(res.body.user.password).toBeUndefined();
  });

  it('returns 401 without a token', async () => {
    const res = await request(app)
      .patch('/api/auth/me/profile')
      .send({ bio: 'should fail' });

    expect(res.statusCode).toBe(401);
  });

  it('ignores role in profile update body', async () => {
    const { token } = await registerAndLogin();

    const res = await request(app)
      .patch('/api/auth/me/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ bio: 'test', role: 'founder' }); // bio is a valid field; role should be silently ignored

    expect(res.statusCode).toBe(200);
    expect(res.body.user.roles).toEqual([]);
  });
});

// ─── Change password ─────────────────────────────────────────────────────────

describe('PATCH /api/auth/me/password', () => {
  it('changes the password with correct current password', async () => {
    const { token, password } = await registerAndLogin();

    const res = await request(app)
      .patch('/api/auth/me/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: password, newPassword: 'NewPass@9999' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 401 when current password is wrong', async () => {
    const { token } = await registerAndLogin();

    const res = await request(app)
      .patch('/api/auth/me/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'WrongPass!1', newPassword: 'NewPass@9999' });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when new password does not meet complexity requirements', async () => {
    const { token, password } = await registerAndLogin();

    const res = await request(app)
      .patch('/api/auth/me/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: password, newPassword: 'weakpassword' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when currentPassword or newPassword is missing', async () => {
    const { token } = await registerAndLogin();

    const res = await request(app)
      .patch('/api/auth/me/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'Test@1234' });

    expect(res.statusCode).toBe(400);
  });

  it('returns 401 without a token', async () => {
    const res = await request(app)
      .patch('/api/auth/me/password')
      .send({ currentPassword: 'Test@1234', newPassword: 'NewPass@9999' });

    expect(res.statusCode).toBe(401);
  });

  it('new password actually works for login after change', async () => {
    const { email, password, token } = await registerAndLogin();
    const newPassword = 'ChangedPass@99';

    await request(app)
      .patch('/api/auth/me/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: password, newPassword });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email, password: newPassword });

    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.body.token).toBeDefined();
  });

  it('old password no longer works after change', async () => {
    const { email, password, token } = await registerAndLogin();

    await request(app)
      .patch('/api/auth/me/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: password, newPassword: 'ChangedPass@99' });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email, password });

    expect(loginRes.statusCode).toBe(401);
  });
});

// ─── Change username ─────────────────────────────────────────────────────────

describe('PATCH /api/auth/me/username', () => {
  it('changes the username successfully', async () => {
    const { token } = await registerAndLogin();

    const res = await request(app)
      .patch('/api/auth/me/username')
      .set('Authorization', `Bearer ${token}`)
      .send({ username: 'brandnewusername' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.username).toBe('brandnewusername');
  });

  it('returns 409 when the username is already taken', async () => {
    const alice = await registerAndLogin({ username: 'alicetaken' });
    const bob = await registerAndLogin();

    const res = await request(app)
      .patch('/api/auth/me/username')
      .set('Authorization', `Bearer ${bob.token}`)
      .send({ username: 'alicetaken' });

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when username is missing', async () => {
    const { token } = await registerAndLogin();

    const res = await request(app)
      .patch('/api/auth/me/username')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.statusCode).toBe(400);
  });

  it('returns 401 without a token', async () => {
    const res = await request(app)
      .patch('/api/auth/me/username')
      .send({ username: 'noauth' });

    expect(res.statusCode).toBe(401);
  });
});

// ─── Delete account (soft delete) ────────────────────────────────────────────

describe('DELETE /api/auth/me', () => {
  it('soft-deletes the account and returns success', async () => {
    const { token } = await registerAndLogin();

    const res = await request(app)
      .delete('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).delete('/api/auth/me');
    expect(res.statusCode).toBe(401);
  });

  it('soft-deleted account cannot log in', async () => {
    const { email, password, token } = await registerAndLogin();

    await request(app)
      .delete('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email, password });

    // Soft-deleted accounts should not be able to log in
    expect([401, 403]).toContain(loginRes.statusCode);
  });
});

// ─── Restore account ─────────────────────────────────────────────────────────

describe('POST /api/auth/me/restore', () => {
  it('restores a soft-deleted account', async () => {
    const { token } = await registerAndLogin();

    // Delete first
    await request(app)
      .delete('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    // Restore
    const res = await request(app)
      .post('/api/auth/me/restore')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 400 when the account is not pending deletion', async () => {
    const { token } = await registerAndLogin();

    const res = await request(app)
      .post('/api/auth/me/restore')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ─── Logout ──────────────────────────────────────────────────────────────────

describe('POST /api/auth/logout', () => {
  it('logs out and returns success', async () => {
    const reg = await request(app).post('/api/auth/register').send({
      email: 'logout@continuum.test',
      username: 'logoutuser',
      password: 'Test@1234',
      firstName: 'Logout',
      lastName: 'User',
    });
    const token = reg.body.token;
    const cookie = reg.headers['set-cookie']?.find((c) => c.startsWith('refreshToken='));

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`)
      .set('Cookie', cookie || '');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.statusCode).toBe(401);
  });

  it('refresh token no longer works after logout', async () => {
    const reg = await request(app).post('/api/auth/register').send({
      email: 'logoutrefresh@continuum.test',
      username: 'logoutrefresh',
      password: 'Test@1234',
      firstName: 'Test',
      lastName: 'User',
    });
    const token = reg.body.token;
    const cookie = reg.headers['set-cookie']?.find((c) => c.startsWith('refreshToken='));

    await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`)
      .set('Cookie', cookie || '');

    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', cookie || '');

    expect(refreshRes.statusCode).toBe(401);
  });
});

// ─── Logout all ──────────────────────────────────────────────────────────────

describe('POST /api/auth/logout-all', () => {
  it('logs out of all devices and returns success', async () => {
    const { token } = await registerAndLogin();

    const res = await request(app)
      .post('/api/auth/logout-all')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('revokes all refresh tokens — refresh fails after logout-all', async () => {
    const reg = await request(app).post('/api/auth/register').send({
      email: 'logoutall@continuum.test',
      username: 'logoutall',
      password: 'Test@1234',
      firstName: 'Test',
      lastName: 'User',
    });
    const token = reg.body.token;
    const cookie = reg.headers['set-cookie']?.find((c) => c.startsWith('refreshToken='));

    await request(app)
      .post('/api/auth/logout-all')
      .set('Authorization', `Bearer ${token}`);

    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', cookie || '');

    expect(refreshRes.statusCode).toBe(401);
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).post('/api/auth/logout-all');
    expect(res.statusCode).toBe(401);
  });
});

// ─── Send verification email ──────────────────────────────────────────────────

describe('POST /api/auth/send-verification', () => {
  it('returns 200 for an unverified user', async () => {
    const { token } = await registerAndLogin();

    const res = await request(app)
      .post('/api/auth/send-verification')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 400 when email is already verified', async () => {
    const { token, userId } = await registerAndLogin();

    // Manually mark as verified
    await User.findByIdAndUpdate(userId, { emailVerified: true });

    const res = await request(app)
      .post('/api/auth/send-verification')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).post('/api/auth/send-verification');
    expect(res.statusCode).toBe(401);
  });
});

// ─── Verify email ─────────────────────────────────────────────────────────────

describe('GET /api/auth/verify-email', () => {
  it('verifies the email with a valid token', async () => {
    const { token, userId } = await registerAndLogin();

    // Generate a real verification token
    const user = await User.findById(userId);
    const rawToken = user.createEmailVerificationToken();
    await user.save();

    const res = await request(app).get(`/api/auth/verify-email?token=${rawToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    // Confirm emailVerified is now true
    const updated = await User.findById(userId);
    expect(updated.emailVerified).toBe(true);
  });

  it('returns 400 for an invalid or expired token', async () => {
    const res = await request(app).get('/api/auth/verify-email?token=invalidtoken123');
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when no token is provided', async () => {
    const res = await request(app).get('/api/auth/verify-email');
    expect(res.statusCode).toBe(400);
  });
});

// ─── Google unlink ────────────────────────────────────────────────────────────

describe('DELETE /api/auth/me/google/link', () => {
  it('returns 400 when no Google account is linked', async () => {
    const { token } = await registerAndLogin();

    const res = await request(app)
      .delete('/api/auth/me/google/link')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).delete('/api/auth/me/google/link');
    expect(res.statusCode).toBe(401);
  });
});

// ─── Demo account guard ───────────────────────────────────────────────────────

describe('Demo account guard', () => {
  it('blocks all non-GET requests for isDemo users', async () => {
    const { token, userId } = await registerAndLogin();

    // Manually mark user as demo
    await User.findByIdAndUpdate(userId, { isDemo: true });

    const res = await request(app)
      .patch('/api/auth/me/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ bio: 'should be blocked' });

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('allows GET requests for isDemo users', async () => {
    const { token, userId } = await registerAndLogin();

    await User.findByIdAndUpdate(userId, { isDemo: true });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
  });

  it('blocks POST /api/notes for isDemo users', async () => {
    const { token, userId } = await registerAndLogin();
    await User.findByIdAndUpdate(userId, { isDemo: true });

    const res = await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Demo Note', content: 'blocked' });

    expect(res.statusCode).toBe(403);
  });

  it('blocks POST /api/tasks for isDemo users', async () => {
    const { token, userId } = await registerAndLogin();
    await User.findByIdAndUpdate(userId, { isDemo: true });

    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Demo Task', dueDate: new Date().toISOString(), status: 'todo' });

    expect(res.statusCode).toBe(403);
  });
});
