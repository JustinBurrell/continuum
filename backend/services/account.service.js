const cloudinary = require('../config/cloudinary');
const { invalidate } = require('../lib/cache');
const User = require('../models/User');
const Note = require('../models/Note');
const FlashcardSet = require('../models/FlashcardSet');
const Task = require('../models/Task');
const Application = require('../models/Application');
const Resume = require('../models/Resume');
const Activity = require('../models/Activity');
const Comment = require('../models/Comment');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Friendship = require('../models/Friendship');
const RefreshToken = require('../models/RefreshToken');
const OAuthCode = require('../models/OAuthCode');
const SyncQueue = require('../models/SyncQueue');

// ============================================================
// ACCOUNT SERVICE
// Purpose: Shared account-level operations used by both
//          auth.controller and auth.middleware
// ============================================================

/**
 * Permanently delete a user and all associated data.
 * Called when scheduledDeletionAt has passed (lazy cascade) or
 * in any future scenario requiring immediate hard deletion.
 *
 * @param {ObjectId|string} userId
 */
async function hardDeleteUser(userId) {
    const user = await User.findById(userId);
    if (!user) return;

    // Delete Cloudinary avatar
    if (user.avatarPublicId) {
        await cloudinary.uploader.destroy(user.avatarPublicId).catch(() => {});
    }

    // Delete Cloudinary resume files
    const resumes = await Resume.find({ owner: userId }).select('cloudinaryPublicId');
    await Promise.all(
        resumes.map(r => r.cloudinaryPublicId
            ? cloudinary.uploader.destroy(r.cloudinaryPublicId, { resource_type: 'raw' }).catch(() => {})
            : Promise.resolve()
        )
    );

    // Hard delete all user-owned and user-referenced data
    await Promise.all([
        Note.deleteMany({ userId }),
        FlashcardSet.deleteMany({ owner: userId }),
        Task.deleteMany({ userId }),
        Application.deleteMany({ owner: userId }),
        Resume.deleteMany({ owner: userId }),
        Activity.deleteMany({ userId }),
        Comment.deleteMany({ userId }),
        Message.deleteMany({ sender: userId }),
        Friendship.deleteMany({ $or: [{ user1: userId }, { user2: userId }] }),
        RefreshToken.deleteMany({ userId }),
        OAuthCode.deleteMany({ userId }),
        SyncQueue.deleteMany({ userId }),
    ]);

    // Remove user from conversations and clean up empty threads
    await Conversation.updateMany({ participants: userId }, { $pull: { participants: userId } });
    await Conversation.deleteMany({ participants: { $size: 0 } });

    // Invalidate cache then remove the user document
    await invalidate(`user:${userId}`).catch(() => {});
    await User.deleteOne({ _id: userId });
}

module.exports = { hardDeleteUser };
