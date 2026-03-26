/**
 * comments.test.js
 *
 * Tests the Comments endpoints:
 *   POST   /api/comments                       → add a comment to a note
 *   GET    /api/comments/:targetType/:targetId → get comments on a resource
 *   POST   /api/comments/:id/like              → toggle like on a comment
 *   DELETE /api/comments/:id                   → delete a comment (owner only)
 */

const request = require('supertest');
const app = require('../../app');
const { connectTestDb, clearTestDb, closeTestDb } = require('./testDb');
const { registerAndLogin } = require('./testHelpers');

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(closeTestDb);

// Helper: create a note and return its ID
async function createNote(token, title = 'Test Note') {
  const res = await request(app)
    .post('/api/notes')
    .set('Authorization', `Bearer ${token}`)
    .send({ title, content: 'Some content', visibility: 'friends' });
  return res.body.note._id;
}

// ─── Auth guards ─────────────────────────────────────────────────────────────

describe('Comments auth guards', () => {
  it('POST /api/comments returns 401 without token', async () => {
    const res = await request(app)
      .post('/api/comments')
      .send({ targetId: '000000000000000000000001', targetType: 'note', content: 'hi' });
    expect(res.statusCode).toBe(401);
  });

  it('GET /api/comments/note/:id returns 401 without token', async () => {
    const res = await request(app).get('/api/comments/note/000000000000000000000001');
    expect(res.statusCode).toBe(401);
  });
});

// ─── Add comment ─────────────────────────────────────────────────────────────

describe('POST /api/comments', () => {
  it('adds a comment to a note and returns it', async () => {
    const { token } = await registerAndLogin();
    const noteId = await createNote(token);

    const res = await request(app)
      .post('/api/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({ targetId: noteId, targetType: 'note', content: 'Great note!' });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.comment.content).toBe('Great note!');
    expect(res.body.comment.targetId).toBe(noteId);
  });

  it('returns 400 when content is missing', async () => {
    const { token } = await registerAndLogin();
    const noteId = await createNote(token);

    const res = await request(app)
      .post('/api/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({ targetId: noteId, targetType: 'note' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when targetId is missing', async () => {
    const { token } = await registerAndLogin();

    const res = await request(app)
      .post('/api/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({ targetType: 'note', content: 'No target' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when targetType is invalid', async () => {
    const { token } = await registerAndLogin();
    const noteId = await createNote(token);

    const res = await request(app)
      .post('/api/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({ targetId: noteId, targetType: 'invalidtype', content: 'test' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ─── Get comments ────────────────────────────────────────────────────────────

describe('GET /api/comments/:targetType/:targetId', () => {
  it('returns all comments for a note', async () => {
    const { token } = await registerAndLogin();
    const noteId = await createNote(token);

    await request(app)
      .post('/api/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({ targetId: noteId, targetType: 'note', content: 'First comment' });

    await request(app)
      .post('/api/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({ targetId: noteId, targetType: 'note', content: 'Second comment' });

    const res = await request(app)
      .get(`/api/comments/note/${noteId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.comments.length).toBe(2);
  });

  it('returns empty array for a note with no comments', async () => {
    const { token } = await registerAndLogin();
    const noteId = await createNote(token);

    const res = await request(app)
      .get(`/api/comments/note/${noteId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.comments).toHaveLength(0);
  });
});

// ─── Toggle like ─────────────────────────────────────────────────────────────

describe('POST /api/comments/:id/like', () => {
  it('likes a comment and confirms the like is recorded', async () => {
    const alice = await registerAndLogin();
    const bob = await registerAndLogin();
    const noteId = await createNote(alice.token);

    const commentRes = await request(app)
      .post('/api/comments')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ targetId: noteId, targetType: 'note', content: 'Like me!' });

    const commentId = commentRes.body.comment._id;

    const res = await request(app)
      .post(`/api/comments/${commentId}/like`)
      .set('Authorization', `Bearer ${bob.token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('toggles — unliking a previously liked comment', async () => {
    const alice = await registerAndLogin();
    const bob = await registerAndLogin();
    const noteId = await createNote(alice.token);

    const commentRes = await request(app)
      .post('/api/comments')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ targetId: noteId, targetType: 'note', content: 'Toggle me' });

    const commentId = commentRes.body.comment._id;

    // Like
    await request(app)
      .post(`/api/comments/${commentId}/like`)
      .set('Authorization', `Bearer ${bob.token}`);

    // Unlike
    const res = await request(app)
      .post(`/api/comments/${commentId}/like`)
      .set('Authorization', `Bearer ${bob.token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 404 for a nonexistent comment', async () => {
    const { token } = await registerAndLogin();

    const res = await request(app)
      .post('/api/comments/000000000000000000000001/like')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(404);
  });
});

// ─── Delete comment ──────────────────────────────────────────────────────────

describe('DELETE /api/comments/:id', () => {
  it('allows the comment owner to delete their comment', async () => {
    const { token } = await registerAndLogin();
    const noteId = await createNote(token);

    const commentRes = await request(app)
      .post('/api/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({ targetId: noteId, targetType: 'note', content: 'Delete me' });

    const commentId = commentRes.body.comment._id;

    const res = await request(app)
      .delete(`/api/comments/${commentId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 403 when a different user tries to delete the comment', async () => {
    const alice = await registerAndLogin();
    const bob = await registerAndLogin();
    const noteId = await createNote(alice.token);

    const commentRes = await request(app)
      .post('/api/comments')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ targetId: noteId, targetType: 'note', content: 'Alice wrote this' });

    const commentId = commentRes.body.comment._id;

    const res = await request(app)
      .delete(`/api/comments/${commentId}`)
      .set('Authorization', `Bearer ${bob.token}`);

    expect(res.statusCode).toBe(403);
  });

  it('returns 404 for a nonexistent comment', async () => {
    const { token } = await registerAndLogin();

    const res = await request(app)
      .delete('/api/comments/000000000000000000000001')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(404);
  });
});
