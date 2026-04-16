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
const { registerAndLogin, makeFriends } = require('./testHelpers');

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

  it('returns pagination metadata', async () => {
    const { token } = await registerAndLogin();

    await request(app)
      .post('/api/flashcard-sets')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Set A' });

    await request(app)
      .post('/api/flashcard-sets')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Set B' });

    const res = await request(app)
      .get('/api/flashcard-sets')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.total).toBe(2);
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.pages).toBeGreaterThanOrEqual(1);
  });

  it('respects page and limit query params', async () => {
    const { token } = await registerAndLogin();

    for (let i = 1; i <= 3; i++) {
      await request(app)
        .post('/api/flashcard-sets')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: `Set ${i}` });
    }

    const res = await request(app)
      .get('/api/flashcard-sets?page=1&limit=2')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.sets.length).toBe(2);
    expect(res.body.pagination.total).toBe(3);
    expect(res.body.pagination.pages).toBe(2);
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

// ─── Shared flashcard sets ────────────────────────────────────────────────────

describe('GET /api/flashcard-sets/shared', () => {
  it('returns sets with friends visibility from accepted friends', async () => {
    const { alice, bob } = await makeFriends();

    // Alice creates a set then shares it with friends via PATCH /:id/share
    // (createSet does not accept visibility — use the dedicated share endpoint)
    const create = await request(app)
      .post('/api/flashcard-sets')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ title: 'Shared Set' });

    const setId = create.body.set._id;

    await request(app)
      .patch(`/api/flashcard-sets/${setId}/share`)
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ visibility: 'friends' });

    // Bob fetches shared sets — should see Alice's set
    const res = await request(app)
      .get('/api/flashcard-sets/shared')
      .set('Authorization', `Bearer ${bob.token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.sets.some(s => s._id === setId)).toBe(true);
  });

  it('does not return private sets from friends', async () => {
    const { alice, bob } = await makeFriends();

    // Alice creates a set without sharing — default visibility is 'private'
    const create = await request(app)
      .post('/api/flashcard-sets')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ title: 'Private Set' });

    const setId = create.body.set._id;

    const res = await request(app)
      .get('/api/flashcard-sets/shared')
      .set('Authorization', `Bearer ${bob.token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.sets.some(s => s._id === setId)).toBe(false);
  });
});

// ─── Study progress on shared sets ───────────────────────────────────────────

describe('PUT /api/flashcard-sets/:setId/cards/:cardId/progress', () => {
  it('allows a friend to update progress on a friends-visible set', async () => {
    const { alice, bob } = await makeFriends();

    const create = await request(app)
      .post('/api/flashcard-sets')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ title: 'Friend Studiable' });

    const setId = create.body.set._id;

    const cardRes = await request(app)
      .post(`/api/flashcard-sets/${setId}/cards`)
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ front: 'Q', back: 'A' });

    const cardId = cardRes.body.card._id;

    await request(app)
      .patch(`/api/flashcard-sets/${setId}/share`)
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ visibility: 'friends' });

    const progress = await request(app)
      .put(`/api/flashcard-sets/${setId}/cards/${cardId}/progress`)
      .set('Authorization', `Bearer ${bob.token}`)
      .send({ correct: true });

    expect(progress.statusCode).toBe(200);
    expect(progress.body.success).toBe(true);
  });
});
