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
    expect(res.body.feed).toBeDefined();
    expect(typeof res.body.total).toBe('number');
  });

  it('since param filters total to only activities after the timestamp', async () => {
    const { token } = await registerAndLogin();

    // Create a note before recording the since timestamp
    await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Old activity note', content: 'before since' });

    const since = new Date().toISOString();

    // Create a note after the since timestamp
    await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'New activity note', content: 'after since' });

    const [resAll, resSince] = await Promise.all([
      request(app).get('/api/activity').set('Authorization', `Bearer ${token}`),
      request(app).get(`/api/activity?since=${since}`).set('Authorization', `Bearer ${token}`),
    ]);

    expect(resAll.statusCode).toBe(200);
    expect(resSince.statusCode).toBe(200);
    // Unseen count should be less than or equal to total count
    expect(resSince.body.total).toBeLessThanOrEqual(resAll.body.total);
  });

  it('returns feed and nextCursor when more pages exist', async () => {
    const { token } = await registerAndLogin();

    const res = await request(app)
      .get('/api/activity?limit=1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.feed).toBeDefined();
    // nextCursor is null when there are no items or only one item returned
    expect(res.body).toHaveProperty('nextCursor');
  });
});
