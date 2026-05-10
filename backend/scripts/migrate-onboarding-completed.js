/**
 * Migration: backfill onboarding fields for pre-existing users
 *
 * Sets onboardingCompleted: true, tourCompleted: true, and
 * onboardingChecklist.dismissed: true for all users created before
 * this feature ships, so the onboarding modal and checklist widget
 * never appear for them.
 *
 * Safe to run multiple times — uses $set with no destructive ops.
 * Run once after deploying the schema change, before releasing to users.
 *
 * Usage:
 *   node backend/scripts/migrate-onboarding-completed.js
 *   DEPLOY_DATE=2026-05-07T00:00:00Z node backend/scripts/migrate-onboarding-completed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

// Default cutoff: users created before this date are treated as pre-existing.
// Override via DEPLOY_DATE env var (ISO 8601) if running retroactively.
const CUTOFF = process.env.DEPLOY_DATE ? new Date(process.env.DEPLOY_DATE) : new Date();

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    console.log(`Cutoff date: ${CUTOFF.toISOString()}`);

    const result = await User.updateMany(
        {
            createdAt: { $lt: CUTOFF },
            onboardingCompleted: { $ne: true },
        },
        {
            $set: {
                onboardingCompleted: true,
                tourCompleted: true,
                'onboardingChecklist.dismissed': true,
            },
        }
    );

    console.log(`Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);
    await mongoose.disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });
