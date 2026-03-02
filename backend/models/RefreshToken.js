const mongoose = require('mongoose');

// ============================================================
// REFRESH TOKEN SCHEMA
// Purpose: Store long-lived refresh tokens for multi-device JWT auth
// Collection: refreshtokens
// Features: Per-device token tracking, revocation on logout,
//           bulk revocation via logout-all, 30d expiry
// Note: Raw token is NEVER stored — only SHA-256 hash.
//       Same pattern as passwordResetToken in User.js.
// ============================================================
const refreshTokenSchema = new mongoose.Schema({
    /**
     * Ownership
     * Purpose: Link the token to the user who owns it
     * Fields: userId
     */
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },

    /**
     * Token Hash
     * Purpose: Store a SHA-256 hash of the raw token for secure lookup
     * Fields: tokenHash
     * Note: Raw token is returned to client on login — never stored here.
     *       On refresh/logout, we hash the incoming token and look up by hash.
     */
    tokenHash: {
        type: String,
        required: true,
    },

    /**
     * Device Info
     * Purpose: Optionally label which device this token belongs to
     * Fields: deviceId
     * Note: Client can pass "iPhone 14" or "Chrome on Mac" at login.
     *       Used for future "manage devices" UI — not functional auth logic.
     */
    deviceId: {
        type: String,
        default: null,
    },

    /**
     * Expiry
     * Purpose: Hard expiry — token is invalid after this date regardless of revokedAt
     * Fields: expiresAt
     */
    expiresAt: {
        type: Date,
        required: true,
    },

    /**
     * Revocation
     * Purpose: Soft revocation — set on logout so token can't be reused
     * Fields: revokedAt
     * Note: null = active, Date = revoked. Both revokedAt and expiresAt must pass
     *       validation for a token to be considered valid.
     */
    revokedAt: {
        type: Date,
        default: null,
    },

}, {
    timestamps: true,
});

// ============================================================
// INDEXES
// Purpose: Speed up common queries
//
// { userId: 1, revokedAt: 1 }  — "get all active tokens for a user" (logout-all)
// { tokenHash: 1 }              — "find token by hash on refresh/logout"
// ============================================================
refreshTokenSchema.index({ userId: 1, revokedAt: 1 });
refreshTokenSchema.index({ tokenHash: 1 });

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
