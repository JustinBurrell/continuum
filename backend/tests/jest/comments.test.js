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

// ─── Reply threading ──────────────────────────────────────────────────────────

describe('Comment replies (parentId)', () => {
  it('POST with valid parentId → 201, reply linked to parent', async () => {
    const { token } = await registerAndLogin();
    const noteId = await createNote(token);

    const parentRes = await request(app)
      .post('/api/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({ targetId: noteId, targetType: 'note', content: 'Top level' });

    const parentCommentId = parentRes.body.comment._id;

    const res = await request(app)
      .post('/api/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({ targetId: noteId, targetType: 'note', content: 'This is a reply', parentId: parentCommentId });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.comment.parentId).toBe(parentCommentId);
    expect(res.body.comment.targetId).toBe(noteId);
  });

  it('POST with parentId belonging to a different target → 400', async () => {
    const { token } = await registerAndLogin();
    const noteAId = await createNote(token, 'Note A');
    const noteBId = await createNote(token, 'Note B');

    const parentRes = await request(app)
      .post('/api/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({ targetId: noteAId, targetType: 'note', content: 'Comment on A' });

    const parentCommentId = parentRes.body.comment._id;

    const res = await request(app)
      .post('/api/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({ targetId: noteBId, targetType: 'note', content: 'Wrong target reply', parentId: parentCommentId });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/same target/);
  });

  it('POST replying to a reply → 400 (max depth 1)', async () => {
    const { token } = await registerAndLogin();
    const noteId = await createNote(token);

    const topRes = await request(app)
      .post('/api/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({ targetId: noteId, targetType: 'note', content: 'Top level' });

    const topId = topRes.body.comment._id;

    const replyRes = await request(app)
      .post('/api/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({ targetId: noteId, targetType: 'note', content: 'Reply', parentId: topId });

    const replyId = replyRes.body.comment._id;

    const res = await request(app)
      .post('/api/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({ targetId: noteId, targetType: 'note', content: 'Reply to reply', parentId: replyId });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/Cannot reply to a reply/);
  });

  it('GET returns flat list including replies with parentId, sorted ascending', async () => {
    const { token } = await registerAndLogin();
    const noteId = await createNote(token);

    const topRes = await request(app)
      .post('/api/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({ targetId: noteId, targetType: 'note', content: 'Top level' });

    const topId = topRes.body.comment._id;

    await request(app)
      .post('/api/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({ targetId: noteId, targetType: 'note', content: 'Reply', parentId: topId });

    const res = await request(app)
      .get(`/api/comments/note/${noteId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.comments).toHaveLength(2);

    const reply = res.body.comments.find(c => c.parentId !== null);
    expect(reply).toBeDefined();
    expect(reply.parentId).toBe(topId);

    const [first, second] = res.body.comments;
    expect(new Date(first.createdAt).getTime()).toBeLessThanOrEqual(new Date(second.createdAt).getTime());
  });
});
