const mongoose = require('mongoose');

// ============================================================
// STUDY SESSION SCHEMA
// Purpose: Record a completed flashcard study session
// Collection: studysessions
// Features: Per-session score, duration, card-level results,
//           used to compute streaks and session history
// ============================================================
const studySessionSchema = new mongoose.Schema({
    /**
     * Ownership
     * Purpose: Link the session to a user and the set that was studied
     * Fields: userId, setId
     */
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    setId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FlashcardSet',
        required: true,
        index: true,
    },

    /**
     * Timing
     * Purpose: Track when the session ended and how long it lasted
     * Fields: completedAt, durationSeconds
     */
    completedAt: {
        type: Date,
        required: true,
        default: Date.now,
    },
    durationSeconds: {
        type: Number,
        required: true,
        min: 0,
    },

    /**
     * Results
     * Purpose: Store the session outcome — score, card counts, per-card breakdown
     * Fields: totalCards, correctCount, score, cardResults
     * Note: score is 0–100 (Math.round(correctCount/totalCards * 100))
     *       cardResults is optional on list reads; only fetched for detail view
     */
    totalCards: {
        type: Number,
        required: true,
        min: 1,
    },
    correctCount: {
        type: Number,
        required: true,
        min: 0,
    },
    score: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
    },
    cardResults: [{
        cardId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Flashcard',
        },
        correct: {
            type: Boolean,
        },
    }],
}, {
    timestamps: true,
});

// ============================================================
// INDEXES
// Purpose: Speed up streak queries (by user + date) and history queries
// ============================================================
studySessionSchema.index({ userId: 1, completedAt: -1 });              // user history, newest first + streak calc
studySessionSchema.index({ setId: 1, completedAt: -1 });               // set-level history
studySessionSchema.index({ userId: 1, setId: 1, completedAt: -1 });    // per-user per-set history tab

module.exports = mongoose.model('StudySession', studySessionSchema);
