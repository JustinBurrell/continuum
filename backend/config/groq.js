const Groq = require('groq-sdk');

// ============================================================
// GROQ CONFIG
// Purpose: Initialize and export the Groq client
// Used by: services/groq.service.js
// Model: llama-3.1-8b-instant
//   - 14,400 requests/day, 500K tokens/day on free tier
//   - Chosen over 70B for higher daily limits (14.4K vs 1K RPD)
// ============================================================

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

module.exports = groq;
