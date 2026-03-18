# Demo Seed Script — Complete Implementation Guide

This is the **sole source of truth**. Read this file, implement section by section. No grepping needed.

Target account: `justinburrell715@gmail.com`
All dates: **January 20 – April 30, 2026**
Resumes and Google Docs: excluded (require real files / live OAuth tokens)

---

## Files to Create

```
backend/scripts/seed.js        # main runner (orchestrator)
backend/scripts/seed-data.js   # all static content: note bodies, messages, task arrays, etc.
```

Run with:
```bash
node backend/scripts/seed.js           # idempotent — skips if seed data already exists
node backend/scripts/seed.js --clean   # wipes all seed data and reseeds fresh
node backend/scripts/seed.js --no-ai   # skips Groq calls, uses static fallback content
```

---

## Imports & Setup (seed.js top)

```js
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const { User, Note, FlashcardSet, Flashcard, Task, Application, Friendship, Conversation, Message, Comment, Activity } = require('../models');
const { generateSummary, generateFlashcards } = require('../services/groq.service');
const seedData = require('./seed-data');

const CLEAN = process.argv.includes('--clean');
const NO_AI = process.argv.includes('--no-ai');
```

---

## Model Schemas (Required Fields Reference)

Use these when building `.create()` calls. Fields marked **required** will throw if missing.

### User
```
email: String (required, unique, lowercase)
username: String (required, unique)
password: String (required if no googleId — min 8 chars, must have letter+number+special)
firstName: String (required)
lastName: String (required)
avatarUrl: String
bio: String
settings.activityVisibility: 'private' | 'friends' | 'public' (default: 'private')
```
Pre-save hook auto-hashes password with bcrypt.

### Note
```
userId: ObjectId (required, ref: User)
title: String (max 200)
content: String (max 200000)
contentType: 'html' | 'markdown' | 'plain'
type: 'general' | 'lecture' | 'research' | 'todo' | 'journal' (default: 'general')
tags: [String] (lowercase)
subject: String
folder: String (default: 'default')
visibility: 'private' | 'friends' | 'specific' (default: 'private')
sharedWith: [ObjectId] (ref: User — used when visibility is 'specific')
summary.quickSummary: String
summary.detailedSummary: String
summary.generatedAt: Date
summary.model: String
summary.tokenCount: Number
hasFlashcards: Boolean (default: false)
isPinned: Boolean (default: false)
```

### FlashcardSet
```
userId: ObjectId (required, ref: User)
noteId: ObjectId (ref: Note, default: null)
title: String (max 200)
description: String (max 1000)
totalCards: Number (default: 0)
visibility: 'private' | 'friends' | 'specific' (default: 'private')
sharedWith: [ObjectId]
isAIGenerated: Boolean (default: false)
generatedAt: Date
lastStudiedAt: Date
studySessionCount: Number (default: 0)
```

### Flashcard
```
setId: ObjectId (required, ref: FlashcardSet)
front: String (required)
back: String (required)
order: Number
userProgress: [{ userId, lastStudied, correctCount, incorrectCount, confidence: 'low'|'medium'|'high' }]
```

### Task
```
userId: ObjectId (required, ref: User)
title: String (max 200)
description: String (max 2000)
dueDate: Date (required)
duration: Number (default: 60, minutes)
type: 'homework' | 'study' | 'project' | 'exam' | 'club' | 'professional' | 'personal' | 'other'
priority: 'low' | 'medium' | 'high'
status: 'todo' | 'in_progress' | 'completed' (default: 'todo')
isShared: Boolean (default: false)
participants: [{ userId, status, completedAt }]
completedAt: Date
```
**IMPORTANT**: Pre-save hook auto-sets `completedAt` when `status` changes to `'completed'`. For seeding completed tasks, use `new Task({...})` then `task.status = 'completed'` then `await task.save()` — OR just set `completedAt` manually and use `Task.create()` but note `.create()` triggers hooks too. Simplest: use `Task.create()` with `status: 'completed'` and let the hook set `completedAt`. BUT the hook checks `this.isModified('status')` — on new docs, all fields are "modified", so it WILL fire. So just set `status: 'completed'` and the hook handles `completedAt`.

### Application
```
userId: ObjectId (required, ref: User)
company: String (required)
position: String (required)
location: String
salary: String
jobUrl: String
status: 'draft' | 'applied' | 'interview' | 'offer' | 'rejected' | 'withdrawn' (default: 'draft')
appliedAt: Date
interviewDates: [Date]
offerReceivedAt: Date
deadlineDate: Date
contacts: [{ name, role, email, linkedIn, lastContactDate, notes }]
notes: String (max 5000)
followUpReminders: [{ date, description, completed }]
```

### Friendship
```
user1: ObjectId (required, ref: User)
user2: ObjectId (required, ref: User)
requestedBy: ObjectId (required, ref: User)
status: 'pending' | 'accepted' | 'rejected' | 'blocked' (default: 'pending')
requestedAt: Date
respondedAt: Date
```
**Pre-save hook auto-sorts user1/user2** so user1 < user2. Just pass both IDs in any order.

### Conversation
```
participants: [ObjectId] (ref: User — always 2 for DMs)
lastMessage: { senderId, content (max 200), sentAt }
unreadCounts: [{ userId, count }]
```

### Message
```
conversationId: ObjectId (required, ref: Conversation)
senderId: ObjectId (required, ref: User)
content: String (required, max 5000)
readBy: [{ userId, readAt }]
```

### Comment
```
targetId: ObjectId (required — the note or flashcardSet _id)
targetType: 'note' | 'flashcardSet' | 'task' (required)
userId: ObjectId (required, ref: User)
content: String (required, max 2000)
likes: [ObjectId] (ref: User)
```
**Pre-save hook auto-populates `userSnapshot`** (username, firstName, lastName, avatarUrl) from User on `.isNew`. Just call `Comment.create()` normally.

### Activity
```
userId: ObjectId (required, ref: User)
type: 'note_shared' | 'flashcard_shared' | 'task_created' | 'comment_added' | 'like_added' (required)
targetId: ObjectId (required)
targetType: 'note' | 'flashcardSet' | 'task' | 'comment' (required)
visibleTo: [ObjectId] (ref: User — the friends who see this in their feed)
isPublic: Boolean (default: false)
metadata: Mixed (any JSON — e.g. { noteTitle: '...', commentPreview: '...' })
createdAt: Date (default: Date.now — has 90-day TTL index)
```

---

## Groq AI Integration

Import from: `require('../services/groq.service')`

**`generateSummary(content, userId)`** — returns `{ quickSummary, detailedSummary, model, tokenCount }`
**`generateFlashcards(content, userId)`** — returns `{ cards: [{ front, back }], model, tokenCount }`

### Rate limit strategy
- 500ms delay between each Groq call (`await new Promise(r => setTimeout(r, 500))`)
- Wrap every call in try/catch — fall back to static content from `seed-data.js` on failure
- `--no-ai` flag skips all Groq calls entirely, uses static fallbacks

---

## Execution Order (seed.js main function)

```js
async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // 1. Find Justin — abort if not found
  const justin = await User.findOne({ email: 'justinburrell715@gmail.com' });
  if (!justin) { console.error('Justin not found — register first'); process.exit(1); }

  // 2. Idempotency check
  const existing = await Note.findOne({ userId: justin._id, title: 'Dynamic Programming: From Recursion to Optimization' });
  if (existing && !CLEAN) { console.log('Seed data already exists. Use --clean to reseed.'); process.exit(0); }

  // 3. If --clean, wipe all seed data
  if (CLEAN) { await cleanSeedData(justin._id); }

  // 4-15: Run each section (see below)
  await seedFriends(justin);
  await seedFriendships(justin);
  await seedJustinNotes(justin);
  await seedFriendNotes(/* friends, justin */);
  await seedJustinFlashcardSets(justin);
  await seedFriendFlashcardSets(/* friends, justin */);
  await seedTasks(justin);
  await seedApplications(justin);
  await seedConversations(/* justin, friends */);
  await seedComments(/* justin, friends, notes, sets */);
  await seedActivities(/* justin, friends, notes, sets */);

  // Update Justin's activity visibility
  await User.updateOne({ _id: justin._id }, { 'settings.activityVisibility': 'friends' });

  console.log('Seed complete!');
  await mongoose.disconnect();
}
```

### Clean function
When `--clean`, delete all data created by this seed. Look up the 6 seed friend usernames, get their IDs, then delete:
- All Notes, FlashcardSets, Flashcards, Tasks, Applications, Comments, Activities, Messages, Conversations where userId or relevant field matches justin._id OR any seed friend ID
- All Friendships involving justin._id and seed friend IDs
- The 6 seed User documents themselves (NOT Justin)

---

## SECTION 1: Seed Users (6 Friends)

All passwords: `Demo@1234`
All get `settings.activityVisibility: 'friends'`

For each user, use `User.findOneAndUpdate({ username }, { ...userData }, { upsert: true, new: true })` for idempotency.

```js
const SEED_FRIENDS = [
  {
    username: 'alexchen_cs',
    email: 'alexchen_demo@example.com',
    password: 'Demo@1234',
    firstName: 'Alex',
    lastName: 'Chen',
    bio: 'CS sophomore obsessed with algorithms and competitive programming. ACM member, LeetCode grinder, aspiring SWE intern.',
    settings: { activityVisibility: 'friends' },
  },
  {
    username: 'mayapatel_ds',
    email: 'mayapatel_demo@example.com',
    password: 'Demo@1234',
    firstName: 'Maya',
    lastName: 'Patel',
    bio: 'Data Science & Stats junior. Python, pandas, and a lot of coffee. Research assistant in the ML lab.',
    settings: { activityVisibility: 'friends' },
  },
  {
    username: 'jordanwilliams',
    email: 'jordanwilliams_demo@example.com',
    password: 'Demo@1234',
    firstName: 'Jordan',
    lastName: 'Williams',
    bio: 'Senior in Computer Engineering. Building embedded systems and debating hardware vs software career paths.',
    settings: { activityVisibility: 'friends' },
  },
  {
    username: 'priyasharma',
    email: 'priyasharma_demo@example.com',
    password: 'Demo@1234',
    firstName: 'Priya',
    lastName: 'Sharma',
    bio: 'Pre-med sophomore. Bio major with a minor in chemistry. MCAT prep starts this summer.',
    settings: { activityVisibility: 'friends' },
  },
  {
    username: 'marcusjohnson',
    email: 'marcusjohnson_demo@example.com',
    password: 'Demo@1234',
    firstName: 'Marcus',
    lastName: 'Johnson',
    bio: 'Finance junior eyeing investment banking. Excel wizard, DCF enthusiast, networking machine.',
    settings: { activityVisibility: 'friends' },
  },
  {
    username: 'sofiarod',
    email: 'sofiarod_demo@example.com',
    password: 'Demo@1234',
    firstName: 'Sofia',
    lastName: 'Rodriguez',
    bio: 'Psych junior interested in cognitive science and UX research. Applying to grad school this fall.',
    settings: { activityVisibility: 'friends' },
  },
];
```

**IMPORTANT about User.create with password**: The pre-save hook will hash the password. For `findOneAndUpdate` with upsert, the hook does NOT run. You must either:
- Use `new User(data)` + `await user.save()` so the hook hashes the password, OR
- Hash the password manually before upsert with `bcrypt.hashSync('Demo@1234', 12)`

Recommended approach: check if user exists by username, if not `new User(data)` + `.save()`. If exists, skip (don't re-create).

---

## SECTION 2: Friendships (Justin <-> each friend)

Create 6 friendships, all `status: 'accepted'`. The pre-save hook sorts user1/user2.

```js
for (const friend of friends) {
  const existing = await Friendship.findOne({
    $or: [
      { user1: justin._id, user2: friend._id },
      { user1: friend._id, user2: justin._id },
    ],
  });
  if (!existing) {
    const f = new Friendship({
      user1: justin._id,
      user2: friend._id,
      requestedBy: justin._id,
      status: 'accepted',
      requestedAt: new Date('2026-01-21'),
      respondedAt: new Date('2026-01-22'),
    });
    await f.save();
  }
}
```

Also create **friendships among the seed friends** so the friend feed looks natural:
- Alex <-> Maya, Alex <-> Jordan, Maya <-> Priya, Marcus <-> Sofia, Jordan <-> Marcus
(5 inter-friend friendships, all accepted)

---

## SECTION 3: Justin's Notes (25 total)

Put ALL note content in `seed-data.js`. Each note needs a `content` field with 300-800 words of realistic academic content in **markdown** format (`contentType: 'markdown'`).

### Note list with metadata

```js
// In seed-data.js, export an array: module.exports.justinNotes = [...]
// Each entry:
{
  title: 'Dynamic Programming: From Recursion to Optimization',
  type: 'lecture',
  tags: ['algorithms', 'dynamic-programming', 'cs211'],
  subject: 'CS 211 — Data Structures & Algorithms',
  content: `# Dynamic Programming: From Recursion to Optimization\n\n## What is Dynamic Programming?\n...`, // 300-800 words markdown
  visibility: 'friends',  // or 'private' or 'specific'
  sharedWith: [],          // only populated if visibility === 'specific'
  isPinned: false,
  // For AI notes (indices 0-9): summary fallbacks + flashcard fallbacks below
}
```

### Full note list (index, title, type, visibility, tags, subject):

| # | Title | Type | Visibility | Tags | Subject |
|---|-------|------|-----------|------|---------|
| 0 | Dynamic Programming: From Recursion to Optimization | lecture | friends | algorithms, dynamic-programming, cs211 | CS 211 |
| 1 | OS Process Scheduling Algorithms (FCFS, SJF, Round Robin, Priority) | lecture | specific (sharedWith: all 6 friends) | operating-systems, scheduling, cs301 | CS 301 |
| 2 | Computer Networks: TCP/IP Stack and HTTP | lecture | specific (sharedWith: all 6 friends) | networking, tcp-ip, cs350 | CS 350 |
| 3 | Database Systems: Indexing, Query Optimization, and Transactions | lecture | private | databases, sql, cs340 | CS 340 |
| 4 | Compilers: Lexing, Parsing, and Semantic Analysis | lecture | private | compilers, parsing, cs320 | CS 320 |
| 5 | Neural Networks & Deep Learning: Architecture Overview | research | friends | machine-learning, neural-networks, deep-learning | Research |
| 6 | Distributed Systems: CAP Theorem and Consistency Models | research | friends | distributed-systems, cap-theorem | Research |
| 7 | Cryptography: Public Key Infrastructure and TLS | research | private | cryptography, security, tls | Research |
| 8 | Quantum Computing: Qubits, Superposition, and Grover's Algorithm | research | private | quantum-computing, algorithms | Research |
| 9 | Graph Algorithms: Dijkstra, Bellman-Ford, and A* | research | private | algorithms, graphs, shortest-path | CS 211 |
| 10 | Technical Interview Preparation Guide | general | friends | interviews, career, leetcode | Career |
| 11 | React Hooks: Patterns and Best Practices | general | private | react, javascript, frontend | Side Projects |
| 12 | Git Workflow and Branching Strategies | general | private | git, version-control, workflow | Tools |
| 13 | System Design Primer: Scalability Fundamentals | general | friends | system-design, scalability, architecture | Career |
| 14 | UNIX Command Line Toolkit | general | private | unix, linux, cli, bash | Tools |
| 15 | Finals Week Study Plan | todo | private | study-plan, finals, spring-2026 | Planning |
| 16 | Internship Application Checklist — Spring 2026 | todo | private | internships, applications, career | Career |
| 17 | Group Project Task Breakdown: Distributed KV Store | todo | private | project, distributed-systems, team | CS 301 |
| 18 | Week 9 Action Items | todo | private | weekly, tasks, spring-2026 | Planning |
| 19 | Summer Prep Roadmap | todo | private | summer, career, learning | Planning |
| 20 | Week 3 Reflection — Adjusting to Spring Semester | journal | private | reflection, journal, spring-2026 | Personal |
| 21 | Week 6 Reflection — Midterm Season Hits Different | journal | private | reflection, journal, midterms | Personal |
| 22 | Week 8 Reflection — Progress and Setbacks | journal | private | reflection, journal, spring-2026 | Personal |
| 23 | Week 11 Reflection — Internship Offer and What It Means | journal | private | reflection, journal, career | Personal |
| 24 | Week 14 Reflection — End of Semester Thoughts | journal | private | reflection, journal, spring-2026 | Personal |

### AI summaries (notes 0-9: lecture + research)
- If `--no-ai` or Groq fails: use static fallback `quickSummary` and `detailedSummary` from seed-data.js
- If AI enabled: call `generateSummary(note.content, justin._id)` with 500ms delay between calls
- Set `summary.generatedAt = new Date()`, `summary.model` and `summary.tokenCount` from response

### Notes with specific sharing (visibility: 'specific', sharedWith: all 6 friend IDs)
Notes at index 1 and 2.

### Notes with hasFlashcards = true
Notes at indices 0-5 and 7-9 (the 10 that get AI flashcard sets — see Section 5).

### createdAt spread
Space `createdAt` dates across Jan 20 – Mar 15 for lecture/research, Mar–Apr for todo/journal. Use `Note.create()` — then update `createdAt` with `Note.updateOne({ _id }, { createdAt: date })` since timestamps auto-set on create.

---

## SECTION 4: Friends' Shared Notes (30 total — 5 per friend)

Each friend creates 5 notes. All `visibility: 'friends'`, `contentType: 'markdown'`.
Put all content in `seed-data.js` as `module.exports.friendNotes = { alexchen_cs: [...], mayapatel_ds: [...], ... }`.
Each note needs 200-500 words of realistic content in their discipline.

### Alex Chen (CS)
1. Big-O Complexity Guide — tags: [algorithms, big-o, complexity]
2. Sorting Algorithms Comparison — tags: [algorithms, sorting]
3. Binary Search Trees Deep Dive — tags: [data-structures, trees, bst]
4. Recursion Patterns — tags: [algorithms, recursion]
5. C++ vs Java for Interviews — tags: [interviews, c++, java]

### Maya Patel (Data Science)
1. Pandas & NumPy Cheat Sheet — tags: [python, pandas, numpy]
2. Statistics for ML — tags: [statistics, machine-learning]
3. Data Visualization Best Practices — tags: [visualization, data-science]
4. Linear Regression Explained — tags: [statistics, regression, ml]
5. Python for Data Analysis — tags: [python, data-analysis]

### Jordan Williams (Computer Engineering)
1. Digital Logic & Circuit Design — tags: [digital-logic, circuits, hardware]
2. Embedded Systems with Arduino — tags: [embedded, arduino, hardware]
3. Memory Hierarchy and Caching — tags: [memory, caching, architecture]
4. ARM Assembly Basics — tags: [assembly, arm, low-level]
5. Hardware vs Software Tradeoffs — tags: [career, engineering, hardware]

### Priya Sharma (Pre-Med / Biology)
1. Organic Chemistry Reaction Mechanisms — tags: [organic-chemistry, reactions]
2. MCAT Study Strategy — tags: [mcat, pre-med, study-tips]
3. Biochemistry: Enzyme Kinetics — tags: [biochemistry, enzymes]
4. Research Methods in Biology — tags: [research-methods, biology]
5. Medical School Application Timeline — tags: [med-school, applications]

### Marcus Johnson (Business Finance)
1. Investment Banking Recruiting Guide — tags: [finance, recruiting, ib]
2. Financial Modeling Basics — tags: [finance, modeling, excel]
3. Valuation Methods (DCF, Comps, Precedents) — tags: [valuation, dcf, finance]
4. Excel Shortcuts for Finance — tags: [excel, productivity, finance]
5. Networking in Finance — tags: [networking, career, finance]

### Sofia Rodriguez (Psychology)
1. Cognitive Psychology: Memory & Learning — tags: [cognitive-psych, memory, learning]
2. Research Design and Statistics — tags: [research, statistics, psychology]
3. Abnormal Psychology Overview — tags: [abnormal-psych, mental-health]
4. Neuroscience Basics — tags: [neuroscience, brain, psychology]
5. Graduate School Application Tips — tags: [grad-school, applications, career]

---

## SECTION 5: Justin's Flashcard Sets (20 total)

### AI-generated sets (10) — linked to notes

For each: create FlashcardSet, then create Flashcard docs.
- If AI enabled: call `generateFlashcards(sourceNote.content, justin._id)` — returns `{ cards: [{front, back}] }`
- If `--no-ai` or failure: use static fallback cards from seed-data.js (10 cards per set)
- Set `isAIGenerated: true`, `generatedAt: new Date()`
- Set `totalCards` to the number of cards created
- Update the source note: `hasFlashcards: true`

| Set # | Title | Source Note Index | Visibility |
|-------|-------|------------------|-----------|
| 1 | Dynamic Programming Concepts | 0 | friends |
| 2 | OS Scheduling Algorithms | 1 | friends |
| 3 | Neural Network Key Terms | 5 | friends |
| 4 | Distributed Systems Vocab | 6 | friends |
| 5 | TCP/IP and Networking | 2 | friends |
| 6 | Database Systems Review | 3 | friends |
| 7 | Cryptography Basics | 7 | friends |
| 8 | Graph Algorithm Vocab | 9 | friends |
| 9 | Compiler Terminology | 4 | private |
| 10 | Quantum Computing Intro Terms | 8 | friends |

### Manual sets (10) — no linked note

For each: create FlashcardSet with `isAIGenerated: false`, `noteId: null`.
Create 8-12 hardcoded flashcards per set in seed-data.js.

| Set # | Title | Visibility |
|-------|-------|-----------|
| 11 | Data Structures Quick Reference | friends |
| 12 | SQL Interview Questions | friends |
| 13 | Big-O Cheat Sheet | friends |
| 14 | OOP Design Patterns | private |
| 15 | Git Commands Reference | friends |
| 16 | React Core Concepts | friends |
| 17 | UNIX / Linux Commands | private |
| 18 | System Design Patterns | friends |
| 19 | Python Built-ins Cheat Sheet | private |
| 20 | Interview Behavioral Questions | friends |

---

## SECTION 6: Friends' Flashcard Sets (18 total — 3 per friend)

Each friend creates 3 flashcard sets, all `visibility: 'friends'`, `isAIGenerated: false`.
8-10 hardcoded cards per set in seed-data.js.

### Alex Chen
1. Sorting Algorithms — 10 cards
2. Tree Traversal Methods — 8 cards
3. Recursion Patterns — 8 cards

### Maya Patel
1. Statistics Key Terms — 10 cards
2. ML Algorithm Overview — 8 cards
3. Python Data Science Toolkit — 10 cards

### Jordan Williams
1. Digital Logic Gates — 8 cards
2. Memory Hierarchy Terms — 8 cards
3. ARM Assembly Instructions — 8 cards

### Priya Sharma
1. Organic Chemistry Reactions — 10 cards
2. Biochem Key Enzymes — 8 cards
3. MCAT Vocab — 10 cards

### Marcus Johnson
1. Finance Interview Questions — 10 cards
2. Financial Ratios — 8 cards
3. Valuation Methods — 8 cards

### Sofia Rodriguez
1. Psych Research Methods — 8 cards
2. Cognitive Psychology Terms — 10 cards
3. Neuroscience Basics — 8 cards

---

## SECTION 7: Justin's Tasks (52 total)

All created via `Task.create()`. The pre-save hook handles `completedAt` for completed tasks.

### homework (8)
```js
{ title: 'Submit Assignment 1: Big-O Analysis', type: 'homework', status: 'completed', priority: 'high', dueDate: '2026-01-28', description: 'Analyze time/space complexity of 5 algorithms. Submit on Gradescope.' },
{ title: 'Submit Assignment 2: Linked List Implementation', type: 'homework', status: 'completed', priority: 'high', dueDate: '2026-02-10', description: 'Implement singly and doubly linked lists in Java with iterator support.' },
{ title: 'Submit Assignment 3: Red-Black Trees', type: 'homework', status: 'completed', priority: 'high', dueDate: '2026-02-24', description: 'Implement insert and delete for red-black trees. Include balancing rotations.' },
{ title: 'Submit Assignment 4: DP Coin Change', type: 'homework', status: 'in_progress', priority: 'high', dueDate: '2026-03-20', description: 'Solve coin change with memoization and tabulation. Compare approaches.' },
{ title: 'Implement Graph Traversal BFS/DFS', type: 'homework', status: 'todo', priority: 'medium', dueDate: '2026-03-27', description: 'Implement BFS and DFS on adjacency list. Include cycle detection.' },
{ title: 'Write Compiler Lexer in Java', type: 'homework', status: 'todo', priority: 'medium', dueDate: '2026-04-03', description: 'Build a lexer for a subset of C. Tokenize keywords, operators, literals.' },
{ title: 'SQL Query Optimization Lab', type: 'homework', status: 'todo', priority: 'medium', dueDate: '2026-04-10', description: 'Analyze query execution plans. Add indexes to improve 5 slow queries.' },
{ title: 'Final Project Report Draft', type: 'homework', status: 'todo', priority: 'high', dueDate: '2026-04-17', description: 'Write 10-page report on distributed KV store architecture and benchmarks.' },
```

### study (8)
```js
{ title: 'Study for OS Midterm', type: 'study', status: 'completed', priority: 'high', dueDate: '2026-02-20', description: 'Review process scheduling, memory management, and synchronization.' },
{ title: 'Review Data Structures for Midterm', type: 'study', status: 'completed', priority: 'high', dueDate: '2026-02-18', description: 'Trees, heaps, hash tables, graphs. Practice problems from textbook Ch 4-8.' },
{ title: 'Flashcard Review: DP Concepts', type: 'study', status: 'completed', priority: 'medium', dueDate: '2026-03-05', description: 'Run through DP flashcard set. Focus on optimal substructure and overlapping subproblems.' },
{ title: 'Study for Networks Quiz', type: 'study', status: 'in_progress', priority: 'high', dueDate: '2026-03-19', description: 'TCP handshake, congestion control, HTTP/2 vs HTTP/3.' },
{ title: 'Compilers Midterm Prep', type: 'study', status: 'todo', priority: 'high', dueDate: '2026-03-26', description: 'Lexing, parsing (LL/LR), AST construction, type checking.' },
{ title: 'Database Final Exam Study Session', type: 'study', status: 'todo', priority: 'high', dueDate: '2026-04-09', description: 'Normalization, transactions, ACID, concurrency control, query optimization.' },
{ title: 'Algorithm Final Review', type: 'study', status: 'todo', priority: 'high', dueDate: '2026-04-14', description: 'DP, greedy, graph algorithms, NP-completeness, amortized analysis.' },
{ title: 'Systems Design Interview Prep', type: 'study', status: 'todo', priority: 'medium', dueDate: '2026-04-20', description: 'Practice designing URL shortener, chat system, and news feed.' },
```

### project (7)
```js
{ title: 'Final Project: Distributed Key-Value Store', type: 'project', status: 'in_progress', priority: 'high', dueDate: '2026-04-25', description: 'Raft consensus, consistent hashing, gRPC communication layer.' },
{ title: 'Build REST API with Express', type: 'project', status: 'completed', priority: 'medium', dueDate: '2026-02-07', description: 'CRUD endpoints for notes and tasks. JWT auth middleware.' },
{ title: 'Design Database Schema for Group Project', type: 'project', status: 'completed', priority: 'high', dueDate: '2026-02-28', description: 'ER diagram, collection design, index strategy for KV store metadata.' },
{ title: 'Implement Authentication Module', type: 'project', status: 'completed', priority: 'high', dueDate: '2026-03-07', description: 'JWT tokens, refresh flow, password hashing, rate limiting.' },
{ title: 'Write Unit Tests for KV Store', type: 'project', status: 'todo', priority: 'medium', dueDate: '2026-04-11', description: 'Jest test suite for put/get/delete operations. Mock Raft consensus.' },
{ title: 'Deploy Project to Heroku', type: 'project', status: 'todo', priority: 'low', dueDate: '2026-04-22', description: 'Dockerize, set up CI/CD pipeline, configure environment variables.' },
{ title: 'Record Project Demo Video', type: 'project', status: 'todo', priority: 'medium', dueDate: '2026-04-28', description: '5-minute walkthrough of architecture, live demo of key operations.' },
```

### exam (6)
```js
{ title: 'CS 211 Data Structures Midterm', type: 'exam', status: 'completed', priority: 'high', dueDate: '2026-02-19', description: 'Covers arrays through balanced BSTs. 2 hours, closed book.' },
{ title: 'CS 301 Operating Systems Midterm', type: 'exam', status: 'completed', priority: 'high', dueDate: '2026-02-26', description: 'Processes, threads, scheduling, deadlocks. Open note.' },
{ title: 'CS 350 Networks Quiz', type: 'exam', status: 'completed', priority: 'medium', dueDate: '2026-03-05', description: 'Application and transport layer protocols. 45 minutes.' },
{ title: 'CS 211 Data Structures Final', type: 'exam', status: 'todo', priority: 'high', dueDate: '2026-04-16', description: 'Comprehensive. DP, graphs, NP-completeness added.' },
{ title: 'CS 301 OS Final Exam', type: 'exam', status: 'todo', priority: 'high', dueDate: '2026-04-23', description: 'Full semester. File systems and security added to midterm topics.' },
{ title: 'CS 320 Compilers Final', type: 'exam', status: 'todo', priority: 'high', dueDate: '2026-04-21', description: 'Lexing through code generation. Includes optimization passes.' },
```

### club (5)
```js
{ title: 'ACM Weekly Meeting: Feb 5', type: 'club', status: 'completed', priority: 'low', dueDate: '2026-02-05', description: 'Guest speaker on open source contributions.' },
{ title: 'ACM Weekly Meeting: Feb 19', type: 'club', status: 'completed', priority: 'low', dueDate: '2026-02-19', description: 'LeetCode contest practice session.' },
{ title: 'HackIllinois Prep Session', type: 'club', status: 'completed', priority: 'medium', dueDate: '2026-03-01', description: 'Form teams, brainstorm project ideas, set up dev environments.' },
{ title: 'ACM Weekly Meeting: Mar 5', type: 'club', status: 'completed', priority: 'low', dueDate: '2026-03-05', description: 'Mock interview workshop with industry mentors.' },
{ title: 'ACM Spring Hackathon', type: 'club', status: 'todo', priority: 'medium', dueDate: '2026-04-12', description: '24-hour hackathon. Theme: developer tools.' },
```

### professional (7)
```js
{ title: 'Update LinkedIn Profile', type: 'professional', status: 'completed', priority: 'medium', dueDate: '2026-01-25', description: 'Add fall semester projects, update skills section.' },
{ title: 'Tailor Resume for Google Application', type: 'professional', status: 'completed', priority: 'high', dueDate: '2026-01-30', description: 'Highlight distributed systems coursework and API project.' },
{ title: 'Submit Google SWE Intern Application', type: 'professional', status: 'completed', priority: 'high', dueDate: '2026-02-01', description: 'Applied via careers.google.com. Referral from ACM alum.' },
{ title: 'Prep for Stripe Technical Screen', type: 'professional', status: 'completed', priority: 'high', dueDate: '2026-02-15', description: 'Practice API design questions, payments domain knowledge.' },
{ title: 'Send Thank You to Google Recruiter', type: 'professional', status: 'completed', priority: 'medium', dueDate: '2026-03-03', description: 'Email Sarah Kim after the technical screen.' },
{ title: 'Research Companies for Fall Recruiting', type: 'professional', status: 'todo', priority: 'low', dueDate: '2026-04-05', description: 'Make list of companies with fall 2026 new grad openings.' },
{ title: 'Finalize Internship Decision', type: 'professional', status: 'todo', priority: 'high', dueDate: '2026-04-15', description: 'Compare Stripe, HubSpot, Shopify offers. Deadline Apr 15.' },
```

### personal (5)
```js
{ title: 'Buy Algorithm Design textbook', type: 'personal', status: 'completed', priority: 'medium', dueDate: '2026-01-22', description: 'Kleinberg & Tardos, 2nd edition. Check campus bookstore first.' },
{ title: 'Set up development environment', type: 'personal', status: 'completed', priority: 'high', dueDate: '2026-01-21', description: 'Install Node 20, MongoDB, VS Code extensions, configure ESLint.' },
{ title: 'Schedule advisor meeting', type: 'personal', status: 'completed', priority: 'medium', dueDate: '2026-02-03', description: 'Discuss fall course selection and research opportunities.' },
{ title: 'Register for Fall 2026 classes', type: 'personal', status: 'todo', priority: 'high', dueDate: '2026-04-08', description: 'Priority: ML, Distributed Systems, Security. Backup: Graphics.' },
{ title: 'Buy new laptop charger', type: 'personal', status: 'todo', priority: 'low', dueDate: '2026-03-30', description: 'MacBook Pro USB-C charger. Check Amazon vs Apple Store.' },
```

### other (6)
```js
{ title: 'Watch MIT OCW: Advanced Algorithms Lecture 5', type: 'other', status: 'completed', priority: 'low', dueDate: '2026-02-08', description: 'Amortized analysis and Fibonacci heaps.' },
{ title: 'Read "Designing Data-Intensive Applications" Ch 1-2', type: 'other', status: 'completed', priority: 'medium', dueDate: '2026-02-22', description: 'Foundations of data systems, data models and query languages.' },
{ title: 'Write blog post: What I Learned from My First LeetCode 150', type: 'other', status: 'todo', priority: 'low', dueDate: '2026-04-03', description: 'Reflect on patterns, time management, and growth mindset.' },
{ title: 'Explore Rust for Systems Programming', type: 'other', status: 'todo', priority: 'low', dueDate: '2026-04-07', description: 'Work through Rust Book chapters 1-4. Build a CLI tool.' },
{ title: 'Set up personal portfolio website', type: 'other', status: 'in_progress', priority: 'medium', dueDate: '2026-04-20', description: 'Next.js + Tailwind. Deploy on Vercel. Showcase 3 projects.' },
{ title: 'Read "Clean Code" Ch 3-5', type: 'other', status: 'todo', priority: 'low', dueDate: '2026-03-28', description: 'Functions, comments, and formatting. Take notes.' },
```

### Shared task (1 extra)
```js
{
  title: 'Group Project: System Design Document',
  type: 'project',
  status: 'in_progress',
  priority: 'high',
  dueDate: '2026-04-04',
  description: 'Co-authored system design doc for distributed KV store. Covers architecture, data flow, and failure modes.',
  isShared: true,
  participants: [{ userId: alexId, status: 'in_progress' }],
}
```

---

## SECTION 8: Justin's Applications (40 total)

### draft (6)
```js
// All: status 'draft', no appliedAt, no contacts
[
  { company: 'Airbnb', position: 'Software Engineering Intern', location: 'San Francisco, CA', notes: 'Need to tailor resume for marketplace/payments team.' },
  { company: 'Lyft', position: 'Software Engineering Intern', location: 'San Francisco, CA', notes: 'Focus on distributed systems experience.' },
  { company: 'Twitter/X', position: 'Software Engineering Intern', location: 'San Francisco, CA', notes: 'Research recent engineering blog posts.' },
  { company: 'Salesforce', position: 'Software Engineering Intern', location: 'San Francisco, CA', notes: 'Check if they have a cloud infrastructure team.' },
  { company: 'Adobe', position: 'Software Engineering Intern', location: 'San Jose, CA', notes: 'Creative Cloud or Document Cloud team preferred.' },
  { company: 'Robinhood', position: 'Software Engineering Intern', location: 'Menlo Park, CA', notes: 'Fintech angle — mention Marcus finance connection.' },
]
```

### applied (8)
```js
// All: status 'applied', appliedAt set, no contacts needed
[
  { company: 'Meta', position: 'Software Engineering Intern', location: 'Menlo Park, CA', status: 'applied', appliedAt: '2026-02-02', notes: 'Applied to Infrastructure team. Heard back takes 2-4 weeks.' },
  { company: 'Microsoft', position: 'Software Engineering Intern', location: 'Redmond, WA', status: 'applied', appliedAt: '2026-02-05', notes: 'Applied to Azure team. Got auto-confirmation email.' },
  { company: 'Uber', position: 'Software Engineering Intern', location: 'San Francisco, CA', status: 'applied', appliedAt: '2026-02-10', notes: 'Referral from Jordan\'s roommate.' },
  { company: 'LinkedIn', position: 'Software Engineering Intern', location: 'Sunnyvale, CA', status: 'applied', appliedAt: '2026-02-12', notes: 'Applied via university portal.' },
  { company: 'Coinbase', position: 'Software Engineering Intern', location: 'Remote', status: 'applied', appliedAt: '2026-02-15', notes: 'Crypto/blockchain team. Mentioned distributed systems coursework.' },
  { company: 'DoorDash', position: 'Software Engineering Intern', location: 'San Francisco, CA', status: 'applied', appliedAt: '2026-02-18', notes: 'Logistics/routing team.' },
  { company: 'Netflix', position: 'Software Engineering Intern', location: 'Los Gatos, CA', status: 'applied', appliedAt: '2026-02-20', notes: 'Streaming infrastructure team. Long shot but worth trying.' },
  { company: 'Palantir', position: 'Software Engineering Intern', location: 'New York, NY', status: 'applied', appliedAt: '2026-02-22', notes: 'Forward Deployed Engineer track.' },
]
```

### interview (8)
```js
[
  { company: 'Google', position: 'Software Engineering Intern', location: 'Mountain View, CA', status: 'interview', appliedAt: '2026-02-01', interviewDates: ['2026-02-20', '2026-03-10'], notes: 'Technical screen done. On-site loop scheduled Mar 10. Focus: coding + system design.', contacts: [{ name: 'Sarah Kim', role: 'University Recruiter', email: 'sarahkim@google.com', lastContactDate: '2026-03-03', notes: 'Very responsive. Sent prep materials.' }], followUpReminders: [{ date: '2026-03-15', description: 'Follow up on loop results', completed: false }] },
  { company: 'Apple', position: 'Software Engineering Intern', location: 'Cupertino, CA', status: 'interview', appliedAt: '2026-02-03', interviewDates: ['2026-02-25'], notes: 'First round phone screen completed. Waiting for next steps.', contacts: [{ name: 'David Park', role: 'Engineering Manager', email: 'dpark@apple.com', lastContactDate: '2026-02-25', notes: 'Interviewed me for the WebKit team.' }], followUpReminders: [{ date: '2026-03-05', description: 'Check in about next round', completed: false }] },
  { company: 'Nvidia', position: 'Software Engineering Intern', location: 'Santa Clara, CA', status: 'interview', appliedAt: '2026-02-08', interviewDates: ['2026-03-01'], notes: 'Technical screen focused on GPU programming concepts.', contacts: [{ name: 'Lisa Chen', role: 'Technical Recruiter', lastContactDate: '2026-03-01', notes: 'Said results in 1-2 weeks.' }], followUpReminders: [{ date: '2026-03-14', description: 'Follow up on screen results', completed: false }] },
  { company: 'Jane Street', position: 'Quantitative Developer Intern', location: 'New York, NY', status: 'interview', appliedAt: '2026-01-28', interviewDates: ['2026-02-15'], notes: 'OA completed. Heavy on math and probability.', contacts: [], followUpReminders: [] },
  { company: 'Two Sigma', position: 'Software Engineering Intern', location: 'New York, NY', status: 'interview', appliedAt: '2026-02-01', interviewDates: ['2026-02-22'], notes: 'First interview done. Systems design focus.', contacts: [{ name: 'Rachel Lee', role: 'Campus Recruiter', lastContactDate: '2026-02-22', notes: 'Mentioned second round in March.' }], followUpReminders: [{ date: '2026-03-08', description: 'Ask about second round scheduling', completed: false }] },
  { company: 'Figma', position: 'Software Engineering Intern', location: 'San Francisco, CA', status: 'interview', appliedAt: '2026-02-05', interviewDates: ['2026-03-05'], notes: 'Design + coding round. Build a collaborative feature.', contacts: [], followUpReminders: [{ date: '2026-03-12', description: 'Follow up on round results', completed: false }] },
  { company: 'Notion', position: 'Software Engineering Intern', location: 'San Francisco, CA', status: 'interview', appliedAt: '2026-02-07', interviewDates: ['2026-03-03'], notes: 'Values interview completed. Discussed productivity tooling passion.', contacts: [], followUpReminders: [{ date: '2026-03-10', description: 'Check for next steps', completed: false }] },
  { company: 'Vercel', position: 'Software Engineering Intern', location: 'Remote', status: 'interview', appliedAt: '2026-02-10', interviewDates: ['2026-03-06'], notes: 'Technical screen on Next.js and edge computing.', contacts: [], followUpReminders: [{ date: '2026-03-13', description: 'Follow up on technical screen', completed: false }] },
]
```

### offer (4)
```js
[
  { company: 'Stripe', position: 'Software Engineering Intern', location: 'San Francisco, CA', status: 'offer', appliedAt: '2026-01-25', interviewDates: ['2026-02-10', '2026-02-18'], offerReceivedAt: '2026-02-28', deadlineDate: '2026-04-15', salary: '$58/hr', notes: 'Payments infrastructure team. Best offer so far. 12-week program.', contacts: [{ name: 'Mike Thompson', role: 'Engineering Manager', email: 'mthompson@stripe.com', lastContactDate: '2026-02-28', notes: 'Sent offer letter. Very welcoming team.' }], followUpReminders: [{ date: '2026-04-10', description: 'Make final decision before deadline', completed: false }] },
  { company: 'HubSpot', position: 'Software Engineering Intern', location: 'Cambridge, MA', status: 'offer', appliedAt: '2026-01-28', interviewDates: ['2026-02-12', '2026-02-20'], offerReceivedAt: '2026-03-05', deadlineDate: '2026-04-15', salary: '$50/hr', notes: 'CRM platform team. Good culture, hybrid work.', contacts: [{ name: 'Emily Watson', role: 'Recruiter', lastContactDate: '2026-03-05', notes: 'Sent benefits package details.' }], followUpReminders: [{ date: '2026-04-10', description: 'Decide on offer', completed: false }] },
  { company: 'Shopify', position: 'Software Engineering Intern', location: 'Remote', status: 'offer', appliedAt: '2026-02-01', interviewDates: ['2026-02-18', '2026-02-28'], offerReceivedAt: '2026-03-10', salary: '$52/hr (CAD adjusted)', notes: 'Commerce platform. Fully remote. Good mentorship program.', contacts: [], followUpReminders: [{ date: '2026-04-10', description: 'Respond to offer', completed: false }] },
  { company: 'Twilio', position: 'Software Engineering Intern', location: 'San Francisco, CA', status: 'offer', appliedAt: '2026-02-03', interviewDates: ['2026-02-20', '2026-03-01'], offerReceivedAt: '2026-03-12', salary: '$48/hr', notes: 'Communications API team. Interesting product but lower comp.', contacts: [], followUpReminders: [{ date: '2026-04-10', description: 'Respond to offer', completed: false }] },
]
```

### rejected (8)
```js
// All: status 'rejected', appliedAt set, no contacts needed
[
  { company: 'Amazon', position: 'Software Engineering Intern', location: 'Seattle, WA', status: 'rejected', appliedAt: '2026-01-25', notes: 'OA score was borderline. Need more LC practice.' },
  { company: 'Goldman Sachs', position: 'Software Engineering Intern', location: 'New York, NY', status: 'rejected', appliedAt: '2026-01-27', notes: 'Rejected after HireVue. Finance questions caught me off guard.' },
  { company: 'Citadel', position: 'Software Engineering Intern', location: 'Chicago, IL', status: 'rejected', appliedAt: '2026-01-28', notes: 'Did not pass the OA. Need stronger math foundation.' },
  { company: 'Roblox', position: 'Software Engineering Intern', location: 'San Mateo, CA', status: 'rejected', appliedAt: '2026-02-01', notes: 'No response after 4 weeks. Assumed rejection.' },
  { company: 'ByteDance', position: 'Software Engineering Intern', location: 'San Jose, CA', status: 'rejected', appliedAt: '2026-02-03', notes: 'Rejected after phone screen. Interviewer focused heavily on system design.' },
  { company: 'Snap', position: 'Software Engineering Intern', location: 'Santa Monica, CA', status: 'rejected', appliedAt: '2026-02-05', notes: 'Form rejection email. Very competitive cycle.' },
  { company: 'Pinterest', position: 'Software Engineering Intern', location: 'San Francisco, CA', status: 'rejected', appliedAt: '2026-02-08', notes: 'Position filled before my application was reviewed.' },
  { company: 'Datadog', position: 'Software Engineering Intern', location: 'New York, NY', status: 'rejected', appliedAt: '2026-02-10', notes: 'Made it to final round but did not receive offer.' },
]
```

### withdrawn (6)
```js
// All: status 'withdrawn', appliedAt set
[
  { company: 'Zillow', position: 'Software Engineering Intern', location: 'Seattle, WA', status: 'withdrawn', appliedAt: '2026-01-30', notes: 'Withdrew after receiving Stripe offer. Did not want to continue process.' },
  { company: 'Dropbox', position: 'Software Engineering Intern', location: 'San Francisco, CA', status: 'withdrawn', appliedAt: '2026-02-01', notes: 'Withdrew to reduce interview load.' },
  { company: 'Asana', position: 'Software Engineering Intern', location: 'San Francisco, CA', status: 'withdrawn', appliedAt: '2026-02-03', notes: 'Timeline did not align with my schedule.' },
  { company: 'Box', position: 'Software Engineering Intern', location: 'Redwood City, CA', status: 'withdrawn', appliedAt: '2026-02-05', notes: 'Withdrew after getting enough active interviews.' },
  { company: 'Qualtrics', position: 'Software Engineering Intern', location: 'Provo, UT', status: 'withdrawn', appliedAt: '2026-02-08', notes: 'Location was not ideal. Withdrew early.' },
  { company: 'Okta', position: 'Software Engineering Intern', location: 'San Francisco, CA', status: 'withdrawn', appliedAt: '2026-02-10', notes: 'Withdrew to focus on top-choice companies.' },
]
```

---

## SECTION 9: Conversations & Messages (6 conversations, 20+ messages each)

Create `Conversation` first, then bulk-create `Message` docs, then update `lastMessage` on the conversation.

For each conversation:
1. `Conversation.create({ participants: [justin._id, friend._id], unreadCounts: [{ userId: justin._id, count: 0 }, { userId: friend._id, count: 0 }] })`
2. Create messages with incrementing `createdAt` dates (spread across Feb-Apr 2026, 1-3 day gaps between messages)
3. After all messages created, update conversation's `lastMessage` with the final message data

All message content goes in `seed-data.js` as arrays. Each message: `{ sender: 'justin' | 'friend', content: '...', date: '2026-MM-DD' }`.

Mark all messages as read by both participants: `readBy: [{ userId: justin._id, readAt: msgDate }, { userId: friend._id, readAt: msgDate }]`.

### Conversation topics (write 20-25 messages each in seed-data.js)

**Justin <-> Alex (25 messages, Feb-Apr)**
Study group planning -> DP assignment help -> interview prep -> Stripe offer reaction -> ACM hackathon coordination. Heavy CS focus, sharing LeetCode problems, debugging together.

**Justin <-> Maya (22 messages, Feb-Apr)**
Data science notes sharing -> stats homework -> ML project discussion -> summer plans -> comparing internship offers. Cross-discipline learning, Maya teaches stats, Justin teaches algorithms.

**Justin <-> Jordan (20 messages, Jan-Apr)**
Hardware vs software career paths -> embedded systems question -> OS concepts -> interview prep (Jordan's senior job search). Senior mentoring dynamic, Jordan gives career advice.

**Justin <-> Priya (20 messages, Feb-Apr)**
Campus life -> study tips across majors -> Priya asking for CS advice -> Justin asking about biology/pre-med path -> mutual encouragement. Cross-major friendship, supportive tone.

**Justin <-> Marcus (21 messages, Feb-Apr)**
Finance vs tech recruiting comparison -> Marcus asks CS help with Excel automation -> Justin asks about financial modeling -> internship offer salary negotiation tips. Cross-discipline practical help.

**Justin <-> Sofia (20 messages, Feb-Apr)**
Research methods class discussion -> cognitive load theory applied to studying -> Sofia's grad school apps -> Justin sharing app season stress -> mutual support. Intellectual conversations, emotional support.

---

## SECTION 10: Comments & Likes

**Rule: every shared note and flashcard set gets at least 2 comments and multiple likes.**

### On Justin's shared notes (indices 0, 1, 2, 5, 6, 10, 13 — the ones with visibility 'friends' or 'specific')
Each gets 2-4 comments from different friends. Put all comment content in seed-data.js.

Example comments per note:
- Note 0 (DP): Alex: "This DP explanation finally clicked for me, especially the memoization table visualization." Maya: "Do you have practice problems for this? I want to try the tabulation approach."
- Note 1 (OS Scheduling): Jordan: "Great breakdown of round robin. We covered this in my embedded systems class too." Priya: "Even though I'm pre-med, I found the scheduling analogy to hospital triage fascinating."
- Note 2 (TCP/IP): Alex: "The HTTP/2 multiplexing section is really well written." Marcus: "I never understood why HTTPS was important until reading your TLS explanation."
- Note 5 (Neural Networks): Maya: "This pairs well with my stats notes on gradient descent." Sofia: "The cognitive architecture parallels to neural networks are interesting from a psych perspective."
- Note 6 (Distributed Systems): Alex: "CAP theorem explanation is the clearest I've seen." Jordan: "Shared this with my study group, super helpful for our distributed systems project."
- Note 10 (Interview Prep): Marcus: "The behavioral question framework works for finance interviews too." Alex: "Added your STAR method examples to my own prep doc."
- Note 13 (System Design): Jordan: "Load balancer section is solid. Add more on database sharding?" Alex: "Can you add a section on caching strategies?"

### On friends' shared notes
Justin comments on 3 notes per friend (18 comments total). Substantive comments showing cross-discipline interest.

### On shared flashcard sets
Each shared set gets 2-3 comments. Examples:
- "Used this before the midterm, scored 91%"
- "Missing a few edge cases on the tree questions"
- "Can you add more DP patterns?"
- "This set helped me review in 20 minutes flat"

### Likes
For every Comment created, add 2-4 user IDs to the `likes` array.
For comments — push likes after creation: `Comment.updateOne({ _id: commentId }, { $push: { likes: userId } })`

**Note**: The Comment model has `likes` on comments themselves. There is no separate "like on a note" model. Likes are only on comments.

---

## SECTION 11: Activity Feed

Create Activity entries for shared content. Each activity's `visibleTo` should include all 6 friend IDs (and Justin's ID for friend activities).

### Justin's activities (15+)
```js
// For each note Justin shared (visibility 'friends' or 'specific'):
{ userId: justin._id, type: 'note_shared', targetId: noteId, targetType: 'note', visibleTo: allFriendIds, metadata: { noteTitle: note.title } }

// For each flashcard set Justin shared:
{ userId: justin._id, type: 'flashcard_shared', targetId: setId, targetType: 'flashcardSet', visibleTo: allFriendIds, metadata: { setTitle: set.title } }

// For the shared task:
{ userId: justin._id, type: 'task_created', targetId: taskId, targetType: 'task', visibleTo: allFriendIds, metadata: { taskTitle: task.title } }

// For Justin's comments on friends' content (pick 5):
{ userId: justin._id, type: 'comment_added', targetId: commentId, targetType: 'comment', visibleTo: allFriendIds, metadata: { commentPreview: comment.content.slice(0, 100) } }
```

### Friends' activities (2+ per friend, visible to Justin)
Each friend shares 2 notes and 1 flashcard set -> 3 activities each, all with `visibleTo` including Justin's ID.

### createdAt for activities
Space them across Feb-Apr 2026 to look natural in the feed. Set `createdAt` explicitly on each activity.

---

## seed-data.js Structure

```js
module.exports = {
  // SECTION 3: Justin's 25 notes (full markdown content for each)
  justinNotes: [ { title, type, tags, subject, content, visibility, isPinned }, ... ],

  // SECTION 3: Static AI fallbacks for notes 0-9
  noteSummaryFallbacks: [
    { quickSummary: '...', detailedSummary: '...' },
    // ... 10 entries
  ],

  // SECTION 4: Friends' 30 notes
  friendNotes: {
    alexchen_cs: [ { title, tags, subject, content }, ... ],
    mayapatel_ds: [ ... ],
    jordanwilliams: [ ... ],
    priyasharma: [ ... ],
    marcusjohnson: [ ... ],
    sofiarod: [ ... ],
  },

  // SECTION 5: Static flashcard fallbacks for AI sets (10 sets x 10 cards)
  flashcardFallbacks: [
    [{ front: '...', back: '...' }, ...],  // set 0 cards
    // ... 10 entries
  ],

  // SECTION 5: Manual flashcard sets (10 sets x 8-12 cards)
  manualFlashcardSets: [
    { title: 'Data Structures Quick Reference', description: '...', visibility: 'friends', cards: [{ front, back }, ...] },
    // ... 10 entries
  ],

  // SECTION 6: Friends' flashcard sets (18 sets x 8-10 cards)
  friendFlashcardSets: {
    alexchen_cs: [ { title, description, cards: [{front, back}] }, ... ],
    // ... 6 friends
  },

  // SECTION 9: Conversation messages (6 conversations x 20-25 messages)
  conversations: {
    alex: [ { sender: 'justin', content: '...', date: '2026-02-05' }, { sender: 'friend', content: '...', date: '2026-02-06' }, ... ],
    maya: [ ... ],
    jordan: [ ... ],
    priya: [ ... ],
    marcus: [ ... ],
    sofia: [ ... ],
  },

  // SECTION 10: Comment content
  justinNoteComments: {
    0: [ { username: 'alexchen_cs', content: '...' }, { username: 'mayapatel_ds', content: '...' } ],
    // ... for each shared note index
  },
  friendNoteComments: {
    // Justin's comments on friends' notes
    alexchen_cs: [ { noteIndex: 0, content: '...' }, { noteIndex: 2, content: '...' }, { noteIndex: 4, content: '...' } ],
    // ... 6 friends
  },
  flashcardSetComments: [
    // Comments on shared flashcard sets
    { setOwner: 'justin', setIndex: 0, username: 'alexchen_cs', content: '...' },
    // ...
  ],
};
```

---

## Implementation Order for the Builder Chat

**Tell the builder chat to implement section by section:**

1. "Read `docs/future-ideas/demo-seed-script.md`. Create `backend/scripts/seed-data.js` with SECTIONS 3, 4 (note content only — justinNotes array and friendNotes object with full markdown content, plus noteSummaryFallbacks)."

2. "Continue seed-data.js: add SECTIONS 5, 6 (flashcardFallbacks, manualFlashcardSets, friendFlashcardSets — all card arrays)."

3. "Continue seed-data.js: add SECTION 9 (conversations object — all 6 conversation message arrays, 20-25 messages each)."

4. "Continue seed-data.js: add SECTION 10 (justinNoteComments, friendNoteComments, flashcardSetComments)."

5. "Create `backend/scripts/seed.js` — the main runner. Implement the setup, clean function, and SECTIONS 1-2 (users + friendships)."

6. "Continue seed.js: implement SECTIONS 3-4 (Justin's notes with AI/fallback summaries, friends' notes)."

7. "Continue seed.js: implement SECTIONS 5-6 (Justin's flashcard sets with AI/fallback cards, friends' flashcard sets)."

8. "Continue seed.js: implement SECTION 7 (tasks) and SECTION 8 (applications)."

9. "Continue seed.js: implement SECTIONS 9-11 (conversations + messages, comments + likes, activities). Wire up main() and test."

Each step is independent enough to fit in one output. The builder chat just needs to read this file and follow the numbered steps.
