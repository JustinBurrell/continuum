// E2E backend server — used exclusively by Playwright's webServer config.
// Sets env vars BEFORE requiring app so no real external services are called.
// Same env var values as tests/jest/setup.js — keep in sync if new keys are added.

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'e2e-test-secret-not-real';
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.GOOGLE_CLIENT_ID = 'e2e-test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'e2e-test-google-client-secret';
process.env.RESEND_API_KEY = 'e2e-test-resend-key';
process.env.RESEND_DISABLED = 'true'; // prevent real email sends during E2E
process.env.GROQ_API_KEY = 'e2e-test-groq-key';
process.env.CLOUDINARY_CLOUD_NAME = 'e2e-test-cloud';
process.env.CLOUDINARY_API_KEY = 'e2e-test-cloudinary-key';
process.env.CLOUDINARY_API_SECRET = 'e2e-test-cloudinary-secret';

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const http = require('http');

async function start() {
    const mongod = await MongoMemoryServer.create();
    process.env.MONGO_URI = mongod.getUri();

    // Require app AFTER MONGO_URI is set so Passport and any module-level
    // DB references resolve correctly. app.js exports Express without calling
    // listen() or connectDB() — this file owns both.
    const app = require('../../app');
    await mongoose.connect(process.env.MONGO_URI);

    const server = http.createServer(app);
    server.listen(5001, () => {
        console.log('[E2E] Backend running on :5001');
    });

    // Playwright sends SIGTERM to the webServer process when all tests finish.
    process.on('SIGTERM', async () => {
        server.close();
        await mongoose.disconnect();
        await mongod.stop();
        process.exit(0);
    });
}

start().catch((err) => {
    console.error('[E2E] Failed to start backend:', err);
    process.exit(1);
});
