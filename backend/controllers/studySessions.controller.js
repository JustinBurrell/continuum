const mongoose = require('mongoose');
const StudySession = require('../models/StudySession');
const FlashcardSet = require('../models/FlashcardSet');
const Friendship = require('../models/Friendship');
const { bulkUpdateCardProgress } = require('./flashcardSets.controller');
const { computeStreak, getCachedStreak, invalidateStreakCache } = require('../services/studyStreak.service');
const { getIO } = require('../lib/socket');
const posthog = require('../lib/posthog');

// ============================================================
// STUDY SESSIONS CONTROLLER
// Purpose: Handle business logic for study session endpoints
// Used by: routes/studySessions.routes.js
// Endpoints: submitSession (POST /api/study-sessions)
//            getUserSessions (GET /api/study-sessions)
//            getSessionsBySet (GET /api/study-sessions/set/:setId)
//            getSessionById (GET /api/study-sessions/:id)
//            getStreak (GET /api/study-sessions/streak)
// ============================================================

// ----------------------------------------
// POST /api/study-sessions
// Purpose: Submit a completed study session.
//          Creates a StudySession document, bulk-updates card progress,
//          increments FlashcardSet counters, invalidates streak cache,
//          and emits a socket event to the user's room.
// Body: { setId, durationSeconds, cardResults: [{ cardId, correct }] }
// Returns: { success, session, streak }
// ----------------------------------------
exports.submitSession = async (req, res) => {
    const { setId, durationSeconds, cardResults } = req.body;

    // Validate required fields
    if (!setId) {
        return res.status(400).json({ success: false, error: 'setId is required' });
    }
    if (typeof durationSeconds !== 'number' || durationSeconds < 0) {
        return res.status(400).json({ success: false, error: 'durationSeconds must be a non-negative number' });
    }
    if (!Array.isArray(cardResults) || cardResults.length === 0) {
        return res.status(400).json({ success: false, error: 'cardResults must be a non-empty array' });
    }

    // Validate that all cardIds are valid ObjectIds
    const invalidCardId = cardResults.find((r) => !mongoose.Types.ObjectId.isValid(r.cardId));
    if (invalidCardId) {
        return res.status(400).json({ success: false, error: `Invalid cardId: ${invalidCardId.cardId}` });
    }

    // Load the set (no populate needed — just need owner/visibility fields)
    const set = await FlashcardSet.findOne({ _id: setId, deletedAt: null });
    if (!set) {
        return res.status(404).json({ success: false, error: 'Flashcard set not found' });
    }

    // Access check: owner, sharedWith, or friends-visible (mirrors getSetById)
    const userId = req.user._id.toString();
    const isOwner = set.userId.toString() === userId;
    const isSharedWith = set.sharedWith?.some((id) => id.toString() === userId);
    const isFriendsVisible = set.visibility === 'friends';

    if (!isOwner && !isSharedWith) {
        if (!isFriendsVisible) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }
        const friendship = await Friendship.findOne({
            $or: [
                { user1: req.user._id, user2: set.userId },
                { user1: set.userId, user2: req.user._id },
            ],
            status: 'accepted',
            deletedAt: null,
        });
        if (!friendship) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }
    }

    // Compute session metrics
    const totalCards = cardResults.length;
    const correctCount = cardResults.filter((r) => r.correct).length;
    const score = Math.round((correctCount / totalCards) * 100);

    // Create session document
    const session = await StudySession.create({
        userId: req.user._id,
        setId,
        durationSeconds,
        totalCards,
        correctCount,
        score,
        cardResults,
    });

    // Bulk-update per-card userProgress
    await bulkUpdateCardProgress(setId, req.user._id, cardResults);

    // Update FlashcardSet counters
    await FlashcardSet.findByIdAndUpdate(setId, {
        lastStudiedAt: new Date(),
        $inc: { studySessionCount: 1 },
    });

    // Invalidate streak cache then compute fresh streak for the response
    invalidateStreakCache(userId);
    const streak = await computeStreak(req.user._id);

    // Emit socket event to the user's private room
    try {
        const io = getIO();
        io.to(`user:${userId}`).emit('study:session-complete', {
            sessionId: session._id.toString(),
            setId: setId.toString(),
            score,
            streak,
        });
    } catch (_) {
        // Socket not critical — swallow errors
    }

    posthog.capture({
        distinctId: userId,
        event: 'study_session_completed',
        properties: {
            platform: 'web',
            session_id: session._id.toString(),
            set_id: setId.toString(),
        },
    });

    res.status(201).json({ success: true, session, streak });
};

// ----------------------------------------
// GET /api/study-sessions/streak
// Purpose: Return the current user's study streak (cached).
// ----------------------------------------
exports.getStreak = async (req, res) => {
    const streak = await getCachedStreak(req.user._id.toString());
    res.status(200).json({ success: true, streak });
};

// ----------------------------------------
// GET /api/study-sessions
// Purpose: Paginated session history for the current user.
//          Optional ?setId= filter, ?page=, ?limit= params.
// ----------------------------------------
exports.getUserSessions = async (req, res) => {
    const { setId, page = 1, limit = 20 } = req.query;
    const filter = { userId: req.user._id };
    if (setId) filter.setId = setId;

    const skip = (Number(page) - 1) * Number(limit);

    const [rawSessions, total] = await Promise.all([
        StudySession.find(filter)
            .sort({ completedAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .populate('setId', 'title')
            .lean(),
        StudySession.countDocuments(filter),
    ]);

    // Flatten populated setId so clients (e.g. Android/Moshi) always see string id + optional title.
    // Web previously read session.setId._id / .title; now use setId + setTitle (see FlashcardHistory.jsx).
    const sessions = rawSessions.map((s) => {
        const sid = s.setId;
        if (sid && typeof sid === 'object' && sid._id != null) {
            return {
                ...s,
                setId: sid._id.toString(),
                setTitle: sid.title ?? undefined,
            };
        }
        return s;
    });

    res.status(200).json({
        success: true,
        sessions,
        total,
        page: Number(page),
        limit: Number(limit),
    });
};

// ----------------------------------------
// GET /api/study-sessions/set/:setId
// Purpose: Session history for a specific set scoped to the current user.
//          Powers the History tab in FlashcardSetDetail.
// ----------------------------------------
exports.getSessionsBySet = async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const filter = { userId: req.user._id, setId: req.params.setId };
    const skip = (Number(page) - 1) * Number(limit);

    const [sessions, total] = await Promise.all([
        StudySession.find(filter)
            .sort({ completedAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .lean(),
        StudySession.countDocuments(filter),
    ]);

    res.status(200).json({
        success: true,
        sessions,
        total,
        page: Number(page),
        limit: Number(limit),
    });
};

// ----------------------------------------
// GET /api/study-sessions/:id
// Purpose: Fetch a single session by ID including full cardResults.
//          Only the session owner can access it.
// ----------------------------------------
exports.getSessionById = async (req, res) => {
    const session = await StudySession.findById(req.params.id)
        .populate('cardResults.cardId', 'front back')
        .lean();
    if (!session) {
        return res.status(404).json({ success: false, error: 'Session not found' });
    }
    if (session.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, error: 'Access denied' });
    }
    res.status(200).json({ success: true, session });
};
