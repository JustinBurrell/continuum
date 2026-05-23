const admin = require('firebase-admin');

if (!admin.apps.length) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (raw) {
        const serviceAccount = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
        admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    }
}

module.exports = admin;
