/**
 * study-sessions.test.js
 *
 * Tests the Study Sessions endpoints:
 *   POST   /api/study-sessions             → { success, session, streak }
 *   GET    /api/study-sessions             → { success, sessions, total, page, limit }
 *   GET    /api/study-sessions/streak      → { success, streak }
 *   GET    /api/study-sessions/set/:setId  → { success, sessions, total, page, limit }
 *   GET    /api/study-sessions/:id         → { success, session }
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const { connectTestDb, clearTestDb, closeTestDb } = require('./testDb');
const { registerAndLogin } = require('./testHelpers');

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(closeTestDb);

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function createSet(token, title = 'Test Set') {
  const res = await request(app)
    .post('/api/flashcard-sets')
    .set('Authorization', `Bearer ${token}`)
    .send({ title });
  return res.body.set;
}

async function addCard(token, setId) {
  const res = await request(app)
    .post(`/api/flashcard-sets/${setId}/cards`)
    .set('Authorization', `Bearer ${token}`)
    .send({ front: 'Q', back: 'A' });
  return res.body.card;
}

async function submitSession(token, setId, cardIds, durationSeconds = 60) {
  return request(app)
    .post('/api/study-sessions')
    .set('Authorization', `Bearer ${token}`)
    .send({
      setId,
      durationSeconds,
      cardResults: cardIds.map(cardId => ({ cardId, correct: true })),
    });
}

// ─── Auth guard ──────────────────────────────────────────────────────────────

describe('Study sessions auth guard', () => {
  it('POST /api/study-sessions returns 401 without token', async () => {
    const res = await request(app).post('/api/study-sessions');
    expect(res.statusCode).toBe(401);
  });

  it('GET /api/study-sessions returns 401 without token', async () => {
    const res = await request(app).get('/api/study-sessions');
    expect(res.statusCode).toBe(401);
  });

  it('GET /api/study-sessions/streak returns 401 without token', async () => {
    const res = await request(app).get('/api/study-sessions/streak');
    expect(res.statusCode).toBe(401);
  });
});

// ─── POST /api/study-sessions ─────────────────────────────────────────────────

describe('POST /api/study-sessions', () => {
  it('creates a session and returns session + streak', async () => {
    const { token } = await registerAndLogin();
    const set = await createSet(token);
    const card = await addCard(token, set._id);

    const res = await submitSession(token, set._id, [card._id]);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.session).toBeDefined();
    expect(res.body.session.score).toBe(100);
    expect(res.body.session.totalCards).toBe(1);
    expect(res.body.session.correctCount).toBe(1);
    expect(typeof res.body.streak).toBe('number');
  });

  it('computes score correctly for mixed results', async () => {
    const { token } = await registerAndLogin();
    const set = await createSet(token);
    const card1 = await addCard(token, set._id);
    const card2 = await addCard(token, set._id);

    const res = await request(app)
      .post('/api/study-sessions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        setId: set._id,
        durationSeconds: 60,
        cardResults: [
          { cardId: card1._id, correct: true },
          { cardId: card2._id, correct: false },
        ],
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.session.score).toBe(50);
    expect(res.body.session.correctCount).toBe(1);
    expect(res.body.session.totalCards).toBe(2);
  });

  it('returns 400 when setId is missing', async () => {
    const { token } = await registerAndLogin();
    const res = await request(app)
      .post('/api/study-sessions')
      .set('Authorization', `Bearer ${token}`)
      .send({ durationSeconds: 60, cardResults: [{ cardId: new mongoose.Types.ObjectId(), correct: true }] });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when cardResults is empty', async () => {
    const { token } = await registerAndLogin();
    const set = await createSet(token);

    const res = await request(app)
      .post('/api/study-sessions')
      .set('Authorization', `Bearer ${token}`)
      .send({ setId: set._id, durationSeconds: 60, cardResults: [] });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when durationSeconds is not a number', async () => {
    const { token } = await registerAndLogin();
    const set = await createSet(token);
    const card = await addCard(token, set._id);

    const res = await request(app)
      .post('/api/study-sessions')
      .set('Authorization', `Bearer ${token}`)
      .send({ setId: set._id, durationSeconds: 'fast', cardResults: [{ cardId: card._id, correct: true }] });

    expect(res.statusCode).toBe(400);
  });

  it('returns 404 when set does not exist', async () => {
    const { token } = await registerAndLogin();
    const fakeId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .post('/api/study-sessions')
      .set('Authorization', `Bearer ${token}`)
      .send({ setId: fakeId, durationSeconds: 60, cardResults: [{ cardId: fakeId, correct: true }] });

    expect(res.statusCode).toBe(404);
  });

  it('returns 403 when set is private and user is not the owner', async () => {
    const owner = await registerAndLogin();
    const other = await registerAndLogin();
    const set = await createSet(owner.token);
    const card = await addCard(owner.token, set._id);

    const res = await submitSession(other.token, set._id, [card._id]);
    expect(res.statusCode).toBe(403);
  });

  it('increments FlashcardSet.studySessionCount and sets lastStudiedAt', async () => {
    const { token } = await registerAndLogin();
    const set = await createSet(token);
    const card = await addCard(token, set._id);

    await submitSession(token, set._id, [card._id]);

    const setRes = await request(app)
      .get(`/api/flashcard-sets/${set._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(setRes.body.set.studySessionCount).toBe(1);
    expect(setRes.body.set.lastStudiedAt).toBeDefined();
  });

  it('updates card userProgress after session', async () => {
    const { token } = await registerAndLogin();
    const set = await createSet(token);
    const card = await addCard(token, set._id);

    await submitSession(token, set._id, [card._id]);

    const setRes = await request(app)
      .get(`/api/flashcard-sets/${set._id}`)
      .set('Authorization', `Bearer ${token}`);

    const updatedCard = setRes.body.set.flashcards.find(c => c._id === card._id);
    expect(updatedCard).toBeDefined();
    expect(updatedCard.userProgress.length).toBe(1);
    expect(updatedCard.userProgress[0].correctCount).toBe(1);
  });
});

// ─── GET /api/study-sessions/streak ──────────────────────────────────────────

describe('GET /api/study-sessions/streak', () => {
  it('returns streak 0 with no sessions', async () => {
    const { token } = await registerAndLogin();
    const res = await request(app)
      .get('/api/study-sessions/streak')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.streak).toBe(0);
  });

  it('returns streak 1 after one session today', async () => {
    const { token } = await registerAndLogin();
    const set = await createSet(token);
    const card = await addCard(token, set._id);

    await submitSession(token, set._id, [card._id]);

    const res = await request(app)
      .get('/api/study-sessions/streak')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.streak).toBe(1);
  });

  it('returns streak 2 for sessions on two consecutive days', async () => {
    const { token, userId } = await registerAndLogin();
    const StudySession = require('../../models/StudySession');

    // Seed a session from yesterday
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    await StudySession.create({
      userId,
      setId: new mongoose.Types.ObjectId(),
      completedAt: yesterday,
      durationSeconds: 60,
      totalCards: 5,
      correctCount: 4,
      score: 80,
      cardResults: [],
    });

    // Today's session via the endpoint
    const set = await createSet(token);
    const card = await addCard(token, set._id);
    await submitSession(token, set._id, [card._id]);

    const res = await request(app)
      .get('/api/study-sessions/streak')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.streak).toBe(2);
  });

  it('returns streak 1 after a gap of 2 days', async () => {
    const { token, userId } = await registerAndLogin();
    const StudySession = require('../../models/StudySession');

    // Seed a session from 2 days ago (not consecutive with today)
    const twoDaysAgo = new Date();
    twoDaysAgo.setUTCDate(twoDaysAgo.getUTCDate() - 2);
    await StudySession.create({
      userId,
      setId: new mongoose.Types.ObjectId(),
      completedAt: twoDaysAgo,
      durationSeconds: 60,
      totalCards: 5,
      correctCount: 5,
      score: 100,
      cardResults: [],
    });

    // Today's session
    const set = await createSet(token);
    const card = await addCard(token, set._id);
    await submitSession(token, set._id, [card._id]);

    const res = await request(app)
      .get('/api/study-sessions/streak')
      .set('Authorization', `Bearer ${token}`);

    // Gap breaks the streak — today starts a new streak of 1
    expect(res.body.streak).toBe(1);
  });
});

// ─── GET /api/study-sessions ─────────────────────────────────────────────────

describe('GET /api/study-sessions', () => {
  it("returns only the current user's sessions", async () => {
    const alice = await registerAndLogin();
    const bob = await registerAndLogin();

    const aliceSet = await createSet(alice.token);
    const aliceCard = await addCard(alice.token, aliceSet._id);
    await submitSession(alice.token, aliceSet._id, [aliceCard._id]);

    const bobSet = await createSet(bob.token);
    const bobCard = await addCard(bob.token, bobSet._id);
    await submitSession(bob.token, bobSet._id, [bobCard._id]);

    const res = await request(app)
      .get('/api/study-sessions')
      .set('Authorization', `Bearer ${alice.token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.sessions.length).toBe(1);
    expect(res.body.sessions[0].userId.toString()).toBe(alice.userId.toString());
  });

  it('filters by ?setId=', async () => {
    const { token } = await registerAndLogin();
    const set1 = await createSet(token, 'Set 1');
    const set2 = await createSet(token, 'Set 2');
    const card1 = await addCard(token, set1._id);
    const card2 = await addCard(token, set2._id);

    await submitSession(token, set1._id, [card1._id]);
    await submitSession(token, set2._id, [card2._id]);

    const res = await request(app)
      .get(`/api/study-sessions?setId=${set1._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.sessions.length).toBe(1);
    expect(res.body.sessions[0].setId.toString()).toBe(set1._id.toString());
    expect(res.body.sessions[0].setTitle).toBe('Set 1');
  });

  it('paginates with limit and page', async () => {
    const { token } = await registerAndLogin();
    const set = await createSet(token);
    const card = await addCard(token, set._id);

    // Create 3 sessions
    for (let i = 0; i < 3; i++) {
      await submitSession(token, set._id, [card._id]);
    }

    const res = await request(app)
      .get('/api/study-sessions?page=1&limit=2')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.sessions.length).toBe(2);
    expect(res.body.total).toBe(3);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(2);
  });
});

// ─── GET /api/study-sessions/set/:setId ──────────────────────────────────────

describe('GET /api/study-sessions/set/:setId', () => {
  it('returns sessions for a specific set', async () => {
    const { token } = await registerAndLogin();
    const set = await createSet(token);
    const card = await addCard(token, set._id);

    await submitSession(token, set._id, [card._id]);

    const res = await request(app)
      .get(`/api/study-sessions/set/${set._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.sessions.length).toBe(1);
  });

  it('returns empty array when no sessions for that set', async () => {
    const { token } = await registerAndLogin();
    const set = await createSet(token);

    const res = await request(app)
      .get(`/api/study-sessions/set/${set._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.sessions.length).toBe(0);
  });
});

// ─── GET /api/study-sessions/:id ─────────────────────────────────────────────

describe('GET /api/study-sessions/:id', () => {
  it('returns session by ID for the owner with populated card front/back', async () => {
    const { token } = await registerAndLogin();
    const set = await createSet(token);
    const card = await addCard(token, set._id);

    const submitRes = await submitSession(token, set._id, [card._id]);
    const sessionId = submitRes.body.session._id;

    const res = await request(app)
      .get(`/api/study-sessions/${sessionId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.session._id).toBe(sessionId);
    expect(Array.isArray(res.body.session.cardResults)).toBe(true);
    // cardId should be populated with card content
    const cardResult = res.body.session.cardResults[0];
    expect(cardResult.cardId).toHaveProperty('front', 'Q');
    expect(cardResult.cardId).toHaveProperty('back', 'A');
    expect(typeof cardResult.correct).toBe('boolean');
  });

  it('returns 403 when another user tries to read the session', async () => {
    const owner = await registerAndLogin();
    const other = await registerAndLogin();

    const set = await createSet(owner.token);
    const card = await addCard(owner.token, set._id);
    const submitRes = await submitSession(owner.token, set._id, [card._id]);
    const sessionId = submitRes.body.session._id;

    const res = await request(app)
      .get(`/api/study-sessions/${sessionId}`)
      .set('Authorization', `Bearer ${other.token}`);

    expect(res.statusCode).toBe(403);
  });

  it('returns 404 for a non-existent session', async () => {
    const { token } = await registerAndLogin();
    const fakeId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .get(`/api/study-sessions/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(404);
  });
});
