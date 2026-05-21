/**
 * oauth-state.test.js
 *
 * Tests the OAuth source round-trip:
 *   GET  /api/auth/google?source=linking        → sets oauth_source=linking cookie
 *   GET  /api/auth/google?source=android-linking → sets oauth_source=android-linking cookie
 *   googleCallback controller                   → appends correct &source= to redirect
 *
 * Passport's Google strategy is mocked — no real Google OAuth traffic.
 */

const request = require('supertest');
const app = require('../../app');
const { connectTestDb, clearTestDb, closeTestDb } = require('./testDb');

// Intercept passport.authenticate so the /google route responds without
// attempting a real redirect to accounts.google.com.
jest.mock('../../../config/passport', () => {
    const passport = {
        use: jest.fn(),
        authenticate: jest.fn(() => (req, res) => {
            res.status(302).set('Location', 'https://accounts.google.com/mock').end();
        }),
        initialize: jest.fn(() => (req, res, next) => next()),
    };
    return passport;
});

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(closeTestDb);

// ─── Cookie tests ────────────────────────────────────────────────────────────

describe('GET /api/auth/google — oauth_source cookie', () => {
    it('sets oauth_source=linking when source=linking', async () => {
        const res = await request(app).get('/api/auth/google?source=linking');
        const cookies = res.headers['set-cookie'] || [];
        expect(cookies.some((c) => c.startsWith('oauth_source=linking'))).toBe(true);
    });

    it('sets oauth_source=android-linking when source=android-linking', async () => {
        const res = await request(app).get('/api/auth/google?source=android-linking');
        const cookies = res.headers['set-cookie'] || [];
        expect(cookies.some((c) => c.startsWith('oauth_source=android-linking'))).toBe(true);
    });

    it('does not set oauth_source cookie for unknown source values', async () => {
        const res = await request(app).get('/api/auth/google?source=unknown');
        const cookies = res.headers['set-cookie'] || [];
        expect(cookies.some((c) => c.startsWith('oauth_source='))).toBe(false);
    });

    it('does not set oauth_source cookie when source param is absent', async () => {
        const res = await request(app).get('/api/auth/google');
        const cookies = res.headers['set-cookie'] || [];
        expect(cookies.some((c) => c.startsWith('oauth_source='))).toBe(false);
    });
});

// ─── Controller redirect tests ───────────────────────────────────────────────

// Isolate the controller function directly to test the redirect URL it builds.
const authController = require('../../controllers/auth.controller');
const OAuthCode = require('../../models/OAuthCode');
const User = require('../../models/User');
const crypto = require('crypto');

async function makeCallbackReq(oauthSource) {
    const user = await User.create({
        email: 'cb-test@continuum.test',
        username: 'cbtest',
        firstName: 'CB',
        lastName: 'Test',
        googleId: 'g-cb-test',
        googleAccessToken: 'enc-token',
        googleRefreshToken: 'enc-refresh',
        googleTokenExpiry: new Date(Date.now() + 3600 * 1000),
        emailVerified: true,
    });
    const req = {
        user,
        cookies: { oauth_source: oauthSource },
    };
    const redirectTarget = { url: null };
    const res = {
        clearCookie: jest.fn(),
        redirect: jest.fn((url) => { redirectTarget.url = url; }),
    };
    await authController.googleCallback(req, res);
    return redirectTarget.url;
}

describe('googleCallback — redirect URL source param', () => {
    it('appends &source=linking when oauth_source=linking', async () => {
        const url = await makeCallbackReq('linking');
        expect(url).toContain('&source=linking');
        expect(url).not.toContain('android-linking');
    });

    it('appends &source=android-linking when oauth_source=android-linking', async () => {
        const url = await makeCallbackReq('android-linking');
        expect(url).toContain('&source=android-linking');
    });

    it('does not append source param when oauth_source is empty', async () => {
        const url = await makeCallbackReq('');
        expect(url).not.toContain('source=');
    });

    it('does not append source param when oauth_source is an unknown value', async () => {
        const url = await makeCallbackReq('unknown');
        expect(url).not.toContain('source=');
    });
});
