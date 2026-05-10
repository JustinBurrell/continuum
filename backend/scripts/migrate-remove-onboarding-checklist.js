/**
 * Migration: remove onboardingChecklist from all users
 *
 * The onboardingChecklist field was removed from the schema.
 * This script drops the field from every existing user document.
 *
 * Safe to run multiple times — $unset is a no-op on missing fields.
 * Run once after deploying the schema change.
 *
 * Usage: node backend/scripts/migrate-remove-onboarding-checklist.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const result = await mongoose.connection.collection('users').updateMany(
        { onboardingChecklist: { $exists: true } },
        { $unset: { onboardingChecklist: '' } }
    );

    console.log(`Updated ${result.modifiedCount} user(s) — onboardingChecklist removed`);
    await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
