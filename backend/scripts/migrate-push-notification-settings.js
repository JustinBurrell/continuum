/**
 * migrate-push-notification-settings.js
 *
 * One-time migration: converts the legacy scalar `settings.pushNotifications` Boolean
 * on User documents to the new per-type nested object.
 *
 * Run after deploying the updated User schema:
 *   node backend/scripts/migrate-push-notification-settings.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

const ALL_TRUE = {
    messages: true, comments: true, likes: true,
    friendRequests: true, tasks: true, sharedContent: true,
};

const ALL_FALSE = {
    messages: false, comments: false, likes: false,
    friendRequests: false, tasks: false, sharedContent: false,
};

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Users with old pushNotifications: true
    const trueResult = await mongoose.connection.db.collection('users').updateMany(
        { 'settings.pushNotifications': { $type: 'bool', $eq: true } },
        { $set: { 'settings.pushNotifications': ALL_TRUE } }
    );
    console.log(`Migrated ${trueResult.modifiedCount} users (pushNotifications: true → per-type all-true)`);

    // Users with old pushNotifications: false
    const falseResult = await mongoose.connection.db.collection('users').updateMany(
        { 'settings.pushNotifications': { $type: 'bool', $eq: false } },
        { $set: { 'settings.pushNotifications': ALL_FALSE } }
    );
    console.log(`Migrated ${falseResult.modifiedCount} users (pushNotifications: false → per-type all-false)`);

    await mongoose.disconnect();
    console.log('Done');
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
