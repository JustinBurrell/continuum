const mongoose = require('mongoose');

// ============================================================
// OAuthCode model
// Purpose: Store short-lived one-time codes for the Google OAuth callback
//          Prevents the JWT from ever appearing in a URL, browser history, or server logs
// Flow:    googleCallback generates a code → stores hash here → redirects with raw code
//          POST /auth/google/exchange validates code → deletes it → returns JWT
// TTL:     MongoDB auto-deletes documents after expiresAt (via TTL index)
// ============================================================

const oauthCodeSchema = new mongoose.Schema({
    codeHash: { type: String, required: true, unique: true },
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    used:     { type: Boolean, default: false },
    expiresAt:{ type: Date, required: true },
}, { timestamps: false });

// Auto-delete expired documents — MongoDB TTL index
oauthCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('OAuthCode', oauthCodeSchema);
