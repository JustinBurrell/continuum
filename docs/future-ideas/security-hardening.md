# Security Hardening — Pending Items

Derived from `docs/security/backend_security_audit.md`. These are the remaining unresolved
findings that require code changes or deliberate action before or shortly after launch.

---

## Code Changes Still Needed

### H1 (partial) — Per-User Daily AI Call Limit

**Priority:** High — must do before enabling any paid Groq/OpenAI plan

The content-length cap and resume feedback cooldown are done. The remaining layer is a
per-user per-day hard call counter. Without it, a single authenticated user can script
AI endpoints in a loop across the full day.

**Implementation:**

```js
// Before any Groq call in groq.service.js or individual controllers:
const today = new Date().toISOString().split('T')[0];
const key = `ai:${userId}:${today}`;
const count = await redis.incr(key);
if (count === 1) await redis.expire(key, 86400);
if (count > 10) {
    return res.status(429).json({ success: false, error: 'Daily AI generation limit reached' });
}
```

Requires Redis (or a lightweight in-memory counter backed by MongoDB with a TTL index
as a Redis-free alternative). The four affected endpoints:
- `POST /api/flashcard-sets/generate`
- `POST /api/notes/:id/summary`
- `POST /api/notes/:id/flashcards/generate`
- `POST /api/resumes/:id/feedback`

---

### M8 — Encrypt Google OAuth Tokens at Rest

**Priority:** Medium — before launch

`googleAccessToken` and `googleRefreshToken` are stored as plaintext in MongoDB.
`select: false` prevents accidental exposure through the API, but the raw values
sit in the database. A compromised backup or Atlas misconfiguration gives an attacker
read access to every user's Google Drive.

**Implementation option (AES-256-GCM):**

```js
// util/crypto.js
const crypto = require('crypto');
const KEY = Buffer.from(process.env.GOOGLE_TOKEN_ENCRYPTION_KEY, 'hex'); // 32 bytes

exports.encrypt = (text) => {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted.toString('hex');
};

exports.decrypt = (payload) => {
    const [ivHex, tagHex, encHex] = payload.split(':');
    const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    return decipher.update(Buffer.from(encHex, 'hex')) + decipher.final('utf8');
};
```

Encrypt before storing in `passport.js` and `googleDrive.js`; decrypt on read.
Add `GOOGLE_TOKEN_ENCRYPTION_KEY` (32 random bytes as hex) to `.env.example`.

---

### L1 (note) — Block Password Resets for Unverified Accounts

**Priority:** Low — security hardening, not a critical gap

Currently, `POST /api/auth/forgot-password` sends a reset link regardless of whether
the account email has been verified. This means someone who registered with a typo'd
email can still trigger resets — and a compromised registration (someone registers
with another person's email before they do) can use the reset flow.

**Implementation:** In `forgotPassword` in `auth.controller.js`, after finding the user:

```js
if (!user.emailVerified) {
    // Return 200 to avoid revealing whether the account exists,
    // but log it and do not send the reset email.
    console.warn(JSON.stringify({
        event: 'reset_blocked_unverified',
        userId: user._id,
        timestamp: new Date().toISOString(),
    }));
    return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a reset link has been sent.',
    });
}
```

---

### OP3 — Hard Delete Endpoint (GDPR Right to Erasure)

**Priority:** Required before any EU users

Soft deletes (`deletedAt`) do not satisfy GDPR's right to erasure. A hard delete must
permanently remove the user's account and all associated data.

**Scope of deletion:**
- `User` document
- All `Note` documents (`userId`)
- All `Task` documents (`createdBy`) — remove user from others' tasks as participant
- All `FlashcardSet` documents (`userId`)
- All `Resume` documents (`userId`) + Cloudinary cleanup
- All `Comment` documents (`userId`)
- All `Conversation` / `Message` documents (`participants`)
- All `Activity` documents (`userId` and `targetUserId`)
- All `Friendship` documents (`requester` or `recipient`)
- Cloudinary avatar if set

**Route:** `DELETE /api/users/me` (protected, requires password confirmation in body)

---

## Infrastructure / Deployment Checklist

These require no code changes — they are one-time configuration steps at deploy time.

| Item | Action | When |
|---|---|---|
| **MO1** Spend alerts | Set alerts at $10/$50 + hard monthly cap on Groq, Atlas, Cloudinary, Resend | Before any public traffic |
| **I1** Atlas static IP | Lock Network Access to server's static IP; never use `0.0.0.0/0` | First deploy |
| **I2** HTTPS | Verify `https://` + padlock after first deploy (`curl -I https://your-api/health`) | First deploy |
| **I3** NODE_ENV | Set `NODE_ENV=production` in hosting provider env dashboard | First deploy |
| **OP1** npm audit | Run `npm audit` before every production deploy; block on high/critical findings | Ongoing |
| **OP2** Key rotation | Rotate JWT_SECRET, GROQ_API_KEY, Cloudinary, Resend quarterly; Google annually | Quarterly |
| **L2** pdf-parse | Keep updated; run `npm audit` — this package parses untrusted binary input | Ongoing |
