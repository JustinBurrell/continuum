/**
 * onboarding.test.js
 *
 * Tests the onboarding and tour management endpoints:
 *   POST  /api/auth/me/onboarding/complete
 *   POST  /api/auth/me/tour/complete
 *   PATCH /api/auth/me/tour/reset
 *   PATCH /api/auth/me/onboarding/checklist
 *   PATCH /api/auth/me/profile (onboardingGoal field)
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

// ─── PATCH /api/auth/me/onboarding/checklist ─────────────────────────────────

describe('PATCH /api/auth/me/onboarding/checklist', () => {
  it('sets noteCreated to true when passed as true', async () => {
    const { token } = await registerAndLogin();

    const res = await request(app)
      .patch('/api/auth/me/onboarding/checklist')
      .set('Authorization', `Bearer ${token}`)
      .send({ noteCreated: true });

    expect(res.statusCode).toBe(200);
    expect(res.body.user.onboardingChecklist.noteCreated).toBe(true);
    // Other fields remain false
    expect(res.body.user.onboardingChecklist.taskAdded).toBe(false);
  });

  it('does not reverse a completed item when false is sent', async () => {
    const { token } = await registerAndLogin();

    // First mark it done
    await request(app)
      .patch('/api/auth/me/onboarding/checklist')
      .set('Authorization', `Bearer ${token}`)
      .send({ noteCreated: true });

    // Then try to un-check it (should be silently ignored)
    const res = await request(app)
      .patch('/api/auth/me/onboarding/checklist')
      .set('Authorization', `Bearer ${token}`)
      .send({ noteCreated: false });

    expect(res.statusCode).toBe(400); // no valid true fields = 400
  });

  it('only updates the fields that are true in the body', async () => {
    const { token } = await registerAndLogin();

    const res = await request(app)
      .patch('/api/auth/me/onboarding/checklist')
      .set('Authorization', `Bearer ${token}`)
      .send({ noteCreated: true, taskAdded: true });

    expect(res.body.user.onboardingChecklist.noteCreated).toBe(true);
    expect(res.body.user.onboardingChecklist.taskAdded).toBe(true);
    expect(res.body.user.onboardingChecklist.flashcardsGenerated).toBe(false);
    expect(res.body.user.onboardingChecklist.friendConnected).toBe(false);
    expect(res.body.user.onboardingChecklist.dismissed).toBe(false);
  });

  it('ignores unknown fields', async () => {
    const { token } = await registerAndLogin();

    const res = await request(app)
      .patch('/api/auth/me/onboarding/checklist')
      .set('Authorization', `Bearer ${token}`)
      .send({ noteCreated: true, hackerField: true });

    expect(res.statusCode).toBe(200);
    expect(res.body.user.onboardingChecklist).not.toHaveProperty('hackerField');
  });

  it('returns 401 without a valid token', async () => {
    const res = await request(app)
      .patch('/api/auth/me/onboarding/checklist')
      .send({ noteCreated: true });

    expect(res.statusCode).toBe(401);
  });
});
