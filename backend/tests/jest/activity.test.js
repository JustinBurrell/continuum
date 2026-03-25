/**
 * activity.test.js
 *
 * Tests the Activity feed endpoint:
 *   GET /api/activity   → { success, ... }
 *
 * Activity is read-only — events are created automatically by other
 * actions (creating notes, tasks, etc.). We just verify the endpoint
 * is protected and returns successfully for authenticated users.
 */

const request = require('supertest');
const app = require('../../app');
const { connectTestDb, clearTestDb, closeTestDb } = require('./testDb');
const { registerAndLogin } = require('./testHelpers');

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(closeTestDb);

describe('GET /api/activity', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/activity');
    expect(res.statusCode).toBe(401);
  });

  it('returns activity feed for authenticated user', async () => {
    const { token } = await registerAndLogin();

    // Create a note to generate an activity event
    await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Activity test note', content: 'generates an event' });

    const res = await request(app)
      .get('/api/activity')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
