/**
 * flashcards.test.js
 *
 * Tests the Flashcard Sets endpoints:
 *   POST   /api/flashcard-sets           → { success, set }
 *   GET    /api/flashcard-sets           → { success, sets }
 *   GET    /api/flashcard-sets/:id       → { success, set }
 *   DELETE /api/flashcard-sets/:id       → { success, message }
 *   POST   /api/flashcard-sets/:id/cards → { success, card }
 */

const request = require('supertest');
const app = require('../../app');
const { connectTestDb, clearTestDb, closeTestDb } = require('./testDb');
const { registerAndLogin } = require('./testHelpers');

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(closeTestDb);

// ─── Auth guard ─────────────────────────────────────────────────────────────

describe('Flashcard sets auth guard', () => {
  it('GET /api/flashcard-sets returns 401 without token', async () => {
    const res = await request(app).get('/api/flashcard-sets');
    expect(res.statusCode).toBe(401);
  });
});

// ─── Create set ─────────────────────────────────────────────────────────────

describe('POST /api/flashcard-sets', () => {
  it('creates a flashcard set', async () => {
    const { token } = await registerAndLogin();

    const res = await request(app)
      .post('/api/flashcard-sets')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Biology Chapter 1', description: 'Cell biology' });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.set.title).toBe('Biology Chapter 1');
  });

  it('returns 400 when title is missing', async () => {
    const { token } = await registerAndLogin();

    const res = await request(app)
      .post('/api/flashcard-sets')
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'no title' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ─── Read sets ──────────────────────────────────────────────────────────────

describe('GET /api/flashcard-sets', () => {
  it('returns the user\'s sets', async () => {
    const alice = await registerAndLogin();
    const bob = await registerAndLogin();

    await request(app)
      .post('/api/flashcard-sets')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ title: 'Alice Set' });

    await request(app)
      .post('/api/flashcard-sets')
      .set('Authorization', `Bearer ${bob.token}`)
      .send({ title: 'Bob Set' });

    const res = await request(app)
      .get('/api/flashcard-sets')
      .set('Authorization', `Bearer ${alice.token}`);

    expect(res.statusCode).toBe(200);
    const titles = res.body.sets.map((s) => s.title);
    expect(titles).toContain('Alice Set');
    expect(titles).not.toContain('Bob Set');
  });
});

// ─── Add card to set ─────────────────────────────────────────────────────────

describe('POST /api/flashcard-sets/:id/cards', () => {
  it('adds a card to a set', async () => {
    const { token } = await registerAndLogin();

    const create = await request(app)
      .post('/api/flashcard-sets')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'My Set' });

    const setId = create.body.set._id;

    const res = await request(app)
      .post(`/api/flashcard-sets/${setId}/cards`)
      .set('Authorization', `Bearer ${token}`)
      .send({ front: 'What is mitosis?', back: 'Cell division' });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.card.front).toBe('What is mitosis?');
  });
});

// ─── Delete set ─────────────────────────────────────────────────────────────

describe('DELETE /api/flashcard-sets/:id', () => {
  it('deletes a set', async () => {
    const { token } = await registerAndLogin();

    const create = await request(app)
      .post('/api/flashcard-sets')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Temporary Set' });

    const setId = create.body.set._id;

    const del = await request(app)
      .delete(`/api/flashcard-sets/${setId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(del.statusCode).toBe(200);
    expect(del.body.success).toBe(true);
  });

  it('returns 403 or 404 when another user tries to delete', async () => {
    const alice = await registerAndLogin();
    const bob = await registerAndLogin();

    const create = await request(app)
      .post('/api/flashcard-sets')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ title: 'Alice Set' });

    const setId = create.body.set._id;

    const res = await request(app)
      .delete(`/api/flashcard-sets/${setId}`)
      .set('Authorization', `Bearer ${bob.token}`);

    expect([403, 404]).toContain(res.statusCode);
  });
});
