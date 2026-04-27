const SyncQueue = require('../models/SyncQueue');
const Note = require('../models/Note');
const Task = require('../models/Task');
const Flashcard = require('../models/Flashcard');
const FlashcardSet = require('../models/FlashcardSet');
const Message = require('../models/Message');
const { invalidatePattern } = require('../lib/cache');

// ============================================================
// SYNC CONTROLLER
// Purpose: Process batches of offline SyncQueue operations
// Used by: routes/sync.routes.js
// Endpoints: processSync (API-26)
// ============================================================

// ============================================================
// COLLECTION HANDLERS
// Purpose: Per-collection create/update/delete logic
// Conflict rules (mirrors standard social app behavior):
//   - create: fails on duplicate documentId (MongoDB duplicate key)
//   - update: silently completes if document not found or already deleted
//             (item is gone — the offline edit is discarded, client reconciles on next fetch)
//   - delete: idempotent — already-deleted documents are treated as success
//   - messages: create-only (messages are immutable); uses senderId not userId
// ============================================================
const handlers = {
    notes: {
        create: async (userId, _documentId, data) => {
            const { title, content, contentType, tags, subject, folder, isPinned } = data;
            return Note.create({ title, content, contentType, tags, subject, folder, isPinned, userId });
        },

        update: async (userId, documentId, data) => {
            const { title, content, contentType, tags, subject, folder, isPinned } = data;
            // Silently complete if document is gone — client will reconcile on next fetch
            await Note.findOneAndUpdate(
                { _id: documentId, userId, deletedAt: null },
                { title, content, contentType, tags, subject, folder, isPinned },
                { new: true, runValidators: true }
            );
        },

        delete: async (userId, documentId) => {
            const doc = await Note.findOne({ _id: documentId, userId });
            if (!doc) throw new Error('Document not found');
            if (doc.deletedAt) return doc; // already deleted — idempotent success
            return Note.findOneAndUpdate(
                { _id: documentId, userId },
                { deletedAt: new Date() },
                { new: true }
            );
        },
    },

    tasks: {
        create: async (userId, _documentId, data) => {
            const { title, description, dueDate, priority, type, status, duration, reminderMinutes } = data;
            return Task.create({ title, description, dueDate, priority, type, status, duration, reminderMinutes, userId });
        },

        update: async (userId, documentId, data) => {
            const { title, description, dueDate, priority, type, status, duration, reminderMinutes } = data;
            // Silently complete if document is gone — client will reconcile on next fetch
            await Task.findOneAndUpdate(
                { _id: documentId, userId, deletedAt: null },
                { title, description, dueDate, priority, type, status, duration, reminderMinutes },
                { new: true, runValidators: true }
            );
        },

        delete: async (userId, documentId) => {
            const doc = await Task.findOne({ _id: documentId, userId });
            if (!doc) throw new Error('Document not found');
            if (doc.deletedAt) return doc; // already deleted — idempotent success
            return Task.findOneAndUpdate(
                { _id: documentId, userId },
                { deletedAt: new Date() },
                { new: true }
            );
        },
    },

    flashcards: {
        // Ownership is verified through the parent FlashcardSet
        create: async (userId, _documentId, data) => {
            const { front, back, order, setId } = data;
            const set = await FlashcardSet.findOne({ _id: setId, userId, deletedAt: null });
            if (!set) throw new Error('Flashcard set not found');
            const card = await Flashcard.create({ front, back, order, setId });
            await FlashcardSet.findByIdAndUpdate(set._id, { $inc: { totalCards: 1 } });
            return card;
        },

        update: async (userId, documentId, data) => {
            const { front, back, order } = data;
            // Silently complete if card or its set is gone — client will reconcile on next fetch
            const card = await Flashcard.findOne({ _id: documentId, deletedAt: null });
            if (!card) return;
            const set = await FlashcardSet.findOne({ _id: card.setId, userId, deletedAt: null });
            if (!set) return;
            await Flashcard.findByIdAndUpdate(documentId, { front, back, order }, { new: true, runValidators: true });
        },

        delete: async (userId, documentId) => {
            const card = await Flashcard.findOne({ _id: documentId });
            if (!card) throw new Error('Document not found');
            if (card.deletedAt) return card; // already deleted — idempotent success
            const set = await FlashcardSet.findOne({ _id: card.setId, userId });
            if (!set) throw new Error('Document not found');
            await FlashcardSet.findByIdAndUpdate(set._id, { $inc: { totalCards: -1 } });
            return Flashcard.findOneAndUpdate(
                { _id: documentId },
                { deletedAt: new Date() },
                { new: true }
            );
        },
    },

    messages: {
        // Messages are immutable — only create and delete are supported
        create: async (userId, _documentId, data) => {
            if (!data.conversationId) throw new Error('conversationId is required');
            return Message.create({ ...data, senderId: userId });
        },

        update: async () => {
            throw new Error('Message updates are not supported');
        },

        delete: async (userId, documentId) => {
            const msg = await Message.findOne({ _id: documentId, senderId: userId });
            if (!msg) throw new Error('Document not found');
            if (msg.deletedAt) return msg; // already deleted — idempotent success
            return Message.findOneAndUpdate(
                { _id: documentId, senderId: userId },
                { deletedAt: new Date() },
                { new: true }
            );
        },
    },
};

// ----------------------------------------
// POST /api/sync
// Purpose: Process a batch of queued offline operations
// Body: { operations: [{ operation, collection, documentId?, data?, clientTimestamp? }] }
// Returns: per-entry success/failure results
// Each entry is tracked in the SyncQueue collection (status: completed | failed)
// ----------------------------------------
exports.processSync = async (req, res) => {
    const { operations } = req.body;

    if (!Array.isArray(operations) || operations.length === 0) {
        return res.status(400).json({ success: false, error: 'operations must be a non-empty array' });
    }

    const results = [];

    for (const op of operations) {
        const { operation, collection, documentId, data, clientTimestamp } = op;

        // Validate required fields and collection before writing to SyncQueue
        if (!operation || !collection) {
            results.push({ status: 'failed', error: 'operation and collection are required', operation, collection });
            continue;
        }

        const handler = handlers[collection];
        if (!handler) {
            results.push({ status: 'failed', error: `Collection '${collection}' is not supported`, operation, collection });
            continue;
        }

        // Write entry to SyncQueue — tracks this operation through its lifecycle
        const entry = await SyncQueue.create({
            userId: req.user._id,
            operation,
            collection,
            documentId,
            data,
            clientTimestamp,
            status: 'processing',
        });

        try {
            const handlerFn = handler[operation];
            if (!handlerFn) throw new Error(`Operation '${operation}' is not supported for '${collection}'`);

            if (operation === 'create') await handler.create(req.user._id, documentId, data);
            else if (operation === 'update') await handler.update(req.user._id, documentId, data);
            else if (operation === 'delete') await handler.delete(req.user._id, documentId);

            // Invalidate the relevant cache so subsequent reads reflect the synced change
            const userId = req.user._id.toString();
            if (collection === 'notes') await invalidatePattern(`notes:${userId}`).catch(() => {});
            else if (collection === 'tasks') await invalidatePattern(`tasks:${userId}`).catch(() => {});
            else if (collection === 'flashcards') await invalidatePattern(`flashcardSets:${userId}`).catch(() => {});
            else if (collection === 'messages') await invalidatePattern(`conversations:${userId}`).catch(() => {});

            await SyncQueue.findByIdAndUpdate(entry._id, {
                status: 'completed',
                processedAt: new Date(),
            });

            results.push({ entryId: entry._id, status: 'completed', operation, collection, documentId });
        } catch (err) {
            await SyncQueue.findByIdAndUpdate(entry._id, {
                status: 'failed',
                errorMessage: err.message,
                processedAt: new Date(),
            });

            results.push({ entryId: entry._id, status: 'failed', operation, collection, documentId, error: err.message });
        }
    }

    res.status(200).json({ success: true, results });
};
