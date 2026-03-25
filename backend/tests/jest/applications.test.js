/**
 * applications.test.js
 *
 * Tests the Job Applications endpoints:
 *   POST   /api/applications         → { success, application }
 *   GET    /api/applications         → { success, applications }
 *   PUT    /api/applications/:id     → { success, application }
 *   DELETE /api/applications/:id     → { success, message }     ← hard delete, owner-only
 */

const request = require('supertest');
const app = require('../../app');
const { connectTestDb, clearTestDb, closeTestDb } = require('./testDb');
const { registerAndLogin } = require('./testHelpers');

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(closeTestDb);

const baseApp = {
  company: 'Acme Corp',
  position: 'Software Engineer',
  status: 'applied',
};

// ─── Auth guard ─────────────────────────────────────────────────────────────

describe('Applications auth guard', () => {
  it('GET /api/applications returns 401 without token', async () => {
    const res = await request(app).get('/api/applications');
    expect(res.statusCode).toBe(401);
  });
});

// ─── Create ─────────────────────────────────────────────────────────────────

describe('POST /api/applications', () => {
  it('creates an application', async () => {
    const { token } = await registerAndLogin();

    const res = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${token}`)
      .send(baseApp);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.application.company).toBe('Acme Corp');
    expect(res.body.application.position).toBe('Software Engineer');
  });

  it('returns 400 when required fields are missing', async () => {
    const { token } = await registerAndLogin();

    // missing position — should fail validation
    const res = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${token}`)
      .send({ company: 'Only Company' }); // position missing

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ─── Read ───────────────────────────────────────────────────────────────────

describe('GET /api/applications', () => {
  it('returns only the current user\'s applications', async () => {
    const alice = await registerAndLogin();
    const bob = await registerAndLogin();

    await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ ...baseApp, company: 'Alice Corp' });

    await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${bob.token}`)
      .send({ ...baseApp, company: 'Bob Corp' });

    const res = await request(app)
      .get('/api/applications')
      .set('Authorization', `Bearer ${alice.token}`);

    expect(res.statusCode).toBe(200);
    const companies = res.body.applications.map((a) => a.company);
    expect(companies).toContain('Alice Corp');
    expect(companies).not.toContain('Bob Corp');
  });
});

// ─── Update status ──────────────────────────────────────────────────────────

describe('PUT /api/applications/:id', () => {
  it('updates application status', async () => {
    const { token } = await registerAndLogin();

    const create = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${token}`)
      .send(baseApp);

    const appId = create.body.application._id;

    const res = await request(app)
      .put(`/api/applications/${appId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'interview' });

    expect(res.statusCode).toBe(200);
    expect(res.body.application.status).toBe('interview');
  });
});

// ─── Delete ──────────────────────────────────────────────────────────────────

describe('DELETE /api/applications/:id', () => {
  it('deletes an application', async () => {
    const { token } = await registerAndLogin();

    const create = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${token}`)
      .send(baseApp);

    const appId = create.body.application._id;

    const res = await request(app)
      .delete(`/api/applications/${appId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    // Confirm it no longer appears in the list
    const list = await request(app)
      .get('/api/applications')
      .set('Authorization', `Bearer ${token}`);

    const ids = list.body.applications.map((a) => a._id);
    expect(ids).not.toContain(appId);
  });

  it('returns 403 when another user tries to delete', async () => {
    const alice = await registerAndLogin();
    const bob = await registerAndLogin();

    const create = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${alice.token}`)
      .send(baseApp);

    const appId = create.body.application._id;

    const res = await request(app)
      .delete(`/api/applications/${appId}`)
      .set('Authorization', `Bearer ${bob.token}`);

    expect(res.statusCode).toBe(403);
  });
});

