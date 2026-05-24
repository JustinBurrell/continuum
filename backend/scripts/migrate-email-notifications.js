/**
 * migrate-email-notifications.js
 *
 * One-time migration: converts the legacy scalar `settings.emailNotifications` Boolean
 * on User documents to the new per-type subdocument.
 *
 * Run after deploying the updated User schema:
 *   node backend/scripts/migrate-email-notifications.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

const ALL_TRUE = { enabled: true, smartDaily: true, weeklySummary: true };
const ALL_FALSE = { enabled: false, smartDaily: false, weeklySummary: false };

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Users with old emailNotifications: true
    const trueResult = await mongoose.connection.db.collection('users').updateMany(
        { 'settings.emailNotifications': { $type: 'bool', $eq: true } },
        { $set: { 'settings.emailNotifications': ALL_TRUE } }
    );
    console.log(`Migrated ${trueResult.modifiedCount} users (emailNotifications: true → subdocument all-true)`);

    // Users with old emailNotifications: false
    const falseResult = await mongoose.connection.db.collection('users').updateMany(
        { 'settings.emailNotifications': { $type: 'bool', $eq: false } },
        { $set: { 'settings.emailNotifications': ALL_FALSE } }
    );
    console.log(`Migrated ${falseResult.modifiedCount} users (emailNotifications: false → subdocument all-false)`);

    await mongoose.disconnect();
    console.log('Done');
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
