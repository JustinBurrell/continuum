/**
 * share.test.js
 *
 * Tests for the public share page routes:
 *   GET /share/note/:id   → HTML with OG meta tags
 *   GET /share/user/:id   → HTML with OG meta tags
 *   GET /share/task/:id   → HTML with OG meta tags
 *
 * These endpoints are public (no auth required) and return HTML pages
 * consumed by link preview crawlers (iMessage, Slack) and browser fallbacks
 * when the Android app is not installed.
 */

const request = require('supertest');
const app = require('../../app');
const { connectTestDb, closeTestDb } = require('./testDb');

beforeAll(connectTestDb);
afterAll(closeTestDb);

describe('GET /share/note/:id', () => {
  it('returns 200 with HTML content type', async () => {
    const res = await request(app).get('/share/note/abc123');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
  });

  it('includes og:title meta tag', async () => {
    const res = await request(app).get('/share/note/abc123');
    expect(res.text).toContain('og:title');
    expect(res.text).toContain('Note shared on Continuum');
  });

  it('includes og:image pointing to the Continuum OG image', async () => {
    const res = await request(app).get('/share/note/abc123');
    expect(res.text).toContain('og:image');
    expect(res.text).toContain('usecontinuum.dev/og-image.png');
  });

  it('includes canonical og:url with the note id', async () => {
    const res = await request(app).get('/share/note/abc123');
    expect(res.text).toContain('https://usecontinuum.dev/share/note/abc123');
  });

  it('works with any id without a DB lookup or 404', async () => {
    const res = await request(app).get('/share/note/nonexistent-id-xyz');
    expect(res.statusCode).toBe(200);
  });

  it('does not require an Authorization header', async () => {
    const res = await request(app).get('/share/note/abc123');
    expect(res.statusCode).not.toBe(401);
  });
});

describe('GET /share/user/:id', () => {
  it('returns 200 with HTML content type', async () => {
    const res = await request(app).get('/share/user/user123');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
  });

  it('includes og:title "Connect on Continuum"', async () => {
    const res = await request(app).get('/share/user/user123');
    expect(res.text).toContain('Connect on Continuum');
  });

  it('includes canonical og:url with the user id', async () => {
    const res = await request(app).get('/share/user/user123');
    expect(res.text).toContain('https://usecontinuum.dev/share/user/user123');
  });
});

describe('GET /share/task/:id', () => {
  it('returns 200 with HTML content type', async () => {
    const res = await request(app).get('/share/task/task123');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
  });

  it('includes og:title "Task on Continuum"', async () => {
    const res = await request(app).get('/share/task/task123');
    expect(res.text).toContain('Task on Continuum');
  });

  it('includes canonical og:url with the task id', async () => {
    const res = await request(app).get('/share/task/task123');
    expect(res.text).toContain('https://usecontinuum.dev/share/task/task123');
  });

  it('includes twitter:card meta tag', async () => {
    const res = await request(app).get('/share/task/task123');
    expect(res.text).toContain('twitter:card');
    expect(res.text).toContain('summary_large_image');
  });
});
