const FlashcardSet = require('../models/FlashcardSet');
const Flashcard = require('../models/Flashcard');
const Friendship = require('../models/Friendship');
const groqService = require('../services/groq.service');
const { createActivity, createShareActivities } = require('../services/activity.service');
const { sendShareMessage } = require('../services/share.service');

// ============================================================
// FLASHCARD SETS CONTROLLER
// Purpose: Handle business logic for flashcard set endpoints
// Used by: routes/flashcardSets.routes.js
// Endpoints: generateFromContent (API-8)
//            createSet, getSets, getSetById, deleteSet (API-9 — set CRUD)
//            addCard, updateCard, deleteCard (API-9 — card CRUD)
//            updateProgress (API-9 — study progress)
// ============================================================

// ----------------------------------------
// POST /api/flashcard-sets/generate
// Purpose: Generate AI flashcards from raw submitted content (no note required)
//   - Body: { content, title }
//   - title is optional — defaults to "Generated Flashcard Set"
//   - Creates a FlashcardSet not linked to any note (noteId: null)
//   - Bulk inserts Flashcard docs and updates totalCards
// Generated once — no regeneration
// ----------------------------------------
exports.generateFromContent = async (req, res) => {
    const { content, title } = req.body;

    if (!content || content.trim().length === 0) {
        return res.status(400).json({ success: false, error: 'Content is required to generate flashcards' });
    }

    const result = await groqService.generateFlashcards(content, req.user._id);

    // Create the FlashcardSet — not linked to any note
    const set = await FlashcardSet.create({
        userId: req.user._id,
        noteId: null,
        title: title?.trim() || 'Generated Flashcard Set',
        isAIGenerated: true,
        generatedAt: new Date(),
        totalCards: result.cards.length,
    });

    // Bulk insert all flashcard docs
    const flashcardDocs = result.cards.map((card, index) => ({
        setId: set._id,
        front: card.front,
        back: card.back,
        order: index,
    }));
    await Flashcard.insertMany(flashcardDocs);

    const populatedSet = await FlashcardSet.findById(set._id).populate('flashcards');

    res.status(201).json({ success: true, set: populatedSet });
};

// ----------------------------------------
// POST /api/flashcard-sets
// Purpose: Manually create a new flashcard set (user-created, not AI)
// Body: { title, description?, noteId? }
// ----------------------------------------
exports.createSet = async (req, res) => {
    const { title, description, noteId } = req.body;

    if (!title || title.trim().length === 0) {
        return res.status(400).json({ success: false, error: 'Title is required' });
    }

    const set = await FlashcardSet.create({
        userId: req.user._id,
        noteId: noteId || null,
        title: title.trim(),
        description: description?.trim(),
        isAIGenerated: false,
    });

    res.status(201).json({ success: true, set });
};

// ----------------------------------------
// GET /api/flashcard-sets
// Purpose: List the authenticated user's flashcard sets (AI-generated + manual)
// Excludes soft-deleted sets
// ----------------------------------------
exports.getSets = async (req, res) => {
    const sets = await FlashcardSet.find({
        userId: req.user._id,
        deletedAt: null,
    }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, sets });
};

// ----------------------------------------
// GET /api/flashcard-sets/:id
// Purpose: Get a single set with its flashcards populated
// Only accessible by the owner
// ----------------------------------------
exports.getSetById = async (req, res) => {
    const set = await FlashcardSet.findOne({
        _id: req.params.id,
        deletedAt: null,
    })
        .populate({ path: 'flashcards', match: { deletedAt: null }, options: { sort: { order: 1 } } })
        .populate('userId', 'username firstName lastName avatarUrl');

    if (!set) {
        return res.status(404).json({ success: false, error: 'Flashcard set not found' });
    }

    // Access check: owner, specific share, or friends visibility
    // set.userId is a populated object after populate() — use ._id for comparisons
    const userId = req.user._id.toString();
    const ownerId = set.userId._id ?? set.userId;
    const isOwner = ownerId.toString() === userId;
    const isSharedWith = set.sharedWith?.some(id => id.toString() === userId);
    const isFriendsVisible = set.visibility === 'friends';

    if (!isOwner && !isSharedWith) {
        if (!isFriendsVisible) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }
        const friendship = await Friendship.findOne({
            $or: [
                { user1: req.user._id, user2: ownerId },
                { user1: ownerId, user2: req.user._id },
            ],
            status: 'accepted',
            deletedAt: null,
        });
        if (!friendship) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }
    }

    res.status(200).json({ success: true, set });
};

// ----------------------------------------
// DELETE /api/flashcard-sets/:id
// Purpose: Soft delete a flashcard set
// ----------------------------------------
exports.deleteSet = async (req, res) => {
    const set = await FlashcardSet.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id, deletedAt: null },
        { deletedAt: new Date() },
        { new: true }
    );

    if (!set) {
        return res.status(404).json({ success: false, error: 'Flashcard set not found' });
    }

    res.status(200).json({ success: true, message: 'Flashcard set deleted' });
};

// ----------------------------------------
// POST /api/flashcard-sets/:id/duplicate
// Purpose: Create a personal copy of a shared set owned by the requesting user
// Access: owner or any user with read access (sharedWith or friends visibility)
// Does not copy per-card userProgress — the copy starts fresh
// ----------------------------------------
exports.duplicateSet = async (req, res) => {
    const original = await FlashcardSet.findOne({
        _id: req.params.id,
        deletedAt: null,
    }).populate({
        path: 'flashcards',
        match: { deletedAt: null },
        options: { sort: { order: 1 } },
    });

    if (!original) {
        return res.status(404).json({ success: false, error: 'Flashcard set not found' });
    }

    // Three-tier access check mirroring getSetById
    const userId = req.user._id.toString();
    const isOwner = original.userId.toString() === userId;
    const isSharedWith = original.sharedWith?.some(id => id.toString() === userId);

    if (!isOwner && !isSharedWith) {
        if (original.visibility !== 'friends') {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }
        const friendship = await Friendship.findOne({
            $or: [
                { user1: req.user._id, user2: original.userId },
                { user1: original.userId, user2: req.user._id },
            ],
            status: 'accepted',
            deletedAt: null,
        });
        if (!friendship) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }
    }

    const copy = await FlashcardSet.create({
        userId: req.user._id,
        noteId: null,
        title: `${original.title} (copy)`,
        description: original.description,
        isAIGenerated: original.isAIGenerated,
        totalCards: original.flashcards?.length || 0,
    });

    if (original.flashcards?.length > 0) {
        const cardDocs = original.flashcards.map((card, index) => ({
            setId: copy._id,
            front: card.front,
            back: card.back,
            order: index,
        }));
        await Flashcard.insertMany(cardDocs);
    }

    const populatedCopy = await FlashcardSet.findById(copy._id).populate({
        path: 'flashcards',
        match: { deletedAt: null },
        options: { sort: { order: 1 } },
    });

    res.status(201).json({ success: true, set: populatedCopy });
};

// ----------------------------------------
// POST /api/flashcard-sets/:id/cards
// Purpose: Add a card to an existing set
// Body: { front, back }
// Auto-assigns order as next position in set
// ----------------------------------------
exports.addCard = async (req, res) => {
    const { front, back } = req.body;

    if (!front || !back) {
        return res.status(400).json({ success: false, error: 'front and back are required' });
    }

    const set = await FlashcardSet.findOne({
        _id: req.params.id,
        userId: req.user._id,
        deletedAt: null,
    });

    if (!set) {
        return res.status(404).json({ success: false, error: 'Flashcard set not found' });
    }

    // Assign order as current totalCards (0-indexed next position)
    const card = await Flashcard.create({
        setId: set._id,
        front: front.trim(),
        back: back.trim(),
        order: set.totalCards,
    });

    // Increment totalCards on the set
    await FlashcardSet.findByIdAndUpdate(set._id, { $inc: { totalCards: 1 } });

    res.status(201).json({ success: true, card });
};

// ----------------------------------------
// PUT /api/flashcard-sets/:setId/cards/:cardId
// Purpose: Update a card's front and/or back text
// Body: { front?, back? }
// ----------------------------------------
exports.updateCard = async (req, res) => {
    const { front, back } = req.body;

    // Verify the set belongs to the user before touching the card
    const set = await FlashcardSet.findOne({
        _id: req.params.setId,
        userId: req.user._id,
        deletedAt: null,
    });

    if (!set) {
        return res.status(404).json({ success: false, error: 'Flashcard set not found' });
    }

    const updates = {};
    if (front) updates.front = front.trim();
    if (back) updates.back = back.trim();

    const card = await Flashcard.findOneAndUpdate(
        { _id: req.params.cardId, setId: set._id, deletedAt: null },
        updates,
        { new: true, runValidators: true }
    );

    if (!card) {
        return res.status(404).json({ success: false, error: 'Flashcard not found' });
    }

    res.status(200).json({ success: true, card });
};

// ----------------------------------------
// PUT /api/flashcard-sets/:setId/cards/:cardId/progress
// Purpose: Update study progress for the current user on a specific card
// Body: { correct: true/false, confidence?: 'low'|'medium'|'high' }
//   - correct: required — increments correctCount or incorrectCount
//   - confidence: optional — only updated if explicitly passed
//   - lastStudied: always updated to now
// Uses $set on the matched userProgress subdoc or $push if no entry exists yet
// ----------------------------------------
exports.updateProgress = async (req, res) => {
    const { correct, confidence } = req.body;

    if (typeof correct !== 'boolean') {
        return res.status(400).json({ success: false, error: 'correct (boolean) is required' });
    }

    // Verify the set belongs to the user
    const set = await FlashcardSet.findOne({
        _id: req.params.setId,
        userId: req.user._id,
        deletedAt: null,
    });

    if (!set) {
        return res.status(404).json({ success: false, error: 'Flashcard set not found' });
    }

    const card = await Flashcard.findOne({
        _id: req.params.cardId,
        setId: set._id,
        deletedAt: null,
    });

    if (!card) {
        return res.status(404).json({ success: false, error: 'Flashcard not found' });
    }

    // Find the existing userProgress entry for this user
    const progressIndex = card.userProgress.findIndex(
        (p) => p.userId.toString() === req.user._id.toString()
    );

    if (progressIndex === -1) {
        // No entry yet — create one
        const newProgress = {
            userId: req.user._id,
            lastStudied: new Date(),
            correctCount: correct ? 1 : 0,
            incorrectCount: correct ? 0 : 1,
        };
        if (confidence) newProgress.confidence = confidence;
        card.userProgress.push(newProgress);
    } else {
        // Update existing entry
        const progress = card.userProgress[progressIndex];
        progress.lastStudied = new Date();
        if (correct) progress.correctCount += 1;
        else progress.incorrectCount += 1;
        if (confidence) progress.confidence = confidence;
    }

    await card.save();

    // Update lastStudiedAt on the set
    await FlashcardSet.findByIdAndUpdate(set._id, { lastStudiedAt: new Date() });

    res.status(200).json({ success: true, card });
};

// ----------------------------------------
// PATCH /api/flashcard-sets/:id/share
// Purpose: Update a flashcard set's visibility and sharedWith list
// Body: { visibility: "private" | "friends" | "specific", sharedWith?: [userId, ...] }
// Note: visibility="specific" requires sharedWith — all listed users must be accepted friends
// Activity: fires flashcard_shared only on private → shared transition
// ----------------------------------------
exports.shareSet = async (req, res) => {
    const { visibility, sharedWith } = req.body;

    const validVisibilities = ['private', 'friends', 'specific'];
    if (!visibility || !validVisibilities.includes(visibility)) {
        return res.status(400).json({
            success: false,
            error: `visibility must be one of: ${validVisibilities.join(', ')}`,
        });
    }

    if (visibility === 'specific') {
        if (!sharedWith || sharedWith.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'sharedWith is required when visibility is "specific"',
            });
        }

        const userId = req.user._id;
        const friendships = await Friendship.find({
            $or: [{ user1: userId }, { user2: userId }],
            status: 'accepted',
            deletedAt: null,
        });

        const friendIds = new Set(
            friendships.map(f =>
                f.user1.toString() === userId.toString()
                    ? f.user2.toString()
                    : f.user1.toString()
            )
        );

        const invalidUsers = sharedWith.filter(id => !friendIds.has(id.toString()));
        if (invalidUsers.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'sharedWith can only include accepted friends',
            });
        }
    }

    // Fetch current visibility before update — detect private → shared transition
    const existing = await FlashcardSet.findOne({
        _id: req.params.id,
        userId: req.user._id,
        deletedAt: null,
    }).select('visibility');

    if (!existing) {
        return res.status(404).json({ success: false, error: 'Flashcard set not found' });
    }

    const set = await FlashcardSet.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id, deletedAt: null },
        {
            visibility,
            sharedWith: visibility === 'specific' ? sharedWith : [],
        },
        { new: true, runValidators: true }
    );

    // Create sharing activity entries
    if (visibility === 'friends') {
        createShareActivities({
            actorId: req.user._id,
            type: 'flashcard_shared',
            targetId: set._id,
            targetType: 'flashcardSet',
            metadata: { setTitle: set.title },
            shareAll: true,
        }).catch(() => {});
    } else if (visibility === 'specific' && sharedWith?.length > 0) {
        createShareActivities({
            actorId: req.user._id,
            type: 'flashcard_shared',
            targetId: set._id,
            targetType: 'flashcardSet',
            metadata: { setTitle: set.title },
            recipientIds: sharedWith,
        }).catch(() => {});
        // Send auto-message to each specific friend
        for (const recipientId of sharedWith) {
            sendShareMessage(req.user._id, recipientId, 'flashcardSet', set.title, set._id).catch(() => {});
        }
    }

    res.status(200).json({ success: true, set });
};

// ----------------------------------------
// GET /api/flashcard-sets/shared
// Purpose: List flashcard sets shared with the authenticated user by other users
// Includes:
//   - Sets with visibility="friends" owned by an accepted friend
//   - Sets with visibility="specific" where current user is in sharedWith
// Returns totalCards count but does not populate all cards (performance)
// ----------------------------------------
exports.getSharedSets = async (req, res) => {
    const userId = req.user._id;

    const friendships = await Friendship.find({
        $or: [{ user1: userId }, { user2: userId }],
        status: 'accepted',
        deletedAt: null,
    });

    const friendIds = friendships.map(f =>
        f.user1.toString() === userId.toString() ? f.user2 : f.user1
    );

    const sets = await FlashcardSet.find({
        deletedAt: null,
        userId: { $ne: userId },
        $or: [
            { visibility: 'friends', userId: { $in: friendIds } },
            { visibility: 'specific', sharedWith: userId },
        ],
    })
        .select('-sharedWith')
        .populate('userId', 'username firstName lastName')
        .sort({ createdAt: -1 });

    res.status(200).json({ success: true, sets });
};

// ----------------------------------------
// DELETE /api/flashcard-sets/:setId/cards/:cardId
// Purpose: Soft delete a card and decrement totalCards on the set
// ----------------------------------------
exports.deleteCard = async (req, res) => {
    // Verify the set belongs to the user
    const set = await FlashcardSet.findOne({
        _id: req.params.setId,
        userId: req.user._id,
        deletedAt: null,
    });

    if (!set) {
        return res.status(404).json({ success: false, error: 'Flashcard set not found' });
    }

    const card = await Flashcard.findOneAndUpdate(
        { _id: req.params.cardId, setId: set._id, deletedAt: null },
        { deletedAt: new Date() },
        { new: true }
    );

    if (!card) {
        return res.status(404).json({ success: false, error: 'Flashcard not found' });
    }

    // Keep totalCards accurate
    await FlashcardSet.findByIdAndUpdate(set._id, { $inc: { totalCards: -1 } });

    res.status(200).json({ success: true, message: 'Flashcard deleted' });
};
