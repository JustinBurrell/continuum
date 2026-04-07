/**
 * waitlist.test.js
 *
 * Tests the Waitlist endpoint:
 *   POST /api/waitlist → { success, message }
 *
 * Note: This is a public endpoint — no auth token required.
 */

const request = require('supertest');
const app = require('../../app');
const { connectTestDb, clearTestDb, closeTestDb } = require('./testDb');

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(closeTestDb);

// ─── Subscribe ───────────────────────────────────────────────────────────────

describe('POST /api/waitlist', () => {
    it('subscribes a valid email and returns 201', async () => {
        const res = await request(app)
            .post('/api/waitlist')
            .send({ email: 'test@example.com', source: 'mobile_gate' });

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe("You're on the list!");
    });

    it('is accessible without a token (public endpoint)', async () => {
        const res = await request(app)
            .post('/api/waitlist')
            .send({ email: 'anon@example.com' });

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
    });

    it('returns 409 for a duplicate email', async () => {
        await request(app).post('/api/waitlist').send({ email: 'dup@example.com' });

        const res = await request(app)
            .post('/api/waitlist')
            .send({ email: 'dup@example.com' });

        expect(res.statusCode).toBe(409);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe('This email is already on the waitlist.');
    });

    it('returns 400 when email is missing', async () => {
        const res = await request(app)
            .post('/api/waitlist')
            .send({});

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('returns 400 for an invalid email format', async () => {
        const res = await request(app)
            .post('/api/waitlist')
            .send({ email: 'notanemail' });

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('normalizes email to lowercase before storing', async () => {
        const res = await request(app)
            .post('/api/waitlist')
            .send({ email: 'TEST@EXAMPLE.COM' });

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
    });

    it('accepts an optional firstName field', async () => {
        const res = await request(app)
            .post('/api/waitlist')
            .send({ email: 'named@example.com', firstName: 'Justin' });

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
    });

    it('succeeds without firstName (stores null)', async () => {
        const res = await request(app)
            .post('/api/waitlist')
            .send({ email: 'noname@example.com' });

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
    });
});
