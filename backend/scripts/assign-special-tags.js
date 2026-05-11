// assign-special-tags.js
// Backfill script: assigns `roles` to existing accounts based on
// the TEAM_EMAILS environment variable.
//
// Usage: node backend/scripts/assign-special-tags.js
//
// Idempotent — uses $addToSet so running multiple times is safe.
// Also migrates any legacy `role` (string) field to the new `roles` (array) field.
// Also strips any stale 'founder' role values left from the old system.

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Comment = require('../models/Comment');

const TEAM_EMAILS = (process.env.TEAM_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);

async function run() {
    if (!process.env.MONGODB_URI) {
        console.error('MONGODB_URI is not set. Check your .env file.');
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB.');

    // Remove stale legacy `role` field (single string) from all documents
    const cleanup = await User.updateMany({ role: { $exists: true } }, { $unset: { role: '' } });
    if (cleanup.modifiedCount) {
        console.log(`Cleaned up legacy 'role' field from ${cleanup.modifiedCount} document(s).`);
    }

    // Strip any stale 'founder' role values
    const founderStrip = await User.updateMany(
        { roles: 'founder' },
        { $pull: { roles: 'founder' } }
    );
    if (founderStrip.modifiedCount) {
        console.log(`Removed stale 'founder' role from ${founderStrip.modifiedCount} account(s).`);
    }

    if (TEAM_EMAILS.length) {
        const result = await User.updateMany(
            { email: { $in: TEAM_EMAILS } },
            { $addToSet: { roles: 'team' } }
        );
        console.log(`Team role added to ${result.modifiedCount} account(s).`);
    } else {
        console.log('No team emails configured — skipping.');
    }

    // Backfill comment userSnapshots that are missing `roles`
    const usersWithRoles = await User.find({ roles: { $exists: true, $ne: [] } }).select('_id roles');
    let commentCount = 0;
    for (const u of usersWithRoles) {
        const result = await Comment.updateMany(
            { userId: u._id, 'userSnapshot.roles': { $exists: false } },
            { $set: { 'userSnapshot.roles': u.roles } }
        );
        commentCount += result.modifiedCount;
    }
    if (commentCount) {
        console.log(`Backfilled roles into ${commentCount} comment userSnapshot(s).`);
    }

    await mongoose.disconnect();
    console.log('Done.');
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
