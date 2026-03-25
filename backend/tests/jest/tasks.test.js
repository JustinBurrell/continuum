/**
 * tasks.test.js
 *
 * Tests the Tasks endpoints:
 *   POST   /api/tasks              → { success, task }
 *   GET    /api/tasks              → { success, tasks }
 *   PATCH  /api/tasks/:id/status   → { success, task }
 *   DELETE /api/tasks/:id          → { success, message }
 *
 * Note: tasks require dueDate in addition to title.
 */

const request = require('supertest');
const app = require('../../app');
const { connectTestDb, clearTestDb, closeTestDb } = require('./testDb');
const { registerAndLogin, makeFriends } = require('./testHelpers');

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(closeTestDb);

const tomorrow = new Date(Date.now() + 86400000).toISOString();

// ─── Auth guard ─────────────────────────────────────────────────────────────

describe('Tasks auth guard', () => {
  it('GET /api/tasks returns 401 without token', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.statusCode).toBe(401);
  });
});

// ─── Create ─────────────────────────────────────────────────────────────────

describe('POST /api/tasks', () => {
  it('creates a task and returns it', async () => {
    const { token } = await registerAndLogin();

    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Write tests', status: 'todo', dueDate: tomorrow });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.task.title).toBe('Write tests');
    expect(res.body.task.status).toBe('todo');
  });

  it('returns 400 when title is missing', async () => {
    const { token } = await registerAndLogin();

    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'todo', dueDate: tomorrow });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when dueDate is missing', async () => {
    const { token } = await registerAndLogin();

    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'No due date' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ─── Read ───────────────────────────────────────────────────────────────────

describe('GET /api/tasks', () => {
  it('returns only the current user\'s tasks', async () => {
    const alice = await registerAndLogin();
    const bob = await registerAndLogin();

    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ title: 'Alice Task', status: 'todo', dueDate: tomorrow });

    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${bob.token}`)
      .send({ title: 'Bob Task', status: 'todo', dueDate: tomorrow });

    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${alice.token}`);

    expect(res.statusCode).toBe(200);
    const titles = res.body.tasks.map((t) => t.title);
    expect(titles).toContain('Alice Task');
    expect(titles).not.toContain('Bob Task');
  });
});

// ─── Status update ──────────────────────────────────────────────────────────

describe('PATCH /api/tasks/:id/status', () => {
  it('updates a task status', async () => {
    const { token } = await registerAndLogin();

    const create = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Move me', status: 'todo', dueDate: tomorrow });

    const taskId = create.body.task._id;

    const res = await request(app)
      .patch(`/api/tasks/${taskId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'in_progress' });

    expect(res.statusCode).toBe(200);
    expect(res.body.task.status).toBe('in_progress');
  });
});

// ─── Delete ─────────────────────────────────────────────────────────────────

describe('DELETE /api/tasks/:id', () => {
  it('deletes a task', async () => {
    const { token } = await registerAndLogin();

    const create = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Temp task', status: 'todo', dueDate: tomorrow });

    const taskId = create.body.task._id;

    const del = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(del.statusCode).toBe(200);
    expect(del.body.success).toBe(true);
  });

  it('returns 403 or 404 when another user tries to delete', async () => {
    const alice = await registerAndLogin();
    const bob = await registerAndLogin();

    const create = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ title: 'Alice Task', status: 'todo', dueDate: tomorrow });

    const taskId = create.body.task._id;

    const res = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${bob.token}`);

    expect([403, 404]).toContain(res.statusCode);
  });
});

// ─── Shared tasks ─────────────────────────────────────────────────────────────

describe('GET /api/tasks/shared', () => {
  it('returns tasks where current user is a participant but not the owner', async () => {
    const { alice, bob } = await makeFriends();
    const tomorrow = new Date(Date.now() + 86_400_000).toISOString();

    // Alice creates a shared task
    const create = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ title: 'Shared Task', dueDate: tomorrow, isShared: true });

    const taskId = create.body.task._id;

    // Alice adds Bob as a participant
    await request(app)
      .patch(`/api/tasks/${taskId}/participants`)
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ participants: [{ userId: bob.userId }] });

    // Bob fetches shared tasks — should see Alice's task
    const res = await request(app)
      .get('/api/tasks/shared')
      .set('Authorization', `Bearer ${bob.token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.tasks.some(t => t._id === taskId)).toBe(true);
  });

  it('does not return tasks owned by the requesting user', async () => {
    const alice = await registerAndLogin();
    const tomorrow = new Date(Date.now() + 86_400_000).toISOString();

    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ title: 'My Own Task', dueDate: tomorrow, isShared: true });

    const res = await request(app)
      .get('/api/tasks/shared')
      .set('Authorization', `Bearer ${alice.token}`);

    expect(res.statusCode).toBe(200);
    // Owner's own tasks should NOT appear in /shared
    expect(res.body.tasks.every(t => t.userId?.toString() !== alice.userId)).toBe(true);
  });
});
