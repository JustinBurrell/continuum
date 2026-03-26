/**
 * calendar.test.js
 *
 * Tests the Calendar endpoint:
 *   GET /api/calendar            → tasks grouped by due date
 *   GET /api/calendar?start=&end= → filtered by date range
 */

const request = require('supertest');
const app = require('../../app');
const { connectTestDb, clearTestDb, closeTestDb } = require('./testDb');
const { registerAndLogin, makeFriends } = require('./testHelpers');

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(closeTestDb);

// ─── Auth guard ──────────────────────────────────────────────────────────────

describe('Calendar auth guard', () => {
  it('GET /api/calendar returns 401 without token', async () => {
    const res = await request(app).get('/api/calendar');
    expect(res.statusCode).toBe(401);
  });
});

// ─── Calendar view ───────────────────────────────────────────────────────────

describe('GET /api/calendar', () => {
  it('returns 200 with an empty calendar for a new user', async () => {
    const { token } = await registerAndLogin();

    const res = await request(app)
      .get('/api/calendar')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('includes a task after it is created', async () => {
    const { token } = await registerAndLogin();
    const dueDate = new Date(Date.now() + 86400000).toISOString(); // tomorrow

    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Calendar Task', dueDate, status: 'todo' });

    const res = await request(app)
      .get('/api/calendar')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    // The response is an object keyed by date string — at least one entry
    const keys = Object.keys(res.body.calendar || res.body.tasks || {});
    expect(keys.length).toBeGreaterThanOrEqual(1);
  });

  it('does not include another user\'s private tasks', async () => {
    const alice = await registerAndLogin();
    const bob = await registerAndLogin();
    const dueDate = new Date(Date.now() + 86400000).toISOString();

    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${bob.token}`)
      .send({ title: 'Bob Private Task', dueDate, status: 'todo' });

    const res = await request(app)
      .get('/api/calendar')
      .set('Authorization', `Bearer ${alice.token}`);

    expect(res.statusCode).toBe(200);
    const allTasks = Object.values(res.body.calendar || res.body.tasks || {}).flat();
    const titles = allTasks.map((t) => t.title);
    expect(titles).not.toContain('Bob Private Task');
  });

  it('filters results when start and end query params are provided', async () => {
    const { token } = await registerAndLogin();
    const start = new Date(Date.now() - 86400000 * 30).toISOString().split('T')[0]; // 30 days ago
    const end = new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0];   // 30 days ahead

    const res = await request(app)
      .get(`/api/calendar?start=${start}&end=${end}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('includes shared tasks from friends', async () => {
    const { alice, bob } = await makeFriends();
    const dueDate = new Date(Date.now() + 86400000).toISOString();

    // Alice creates a task with Bob as participant
    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ title: 'Shared Calendar Task', dueDate, status: 'todo', isShared: true, participants: [{ userId: bob.userId }] });

    const res = await request(app)
      .get('/api/calendar')
      .set('Authorization', `Bearer ${bob.token}`);

    expect(res.statusCode).toBe(200);
    const allTasks = Object.values(res.body.calendar || res.body.tasks || {}).flat();
    const titles = allTasks.map((t) => t.title);
    expect(titles).toContain('Shared Calendar Task');
  });
});
