/**
 * onboarding.test.js
 *
 * Tests the onboarding and tour management endpoints:
 *   POST  /api/auth/me/onboarding/complete
 *   POST  /api/auth/me/tour/complete
 *   PATCH /api/auth/me/tour/reset
 *   PATCH /api/auth/me/profile (onboardingGoal field)
 *
 * Note: /api/auth/me/onboarding/checklist was removed — onboardingChecklist
 * is no longer part of the schema (replaced by the activation step flow).
 */

const request = require('supertest');
const app = require('../../app');
const { connectTestDb, clearTestDb, closeTestDb } = require('./testDb');
const { registerAndLogin } = require('./testHelpers');

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(closeTestDb);

// ─── POST /api/auth/me/onboarding/complete ───────────────────────────────────

describe('POST /api/auth/me/onboarding/complete', () => {
  it('sets onboardingCompleted to true and returns updated user', async () => {
    const { token } = await registerAndLogin();

    const res = await request(app)
      .post('/api/auth/me/onboarding/complete')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.onboardingCompleted).toBe(true);
  });

  it('returns 401 without a valid token', async () => {
    const res = await request(app).post('/api/auth/me/onboarding/complete');
    expect(res.statusCode).toBe(401);
  });

  it('is idempotent when called twice', async () => {
    const { token } = await registerAndLogin();

    await request(app)
      .post('/api/auth/me/onboarding/complete')
      .set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .post('/api/auth/me/onboarding/complete')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.user.onboardingCompleted).toBe(true);
  });
});

// ─── POST /api/auth/me/tour/complete ─────────────────────────────────────────

describe('POST /api/auth/me/tour/complete', () => {
  it('sets tourCompleted to true and returns updated user', async () => {
    const { token } = await registerAndLogin();

    const res = await request(app)
      .post('/api/auth/me/tour/complete')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.tourCompleted).toBe(true);
  });

  it('returns 401 without a valid token', async () => {
    const res = await request(app).post('/api/auth/me/tour/complete');
    expect(res.statusCode).toBe(401);
  });

  it('is idempotent when called twice', async () => {
    const { token } = await registerAndLogin();

    await request(app)
      .post('/api/auth/me/tour/complete')
      .set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .post('/api/auth/me/tour/complete')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.user.tourCompleted).toBe(true);
  });
});

// ─── PATCH /api/auth/me/tour/reset ───────────────────────────────────────────

describe('PATCH /api/auth/me/tour/reset', () => {
  it('sets tourCompleted to false and returns updated user', async () => {
    const { token } = await registerAndLogin();

    // Complete the tour first
    await request(app)
      .post('/api/auth/me/tour/complete')
      .set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .patch('/api/auth/me/tour/reset')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.tourCompleted).toBe(false);
  });

  it('returns 401 without a valid token', async () => {
    const res = await request(app).patch('/api/auth/me/tour/reset');
    expect(res.statusCode).toBe(401);
  });

  it('can be called repeatedly without error', async () => {
    const { token } = await registerAndLogin();

    const res1 = await request(app)
      .patch('/api/auth/me/tour/reset')
      .set('Authorization', `Bearer ${token}`);
    const res2 = await request(app)
      .patch('/api/auth/me/tour/reset')
      .set('Authorization', `Bearer ${token}`);

    expect(res1.statusCode).toBe(200);
    expect(res2.statusCode).toBe(200);
  });
});

// ─── PATCH /api/auth/me/profile (onboardingGoal) ─────────────────────────────

describe('PATCH /api/auth/me/profile — onboardingGoal', () => {
  it('accepts a valid onboardingGoal enum value', async () => {
    const { token } = await registerAndLogin();

    const res = await request(app)
      .patch('/api/auth/me/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ onboardingGoal: 'study_smarter' });

    expect(res.statusCode).toBe(200);
    expect(res.body.user.onboardingGoal).toBe('study_smarter');
  });

  it('accepts all valid goal enum values', async () => {
    const validGoals = ['study_smarter', 'track_job_search', 'manage_coursework', 'collaborate', 'not_sure'];

    for (const goal of validGoals) {
      const { token } = await registerAndLogin();
      const res = await request(app)
        .patch('/api/auth/me/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ onboardingGoal: goal });
      expect(res.statusCode).toBe(200);
      expect(res.body.user.onboardingGoal).toBe(goal);
    }
  });

  it('returns 400 for an invalid onboardingGoal string', async () => {
    const { token } = await registerAndLogin();

    const res = await request(app)
      .patch('/api/auth/me/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ onboardingGoal: 'invalid_goal' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

