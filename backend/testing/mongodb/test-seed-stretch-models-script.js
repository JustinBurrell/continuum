const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/database');

// Import all models needed for this seed script
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const SyncQueue = require('../models/SyncQueue');
const Activity = require('../models/Activity');

// ============================================================
// SEED SCRIPT FOR STRETCH MODELS
// Purpose: Populate the database with test data to verify stretch models work
// Run: node backend/scripts/test-seed-stretch-models-script.js
// Tests: Conversation (participants, lastMessage, unreadCounts),
//        Message (readBy, offline sync), SyncQueue (Mixed data, status lifecycle),
//        Activity (TTL index, visibleTo, Mixed metadata)
// ============================================================

const seedDatabase = async () => {
    try {
        // Connect to MongoDB
        await connectDB();
        console.log('--- Starting stretch models seed script ---\n');

        // ========================================
        // CLEAR EXISTING TEST DATA
        // Purpose: Start fresh every time the script runs
        // Note: Order matters — clear child documents before parents
        // ========================================
        await Activity.deleteMany({});
        await SyncQueue.deleteMany({});
        await Message.deleteMany({});
        await Conversation.deleteMany({});
        await User.deleteMany({});
        console.log('Cleared existing data.\n');

        // ========================================
        // CREATE USERS
        // Purpose: Seed two test users for DM conversations and activity feed
        // ========================================
        const user1 = await User.create({
            email: 'carol@continuum.dev',
            username: 'carol',
            password: 'Test1234!',
            firstName: 'Carol',
            lastName: 'Davis',
        });

        const user2 = await User.create({
            email: 'dave@continuum.dev',
            username: 'dave',
            password: 'Test1234!',
            firstName: 'Dave',
            lastName: 'Wilson',
        });

        console.log('USERS CREATED');
        console.log('  user1:', user1._id, '|', user1.fullName);
        console.log('  user2:', user2._id, '|', user2.fullName);
        console.log();

        // ========================================
        // CREATE CONVERSATION
        // Purpose: Test the conversation model with participants and unreadCounts
        // Verify: participants array holds 2 User refs
        // Verify: unreadCounts initializes per participant
        // ========================================
        const conversation = await Conversation.create({
            participants: [user1._id, user2._id],
            unreadCounts: [
                { userId: user1._id, count: 0 },
                { userId: user2._id, count: 0 },
            ],
        });

        console.log('CONVERSATION CREATED');
        console.log('  _id:', conversation._id);
        console.log('  participants count:', conversation.participants.length);
        console.log('  participant 1:', conversation.participants[0]);
        console.log('  participant 2:', conversation.participants[1]);
        console.log('  unreadCounts:', conversation.unreadCounts.length, 'entries');
        console.log();

        // ========================================
        // CREATE MESSAGES
        // Purpose: Test the message model with content, readBy, and offline sync fields
        // Verify: Messages link to conversation and sender
        // Verify: readBy array tracks who read the message and when
        // ========================================
        const message1 = await Message.create({
            conversationId: conversation._id,
            senderId: user1._id,
            content: 'Hey Dave! Want to study for the algorithms exam together?',
            readBy: [{ userId: user1._id, readAt: new Date() }],
            syncStatus: 'synced',
        });

        const message2 = await Message.create({
            conversationId: conversation._id,
            senderId: user2._id,
            content: 'Sure! I was just reviewing graph traversal. Library at 3pm?',
            readBy: [{ userId: user2._id, readAt: new Date() }],
            syncStatus: 'synced',
        });

        console.log('MESSAGES CREATED');
        console.log('  message1:', message1._id);
        console.log('    content:', message1.content.substring(0, 50) + '...');
        console.log('    senderId:', message1.senderId);
        console.log('    readBy count:', message1.readBy.length);
        console.log('    syncStatus:', message1.syncStatus);
        console.log('  message2:', message2._id);
        console.log('    content:', message2.content.substring(0, 50) + '...');
        console.log('    senderId:', message2.senderId);
        console.log();

        // ========================================
        // UPDATE CONVERSATION lastMessage (DENORMALIZED)
        // Purpose: Test denormalized lastMessage for inbox performance
        // Verify: lastMessage caches the most recent message preview
        // ========================================
        conversation.lastMessage = {
            senderId: user2._id,
            content: message2.content.substring(0, 200),
            sentAt: new Date(),
        };
        conversation.unreadCounts[0].count = 1;  // user1 has 1 unread
        await conversation.save();

        console.log('CONVERSATION UPDATED (lastMessage)');
        console.log('  lastMessage.senderId:', conversation.lastMessage.senderId);
        console.log('  lastMessage.content:', conversation.lastMessage.content.substring(0, 50) + '...');
        console.log('  lastMessage.sentAt:', conversation.lastMessage.sentAt);
        console.log('  user1 unread count:', conversation.unreadCounts[0].count);
        console.log('  user2 unread count:', conversation.unreadCounts[1].count);
        console.log();

        // ========================================
        // MARK MESSAGE AS READ
        // Purpose: Test adding a readBy entry after the recipient opens the message
        // Verify: readBy array grows when another user reads the message
        // ========================================
        message2.readBy.push({ userId: user1._id, readAt: new Date() });
        await message2.save();

        console.log('MESSAGE READ RECEIPT');
        console.log('  message2 readBy count:', message2.readBy.length);
        console.log('  readBy[0]:', message2.readBy[0].userId, '(sender)');
        console.log('  readBy[1]:', message2.readBy[1].userId, '(recipient)');
        console.log();

        // ========================================
        // CREATE OFFLINE MESSAGE (SYNC PENDING)
        // Purpose: Test a message created while offline with clientTimestamp
        // Verify: syncStatus defaults or is set to 'pending'
        // Verify: clientTimestamp records when the message was composed offline
        // ========================================
        const offlineMessage = await Message.create({
            conversationId: conversation._id,
            senderId: user1._id,
            content: 'Sounds good! I will bring my notes on Dijkstra\'s algorithm.',
            clientTimestamp: new Date('2026-02-19T14:55:00Z'),
            syncStatus: 'pending',
        });

        console.log('OFFLINE MESSAGE CREATED');
        console.log('  _id:', offlineMessage._id);
        console.log('  syncStatus:', offlineMessage.syncStatus);
        console.log('  clientTimestamp:', offlineMessage.clientTimestamp);
        console.log();

        // ========================================
        // CREATE SYNC QUEUE ENTRY (CREATE OPERATION)
        // Purpose: Test queuing an offline create operation
        // Verify: Schema.Types.Mixed stores flexible JSON payload
        // Verify: status starts as 'pending'
        // ========================================
        const syncCreate = await SyncQueue.create({
            userId: user1._id,
            operation: 'create',
            collection: 'notes',
            documentId: new mongoose.Types.ObjectId(),
            data: {
                title: 'Graph Traversal Notes',
                content: '<p>BFS vs DFS comparison...</p>',
                contentType: 'html',
                tags: ['algorithms', 'graphs'],
            },
            status: 'pending',
            clientTimestamp: new Date('2026-02-19T14:50:00Z'),
        });

        console.log('SYNC QUEUE — CREATE OPERATION');
        console.log('  _id:', syncCreate._id);
        console.log('  operation:', syncCreate.operation);
        console.log('  collection:', syncCreate.collection);
        console.log('  status:', syncCreate.status);
        console.log('  data.title:', syncCreate.data?.title);
        console.log('  data.tags:', syncCreate.data?.tags);
        console.log('  clientTimestamp:', syncCreate.clientTimestamp);
        console.log();

        // ========================================
        // CREATE SYNC QUEUE ENTRY (UPDATE OPERATION)
        // Purpose: Test queuing an offline update operation with different payload shape
        // Verify: Mixed type accepts any JSON structure
        // ========================================
        const syncUpdate = await SyncQueue.create({
            userId: user1._id,
            operation: 'update',
            collection: 'tasks',
            documentId: new mongoose.Types.ObjectId(),
            data: {
                status: 'completed',
                completedAt: new Date(),
            },
            status: 'pending',
            clientTimestamp: new Date('2026-02-19T14:52:00Z'),
        });

        console.log('SYNC QUEUE — UPDATE OPERATION');
        console.log('  _id:', syncUpdate._id);
        console.log('  operation:', syncUpdate.operation);
        console.log('  collection:', syncUpdate.collection);
        console.log('  data.status:', syncUpdate.data?.status);
        console.log();

        // ========================================
        // PROCESS SYNC QUEUE (STATUS LIFECYCLE)
        // Purpose: Test the full sync lifecycle: pending → processing → completed/failed
        // Verify: status transitions and processedAt gets set
        // ========================================
        syncCreate.status = 'processing';
        await syncCreate.save();

        console.log('SYNC QUEUE — PROCESSING');
        console.log('  status:', syncCreate.status);

        syncCreate.status = 'completed';
        syncCreate.processedAt = new Date();
        await syncCreate.save();

        console.log('SYNC QUEUE — COMPLETED');
        console.log('  status:', syncCreate.status);
        console.log('  processedAt:', syncCreate.processedAt);

        // Test failed status with errorMessage
        syncUpdate.status = 'failed';
        syncUpdate.errorMessage = 'Task not found — document may have been deleted';
        await syncUpdate.save();

        console.log('SYNC QUEUE — FAILED');
        console.log('  status:', syncUpdate.status);
        console.log('  errorMessage:', syncUpdate.errorMessage);
        console.log();

        // ========================================
        // CREATE ACTIVITY (NOTE SHARED)
        // Purpose: Test the activity model with polymorphic target and visibleTo
        // Verify: visibleTo array controls who sees the activity
        // Verify: Mixed metadata stores flexible context
        // ========================================
        const activity1 = await Activity.create({
            userId: user1._id,
            type: 'note_shared',
            targetId: new mongoose.Types.ObjectId(),
            targetType: 'note',
            visibleTo: [user2._id],
            metadata: {
                noteTitle: 'Graph Traversal Notes',
                sharedWith: 'dave',
            },
        });

        console.log('ACTIVITY CREATED (note_shared)');
        console.log('  _id:', activity1._id);
        console.log('  type:', activity1.type);
        console.log('  targetType:', activity1.targetType);
        console.log('  visibleTo count:', activity1.visibleTo.length);
        console.log('  metadata.noteTitle:', activity1.metadata?.noteTitle);
        console.log('  createdAt:', activity1.createdAt);
        console.log();

        // ========================================
        // CREATE ACTIVITY (COMMENT ADDED)
        // Purpose: Test a different activity type with different metadata shape
        // Verify: Mixed metadata accepts any structure per activity type
        // ========================================
        const activity2 = await Activity.create({
            userId: user2._id,
            type: 'comment_added',
            targetId: new mongoose.Types.ObjectId(),
            targetType: 'comment',
            visibleTo: [user1._id],
            metadata: {
                commentPreview: 'Great explanation of BFS!',
                parentNoteTitle: 'Graph Traversal Notes',
            },
        });

        console.log('ACTIVITY CREATED (comment_added)');
        console.log('  _id:', activity2._id);
        console.log('  type:', activity2.type);
        console.log('  metadata.commentPreview:', activity2.metadata?.commentPreview);
        console.log();

        // ========================================
        // VERIFY TTL INDEX EXISTS
        // Purpose: Confirm the TTL index is registered on the Activity collection
        // Verify: An index with expireAfterSeconds: 7776000 exists on createdAt
        // ========================================
        const activityIndexes = await Activity.collection.indexes();
        const ttlIndex = activityIndexes.find(idx => idx.expireAfterSeconds !== undefined);

        console.log('TTL INDEX TEST');
        console.log('  TTL index found:', !!ttlIndex);
        if (ttlIndex) {
            console.log('  TTL field:', Object.keys(ttlIndex.key).join(', '));
            console.log('  expireAfterSeconds:', ttlIndex.expireAfterSeconds, '(90 days = 7776000)');
            console.log('  TTL matches 90 days:', ttlIndex.expireAfterSeconds === 7776000);
        }
        console.log();

        // ========================================
        // VERIFY REFERENCES (POPULATE)
        // Purpose: Test that ObjectId references actually link to real documents
        // ========================================
        const populatedConversation = await Conversation.findById(conversation._id)
            .populate('participants', 'username firstName lastName');

        console.log('POPULATE TEST');
        console.log('  Conversation participants:');
        populatedConversation.participants.forEach(p => {
            console.log('    -', p.firstName, p.lastName, '(' + p.username + ')');
        });

        const populatedMessage = await Message.findById(message1._id)
            .populate('senderId', 'username firstName lastName')
            .populate('conversationId');

        console.log('  Message sender:', populatedMessage.senderId.firstName, populatedMessage.senderId.lastName);
        console.log('  Message conversation:', populatedMessage.conversationId._id);
        console.log();

        // ========================================
        // SUMMARY
        // ========================================
        const counts = {
            users: await User.countDocuments(),
            conversations: await Conversation.countDocuments(),
            messages: await Message.countDocuments(),
            syncQueue: await SyncQueue.countDocuments(),
            activities: await Activity.countDocuments(),
        };

        console.log('DOCUMENT COUNTS');
        Object.entries(counts).forEach(([model, count]) => {
            console.log(`  ${model}: ${count}`);
        });

        console.log('\n--- Seed script complete ---');

    } catch (error) {
        console.error('Seed script failed:', error.message);
        console.error(error);
    } finally {
        // Always disconnect when done
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
    }
};

// Run the script
seedDatabase();
