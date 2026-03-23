# Pre-Deployment Checklist

## 1. Authorization
- [ ] Every protected route uses `authMiddleware`
- [ ] Controllers verify the requesting user owns or has explicit access to the resource before reading, writing, or deleting
- [ ] Shared content access checks are consistent across all controllers (owner → sharedWith → friends visibility + friendship query)
- [ ] No endpoint exposes another user's private data (notes, tasks, resumes, applications) to an unrelated user
- [ ] Admin-only routes (if any) are gated separately from regular auth

## 2. Input Validation
- [ ] All user-supplied strings are validated for type and length before hitting the database
- [ ] Mongoose schemas enforce `required`, `maxlength`, and `enum` on every field
- [ ] File uploads validate MIME type and file size on the server side (not just client side)
- [ ] ObjectId params are validated as valid ObjectIds before running queries (prevents cast errors leaking as 500s)
- [ ] No raw user input is interpolated into shell commands, file paths, or regex
- [ ] No raw user input is passed to `eval` or dynamic `require`

## 3. CORS Policy
- [ ] `CORS_ORIGIN` env var is set to the production frontend URL only (not `*`)
- [ ] CORS config is not overridden or loosened in any route-specific middleware
- [ ] Preflight (`OPTIONS`) requests are handled correctly
- [ ] Credentials (`withCredentials`) are only enabled for the specific origin

## 4. Rate Limiting
- [ ] Rate limiter is applied globally (all routes) with a sensible default (e.g., 100 req/15 min per IP)
- [ ] Auth endpoints (`/login`, `/register`, `/forgot-password`, `/reset-password`) have a tighter limit (e.g., 10 req/15 min)
- [ ] AI generation endpoints (`/summary`, `/flashcards/generate`) have a per-user limit to control API costs
- [ ] Rate limit headers are returned so clients can back off gracefully

## 5. Password Reset Security
- [ ] Reset tokens are cryptographically random (use `crypto.randomBytes`, not `Math.random`)
- [ ] Tokens are hashed before storing in the database (store the hash, send the plaintext)
- [ ] Tokens expire (e.g., 1 hour)
- [ ] Tokens are single-use (invalidated immediately after first successful use)
- [ ] Password reset response is identical whether the email exists or not (no user enumeration)
- [ ] New password is validated for minimum strength before accepting

## 6. Error Handling
- [ ] No stack traces or internal error messages are returned to the client in production
- [ ] All async controller functions are wrapped in try/catch (or a global async error handler)
- [ ] `404` is returned for missing resources (not `500` from a failed `.toString()` on null)
- [ ] MongoDB cast errors (invalid ObjectId) are caught and returned as `400`
- [ ] Unhandled promise rejections and uncaught exceptions are caught at the process level and logged

## 7. Database Indexes
- [ ] `userId` is indexed on all user-owned collections (Note, FlashcardSet, Task, Comment, etc.)
- [ ] `sharedWith` is indexed on Note and FlashcardSet for shared content queries
- [ ] Compound indexes exist for common query patterns (e.g., `{ userId: 1, deletedAt: 1 }`)
- [ ] `Comment.targetId` + `targetType` has a compound index
- [ ] `Friendship` has indexes on both `user1` and `user2`
- [ ] All indexes are verified with `db.collection.getIndexes()` before go-live

## 8. Logging
- [ ] A structured logger (e.g., `winston`, `pino`) is used — no bare `console.log` in production paths
- [ ] Every request logs: method, path, status code, response time, and user ID (if authenticated)
- [ ] Auth events are logged: login, logout, failed login attempt, password reset request
- [ ] Errors are logged with full context: route, user ID, error message, and stack trace
- [ ] Log level is configurable via env var (`LOG_LEVEL=info` in prod, `debug` in dev)
- [ ] Logs are written to a persistent sink (file, stdout to a log aggregator) — not just the terminal

## 9. Alerts
- [ ] An alert fires if the server process crashes or exits unexpectedly
- [ ] An alert fires if error rate exceeds a threshold (e.g., >5% of requests return 5xx) over a 5-minute window
- [ ] An alert fires if MongoDB connection is lost
- [ ] An alert fires if an AI provider API call fails repeatedly (OpenAI / Anthropic quota or connectivity)
- [ ] At least one team member receives alerts via email or mobile push (not just a dashboard that requires manual checking)

## 10. Rollback Strategy
- [ ] The previous release artifact (Docker image or build) is retained and can be redeployed in under 5 minutes
- [ ] Every database migration has a documented down migration or is purely additive (no destructive schema changes)
- [ ] Environment variables for the previous release are documented and recoverable
- [ ] A runbook exists that describes the exact commands to roll back to the last known-good release
- [ ] The team has practiced (or at minimum dry-run documented) the rollback procedure at least once before go-live

## 11. Secrets and Environment
- [ ] No secrets, API keys, or credentials are committed to the repository (check `.gitignore` and git history)
- [ ] All environment variables are documented in `.env.example` with placeholder values
- [ ] Production env vars are stored in a secrets manager or the hosting platform's env config — not in a plaintext file on the server
- [ ] JWT secret is at least 32 characters and randomly generated

## 12. Dependencies
- [ ] `npm audit` returns no critical or high vulnerabilities
- [ ] No dependencies are pinned to a `*` or overly broad version range in production
- [ ] `node_modules` is not committed to the repository

## 13. Final Smoke Test (pre-launch)
- [ ] Register a new account end-to-end
- [ ] Log in, log out, and Google OAuth flow all work
- [ ] Create, share, and view a shared note as a different user
- [ ] Comments, flashcard generation, and AI summary work on shared notes
- [ ] Password reset flow completes successfully
- [ ] All API calls in the browser network tab use HTTPS in production
