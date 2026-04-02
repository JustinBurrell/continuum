/**
 * notes.test.js
 *
 * Tests the Notes CRUD endpoints:
 *   POST   /api/notes         → { success, note }
 *   GET    /api/notes         → { success, notes, pagination }
 *   GET    /api/notes/:id     → { success, note }
 *   PUT    /api/notes/:id     → { success, note }
 *   DELETE /api/notes/:id     → { success, message }
 */

const request = require('supertest');
const app = require('../../app');
const { connectTestDb, clearTestDb, closeTestDb } = require('./testDb');
const { registerAndLogin } = require('./testHelpers');

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(closeTestDb);

// ─── Auth guard ─────────────────────────────────────────────────────────────

describe('Notes auth guard', () => {
  it('GET /api/notes returns 401 without token', async () => {
    const res = await request(app).get('/api/notes');
    expect(res.statusCode).toBe(401);
  });

  it('POST /api/notes returns 401 without token', async () => {
    const res = await request(app)
      .post('/api/notes')
      .send({ title: 'Unauthorized note', content: 'should fail' });
    expect(res.statusCode).toBe(401);
  });
});

// ─── Create ─────────────────────────────────────────────────────────────────

describe('POST /api/notes', () => {
  it('creates a note and returns it', async () => {
    const { token } = await registerAndLogin();

    const res = await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'My First Note', content: 'Hello world' });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.note.title).toBe('My First Note');
    expect(res.body.note.content).toBe('Hello world');
  });

  it('returns 400 when title is missing', async () => {
    const { token } = await registerAndLogin();

    const res = await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'No title here' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ─── Read ───────────────────────────────────────────────────────────────────

describe('GET /api/notes', () => {
  it('returns only the current user\'s notes', async () => {
    const alice = await registerAndLogin();
    const bob = await registerAndLogin();

    await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ title: 'Alice Note 1', content: 'a' });
    await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ title: 'Alice Note 2', content: 'b' });
    await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${bob.token}`)
      .send({ title: 'Bob Note', content: 'c' });

    const res = await request(app)
      .get('/api/notes')
      .set('Authorization', `Bearer ${alice.token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    const titles = res.body.notes.map((n) => n.title);
    expect(titles).toContain('Alice Note 1');
    expect(titles).toContain('Alice Note 2');
    expect(titles).not.toContain('Bob Note');
  });
});

describe('GET /api/notes/:id', () => {
  it('returns a note by id for its owner', async () => {
    const { token } = await registerAndLogin();

    const create = await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Specific Note', content: 'detail' });

    const noteId = create.body.note._id;

    const res = await request(app)
      .get(`/api/notes/${noteId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.note._id).toBe(noteId);
  });

  it('returns 403 or 404 when another user tries to access the note', async () => {
    const alice = await registerAndLogin();
    const bob = await registerAndLogin();

    const create = await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ title: 'Alice Private', content: 'secret' });

    const noteId = create.body.note._id;

    const res = await request(app)
      .get(`/api/notes/${noteId}`)
      .set('Authorization', `Bearer ${bob.token}`);

    expect([403, 404]).toContain(res.statusCode);
  });
});

// ─── Update ─────────────────────────────────────────────────────────────────

describe('PUT /api/notes/:id', () => {
  it('updates a note', async () => {
    const { token } = await registerAndLogin();

    const create = await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Original', content: 'old content' });

    const noteId = create.body.note._id;

    const res = await request(app)
      .put(`/api/notes/${noteId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated', content: 'new content' });

    expect(res.statusCode).toBe(200);
    expect(res.body.note.title).toBe('Updated');
    expect(res.body.note.content).toBe('new content');
  });
});

// ─── HTML content type ──────────────────────────────────────────────────────

describe('HTML contentType', () => {
  it('creates a note with contentType html and stores HTML content', async () => {
    const { token } = await registerAndLogin();

    const res = await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Rich Note', content: '<p><strong>Bold</strong> text</p>', contentType: 'html' });

    expect(res.statusCode).toBe(201);
    expect(res.body.note.contentType).toBe('html');
    expect(res.body.note.content).toContain('Bold');
  });

  it('updates a note to html contentType', async () => {
    const { token } = await registerAndLogin();

    const create = await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Plain Note', content: 'plain text' });

    const noteId = create.body.note._id;

    const res = await request(app)
      .put(`/api/notes/${noteId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: '<p><em>italic</em></p>', contentType: 'html' });

    expect(res.statusCode).toBe(200);
    expect(res.body.note.contentType).toBe('html');
  });
});

// ─── Delete ─────────────────────────────────────────────────────────────────

describe('DELETE /api/notes/:id', () => {
  it('deletes a note and returns success', async () => {
    const { token } = await registerAndLogin();

    const create = await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'To Delete', content: 'bye' });

    const noteId = create.body.note._id;

    const del = await request(app)
      .delete(`/api/notes/${noteId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(del.statusCode).toBe(200);
    expect(del.body.success).toBe(true);

    // Confirm it's gone
    const get = await request(app)
      .get(`/api/notes/${noteId}`)
      .set('Authorization', `Bearer ${token}`);

    expect([403, 404]).toContain(get.statusCode);
  });

  it('returns 403 or 404 when another user tries to delete', async () => {
    const alice = await registerAndLogin();
    const bob = await registerAndLogin();

    const create = await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ title: 'Alice Only', content: 'mine' });

    const noteId = create.body.note._id;

    const res = await request(app)
      .delete(`/api/notes/${noteId}`)
      .set('Authorization', `Bearer ${bob.token}`);

    expect([403, 404]).toContain(res.statusCode);
  });
});
