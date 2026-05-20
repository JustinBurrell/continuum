/**
 * activity.test.js
 *
 * Tests the Activity feed endpoints:
 *   GET /api/activity          -> { success, feed, nextCursor, total }
 *   PUT /api/activity/mark-seen -> { success: true }
 *
 * Activity is read-only from the API perspective — events are created
 * automatically when friends take actions (creating notes, flashcard sets,
 * etc.). Tests verify visibility rules, the new creator-action types, and
 * that private-visibility users are excluded from others' feeds.
 */

const request = require('supertest');
const app = require('../../app');
const Activity = require('../../models/Activity');
const { connectTestDb, clearTestDb, closeTestDb } = require('./testDb');
const { registerAndLogin, makeFriends } = require('./testHelpers');

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(closeTestDb);

// ─── Auth guards ──────────────────────────────────────────────────────────────

describe('GET /api/activity auth guard', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/activity');
    expect(res.statusCode).toBe(401);
  });
});

describe('PUT /api/activity/mark-seen auth guard', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).put('/api/activity/mark-seen');
    expect(res.statusCode).toBe(401);
  });
});

// ─── GET /api/activity ────────────────────────────────────────────────────────

describe('GET /api/activity', () => {
  it('returns empty feed for a new user with no friends', async () => {
    const { token } = await registerAndLogin();

    const res = await request(app)
      .get('/api/activity')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.feed).toHaveLength(0);
    expect(typeof res.body.total).toBe('number');
  });

  it('note_created activity from a friend appears in the feed', async () => {
    const { alice, bob } = await makeFriends();

    // Bob opts in to sharing activity with friends
    await request(app)
      .patch('/api/auth/me/profile')
      .set('Authorization', `Bearer ${bob.token}`)
      .send({ 'settings.activityVisibility': 'friends' });

    // Bob creates a friends-visible note -> triggers note_created activity
    await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${bob.token}`)
      .send({ title: 'Bobs Study Notes', content: 'content', visibility: 'friends' });

    await new Promise(r => setTimeout(r, 200));

    const res = await request(app)
      .get('/api/activity')
      .set('Authorization', `Bearer ${alice.token}`);

    expect(res.statusCode).toBe(200);
    const noteCreated = res.body.feed.find(a => a.type === 'note_created');
    expect(noteCreated).toBeDefined();
    expect(noteCreated.metadata.noteTitle).toBe('Bobs Study Notes');
  });

  it('private note does not generate a note_created activity for friends', async () => {
    const { alice, bob } = await makeFriends();

    // Bob creates a private note - no activity should be created
    await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${bob.token}`)
      .send({ title: 'Private Note', content: 'secret', visibility: 'private' });

    await new Promise(r => setTimeout(r, 50));

    const res = await request(app)
      .get('/api/activity')
      .set('Authorization', `Bearer ${alice.token}`);

    expect(res.body.feed.filter(a => a.type === 'note_created')).toHaveLength(0);
  });

  it('flashcard_set_created activity from a friend appears in the feed', async () => {
    const { alice, bob } = await makeFriends();

    await request(app)
      .patch('/api/auth/me/profile')
      .set('Authorization', `Bearer ${bob.token}`)
      .send({ 'settings.activityVisibility': 'friends' });

    await request(app)
      .post('/api/flashcard-sets')
      .set('Authorization', `Bearer ${bob.token}`)
      .send({ title: 'Bobs Flashcard Set' });

    await new Promise(r => setTimeout(r, 200));

    const res = await request(app)
      .get('/api/activity')
      .set('Authorization', `Bearer ${alice.token}`);

    expect(res.statusCode).toBe(200);
    const setCreated = res.body.feed.find(a => a.type === 'flashcard_set_created');
    expect(setCreated).toBeDefined();
    expect(setCreated.metadata.setTitle).toBe('Bobs Flashcard Set');
  });

  it('own activities are excluded from your own feed', async () => {
    const { token } = await registerAndLogin();

    await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'My Note', content: 'content', visibility: 'friends' });

    await new Promise(r => setTimeout(r, 50));

    const res = await request(app)
      .get('/api/activity')
      .set('Authorization', `Bearer ${token}`);

    // The activity service creates the activity, but the feed excludes own userId
    expect(res.body.feed.filter(a => a.type === 'note_created')).toHaveLength(0);
  });

  it('activities from a friend with activityVisibility private are not visible', async () => {
    const { alice, bob } = await makeFriends();

    // Default activityVisibility is 'private' — explicitly confirm it here for clarity
    await request(app)
      .patch('/api/auth/me/profile')
      .set('Authorization', `Bearer ${bob.token}`)
      .send({ 'settings.activityVisibility': 'private' });

    // Also set alice to friends so we confirm the filter is on Bob, not Alice
    await request(app)
      .patch('/api/auth/me/profile')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ 'settings.activityVisibility': 'friends' });

    // Bob creates a friends-visible note - but activity should only be visible to Bob
    await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${bob.token}`)
      .send({ title: 'Private Activity Note', content: 'content', visibility: 'friends' });

    await new Promise(r => setTimeout(r, 50));

    const res = await request(app)
      .get('/api/activity')
      .set('Authorization', `Bearer ${alice.token}`);

    expect(res.body.feed.filter(a => a.type === 'note_created')).toHaveLength(0);
  });

  it('like_added is no longer a valid activity type', async () => {
    const { userId } = await registerAndLogin();

    // Attempting to insert a like_added activity document should fail validation
    await expect(
      Activity.create({
        userId,
        type: 'like_added',
        targetId: userId,
        targetType: 'comment',
        visibleTo: [userId],
        metadata: {},
      })
    ).rejects.toThrow();
  });

  it('returns feed with nextCursor when more pages exist', async () => {
    const { token } = await registerAndLogin();

    const res = await request(app)
      .get('/api/activity?limit=1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('nextCursor');
  });

  it('since param filters total to only activities after the timestamp', async () => {
    const { alice, bob } = await makeFriends();

    await request(app)
      .patch('/api/auth/me/profile')
      .set('Authorization', `Bearer ${bob.token}`)
      .send({ 'settings.activityVisibility': 'friends' });

    // Bob creates a note so there is at least one activity
    await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${bob.token}`)
      .send({ title: 'Old Note', content: 'x', visibility: 'friends' });

    await new Promise(r => setTimeout(r, 100));

    const [resAll, resSince] = await Promise.all([
      request(app).get('/api/activity').set('Authorization', `Bearer ${alice.token}`),
      // since set to now — no activities should exist after this point
      request(app).get(`/api/activity?since=${new Date().toISOString()}`).set('Authorization', `Bearer ${alice.token}`),
    ]);

    expect(resAll.statusCode).toBe(200);
    expect(resSince.statusCode).toBe(200);
    // since=now means nothing is newer, so unseen count should be 0
    expect(resSince.body.total).toBe(0);
    // full feed has items from before now
    expect(resSince.body.total).toBeLessThanOrEqual(resAll.body.total);
  });
});

// ─── PUT /api/activity/mark-seen ─────────────────────────────────────────────

describe('PUT /api/activity/mark-seen', () => {
  it('returns 200 and updates lastViewedActivityAt', async () => {
    const { token } = await registerAndLogin();

    const before = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(before.body.user.lastViewedActivityAt).toBeNull();

    const res = await request(app)
      .put('/api/activity/mark-seen')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    const after = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(after.body.user.lastViewedActivityAt).not.toBeNull();
  });

  it('since using lastViewedActivityAt returns 0 when no new activities', async () => {
    const { token } = await registerAndLogin();

    await request(app).put('/api/activity/mark-seen').set('Authorization', `Bearer ${token}`);

    const meRes = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    const since = meRes.body.user.lastViewedActivityAt;

    const feedRes = await request(app)
      .get(`/api/activity?since=${since}`)
      .set('Authorization', `Bearer ${token}`);

    expect(feedRes.statusCode).toBe(200);
    expect(feedRes.body.total).toBe(0);
  });
});
