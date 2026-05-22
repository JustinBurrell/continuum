/**
 * google-drive.test.js
 *
 * Tests the Google Drive import/refresh endpoints under drive.file scope:
 *   POST /api/notes/import       — import a Google Doc as a note
 *   PUT  /api/notes/:id/refresh  — re-sync a note from its source Google Doc
 *   GET  /api/google/files       — removed; should return 404
 *
 * Drive API calls are fully mocked — no real Google auth required.
 * Cloudinary upload_stream is mocked to complete synchronously.
 */

const { Readable, Writable } = require('stream');
const request = require('supertest');
const app = require('../../app');
const User = require('../../models/User');
const Note = require('../../models/Note');
const { connectTestDb, clearTestDb, closeTestDb } = require('./testDb');
const { registerAndLogin } = require('./testHelpers');

// ─── Mock googleapis Drive client ────────────────────────────────────────────
jest.mock('../../config/googleDrive');
const getGoogleDriveClient = require('../../config/googleDrive');

// ─── Cloudinary mock (auto-loaded from __mocks__/cloudinary.js) ──────────────
const cloudinaryMock = require('cloudinary');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeReadable(content = 'fake pdf bytes') {
    const r = new Readable({ read() {} });
    r.push(content);
    r.push(null);
    return r;
}

function makeWritable(callback, result) {
    const ws = new Writable({ write(_chunk, _enc, done) { done(); } });
    process.nextTick(() => callback(null, result));
    return ws;
}

const CLOUDINARY_RESULT = {
    secure_url: 'https://res.cloudinary.com/test/raw/upload/test.pdf',
    public_id: 'continuum/notes/test-doc-id',
};

const mockDriveExport = jest.fn();
const mockDriveClient = { files: { export: mockDriveExport } };

/**
 * Register a user and set googleId so Drive endpoints are accessible.
 * Returns { token, userId }.
 */
async function registerAndLinkGoogle() {
    const { token, userId } = await registerAndLogin();
    await User.findByIdAndUpdate(userId, {
        googleId: 'test-google-id-123',
        googleAccessToken: 'enc-access-token',
        googleRefreshToken: 'enc-refresh-token',
        googleTokenExpiry: new Date(Date.now() + 3600 * 1000),
    });
    return { token, userId };
}

// ─── Test lifecycle ───────────────────────────────────────────────────────────

beforeAll(connectTestDb);
afterEach(async () => {
    await clearTestDb();
    jest.clearAllMocks();
});
afterAll(closeTestDb);

beforeEach(() => {
    // Default: Drive client resolves successfully
    getGoogleDriveClient.mockResolvedValue(mockDriveClient);

    // Default: export returns a stream (PDF) or arraybuffer (text)
    mockDriveExport.mockImplementation((_params, { responseType }) => {
        if (responseType === 'stream') {
            return Promise.resolve({ data: makeReadable() });
        }
        return Promise.resolve({ data: Buffer.from('Fake document text content') });
    });

    // Default: Cloudinary upload_stream completes synchronously
    cloudinaryMock.v2.uploader.upload_stream.mockImplementation((_opts, callback) => {
        return makeWritable(callback, CLOUDINARY_RESULT);
    });
});

// ─── POST /api/notes/import ───────────────────────────────────────────────────

describe('POST /api/notes/import', () => {
    it('imports a Google Doc and returns 201 with the note', async () => {
        const { token } = await registerAndLinkGoogle();

        const res = await request(app)
            .post('/api/notes/import')
            .set('Authorization', `Bearer ${token}`)
            .send({
                googleDocId: 'test-doc-id-abc',
                googleDocUrl: 'https://docs.google.com/document/d/test-doc-id-abc/edit',
                title: 'My Imported Note',
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.note.googleDocId).toBe('test-doc-id-abc');
        expect(res.body.note.title).toBe('My Imported Note');
        expect(mockDriveExport).toHaveBeenCalledTimes(2); // PDF + text
    });

    it('returns 400 when googleDocId is missing', async () => {
        const { token } = await registerAndLinkGoogle();

        const res = await request(app)
            .post('/api/notes/import')
            .set('Authorization', `Bearer ${token}`)
            .send({
                googleDocUrl: 'https://docs.google.com/document/d/some-id/edit',
                title: 'Missing ID',
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('returns 400 when googleDocUrl is missing', async () => {
        const { token } = await registerAndLinkGoogle();

        const res = await request(app)
            .post('/api/notes/import')
            .set('Authorization', `Bearer ${token}`)
            .send({
                googleDocId: 'test-doc-id-abc',
                title: 'Missing URL',
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('returns 403 when Google account is not linked', async () => {
        const { token } = await registerAndLogin(); // no googleId set

        const res = await request(app)
            .post('/api/notes/import')
            .set('Authorization', `Bearer ${token}`)
            .send({
                googleDocId: 'test-doc-id-abc',
                googleDocUrl: 'https://docs.google.com/document/d/test-doc-id-abc/edit',
                title: 'No Google Account',
            });

        expect(res.statusCode).toBe(403);
        expect(res.body.success).toBe(false);
    });

    it('returns 409 when the same Google Doc is imported twice', async () => {
        const { token } = await registerAndLinkGoogle();

        const payload = {
            googleDocId: 'duplicate-doc-id',
            googleDocUrl: 'https://docs.google.com/document/d/duplicate-doc-id/edit',
            title: 'Duplicate Doc',
        };

        await request(app)
            .post('/api/notes/import')
            .set('Authorization', `Bearer ${token}`)
            .send(payload);

        const second = await request(app)
            .post('/api/notes/import')
            .set('Authorization', `Bearer ${token}`)
            .send(payload);

        expect(second.statusCode).toBe(409);
        expect(second.body.success).toBe(false);
    });

    it('returns 403 with clean message when Drive access is revoked (Google 403)', async () => {
        const { token } = await registerAndLinkGoogle();

        mockDriveExport.mockRejectedValueOnce(
            Object.assign(new Error('Forbidden'), { code: 403 })
        );

        const res = await request(app)
            .post('/api/notes/import')
            .set('Authorization', `Bearer ${token}`)
            .send({
                googleDocId: 'revoked-doc-id',
                googleDocUrl: 'https://docs.google.com/document/d/revoked-doc-id/edit',
                title: 'Revoked',
            });

        expect(res.statusCode).toBe(403);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toMatch(/revoked/i);
        // Must not leak raw Google error structure
        expect(res.body.error).not.toMatch(/googleapis/i);
    });

    it('returns 404 with clean message when Drive file is not found (Google 404)', async () => {
        const { token } = await registerAndLinkGoogle();

        mockDriveExport.mockRejectedValueOnce(
            Object.assign(new Error('Not Found'), { code: 404 })
        );

        const res = await request(app)
            .post('/api/notes/import')
            .set('Authorization', `Bearer ${token}`)
            .send({
                googleDocId: 'deleted-doc-id',
                googleDocUrl: 'https://docs.google.com/document/d/deleted-doc-id/edit',
                title: 'Deleted Doc',
            });

        expect(res.statusCode).toBe(404);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toMatch(/not found|deleted|moved/i);
    });
});

// ─── PUT /api/notes/:id/refresh ───────────────────────────────────────────────

describe('PUT /api/notes/:id/refresh', () => {
    it('refreshes an imported note and updates lastSyncedAt', async () => {
        const { token, userId } = await registerAndLinkGoogle();

        // Create a note with a googleDocId
        const note = await Note.create({
            userId,
            title: 'Importable Note',
            content: 'Original content',
            googleDocId: 'refresh-doc-id',
            googleDocUrl: 'https://docs.google.com/document/d/refresh-doc-id/edit',
            pdfUrl: CLOUDINARY_RESULT.secure_url,
            pdfPublicId: CLOUDINARY_RESULT.public_id,
            lastSyncedAt: new Date('2024-01-01'),
        });

        const res = await request(app)
            .put(`/api/notes/${note._id}/refresh`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(new Date(res.body.note.lastSyncedAt).getTime()).toBeGreaterThan(
            new Date('2024-01-01').getTime()
        );
        expect(mockDriveExport).toHaveBeenCalledTimes(2); // PDF + text
    });

    it('returns 403 with clean message when Drive access revoked on refresh', async () => {
        const { token, userId } = await registerAndLinkGoogle();

        const note = await Note.create({
            userId,
            title: 'Revoked Note',
            content: 'content',
            googleDocId: 'revoked-refresh-id',
            googleDocUrl: 'https://docs.google.com/document/d/revoked-refresh-id/edit',
        });

        mockDriveExport.mockRejectedValueOnce(
            Object.assign(new Error('Forbidden'), { code: 403 })
        );

        const res = await request(app)
            .put(`/api/notes/${note._id}/refresh`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(403);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toMatch(/revoked/i);
    });
});

// ─── GET /api/google/files removed ───────────────────────────────────────────

describe('GET /api/google/files (removed)', () => {
    it('returns 404 — endpoint was removed in drive.file scope migration', async () => {
        const { token } = await registerAndLinkGoogle();

        const res = await request(app)
            .get('/api/google/files')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(404);
    });
});

// ─── GET /api/google/picker-page-cct — 403 HTML when not linked ──────────────

describe('GET /api/google/picker-page-cct (not connected)', () => {
    it('returns 403 with styled HTML containing continuum:// deep link when user has no googleId', async () => {
        // Register a standard user (no Google account linked)
        const { token } = await registerAndLogin();

        const res = await request(app)
            .get(`/api/google/picker-page-cct?token=${token}`);

        expect(res.statusCode).toBe(403);
        expect(res.headers['content-type']).toMatch(/html/);
        // Must contain the continuum:// deep-link so the CCT can close itself
        expect(res.text).toContain('continuum://');
        // Must not be a bare <p> tag — should be a proper HTML document
        expect(res.text).toContain('<!DOCTYPE html>');
    });

    it('returns 401 when no token query param is provided', async () => {
        const res = await request(app).get('/api/google/picker-page-cct');

        expect(res.statusCode).toBe(401);
    });
});
