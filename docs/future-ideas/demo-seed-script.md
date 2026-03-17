# Demo Seed Script Plan

Populate the database with realistic Spring 2026 semester data for a live demo using `justinburrell715@gmail.com`.
All dates fall between **January 20 – April 30, 2026**.
Resumes and Google Docs are excluded (require real files / live OAuth tokens).

---

## Files to Create

```
backend/scripts/seed.js        # main runner
backend/scripts/seed-data.js   # all content: note bodies, messages, task arrays, etc.
```

Run with:
```bash
node backend/scripts/seed.js           # idempotent — skips if seed data already exists
node backend/scripts/seed.js --clean   # wipes all seed data and reseeds fresh
node backend/scripts/seed.js --no-ai  # skips Groq calls, uses static fallback content
```

---

## Seed Users (6 Friends — Diverse Majors)

All passwords: `Demo@1234` (meets validation: 8+ chars, letter + number + special)
All get `settings.activityVisibility: 'friends'`
All get realistic bios.

| Username | Name | Major | Year |
|----------|------|-------|------|
| `alexchen_cs` | Alex Chen | Computer Science | Sophomore |
| `mayapatel_ds` | Maya Patel | Data Science / Statistics | Junior |
| `jordanwilliams` | Jordan Williams | Computer Engineering | Senior |
| `priyasharma` | Priya Sharma | Biology / Pre-Med | Sophomore |
| `marcusjohnson` | Marcus Johnson | Business Finance | Junior |
| `sofiarod` | Sofia Rodriguez | Psychology | Junior |

Justin (`justinburrell715@gmail.com`) is looked up by email — never recreated.
His `activityVisibility` is updated to `'friends'` if not already set.

---

## Justin's Notes — 25 Total (5 per type)

### lecture (5)
1. Dynamic Programming: From Recursion to Optimization
2. OS Process Scheduling Algorithms (FCFS, SJF, Round Robin, Priority)
3. Computer Networks: TCP/IP Stack and HTTP
4. Database Systems: Indexing, Query Optimization, and Transactions
5. Compilers: Lexing, Parsing, and Semantic Analysis

### research (5)
6. Neural Networks & Deep Learning: Architecture Overview
7. Distributed Systems: CAP Theorem and Consistency Models
8. Cryptography: Public Key Infrastructure and TLS
9. Quantum Computing: Qubits, Superposition, and Grover's Algorithm
10. Graph Algorithms: Dijkstra, Bellman-Ford, and A*

### general (5)
11. Technical Interview Preparation Guide
12. React Hooks: Patterns and Best Practices
13. Git Workflow and Branching Strategies
14. System Design Primer: Scalability Fundamentals
15. UNIX Command Line Toolkit

### todo (5)
16. Finals Week Study Plan
17. Internship Application Checklist — Spring 2026
18. Group Project Task Breakdown: Distributed KV Store
19. Week 9 Action Items
20. Summer Prep Roadmap

### journal (5)
21. Week 3 Reflection — Adjusting to Spring Semester
22. Week 6 Reflection — Midterm Season Hits Different
23. Week 8 Reflection — Progress and Setbacks
24. Week 11 Reflection — Internship Offer and What It Means
25. Week 14 Reflection — End of Semester Thoughts

**AI Summaries (via Groq):** Generated for notes 1–10 (lecture + research)
**Shared notes (visibility: 'friends'):** Notes 1, 6, 7, 11, 14
**Specific shares (with all 6 friends):** Notes 2, 3 (so friends can comment)

---

## Justin's Flashcard Sets — 20 Total

| # | Title | Source | AI Generated | Shared |
|---|-------|--------|-------------|--------|
| 1 | Dynamic Programming Concepts | Note 1 | Yes (Groq) | friends |
| 2 | OS Scheduling Algorithms | Note 2 | Yes (Groq) | friends |
| 3 | Neural Network Key Terms | Note 6 | Yes (Groq) | friends |
| 4 | Distributed Systems Vocab | Note 7 | Yes (Groq) | friends |
| 5 | TCP/IP and Networking | Note 3 | Yes (Groq) | friends |
| 6 | Database Systems Review | Note 4 | Yes (Groq) | friends |
| 7 | Data Structures Quick Reference | — | No (manual) | friends |
| 8 | SQL Interview Questions | — | No (manual) | friends |
| 9 | Big-O Cheat Sheet | — | No (manual) | friends |
| 10 | OOP Design Patterns | — | No (manual) | private |
| 11 | Git Commands Reference | — | No (manual) | friends |
| 12 | React Core Concepts | — | No (manual) | friends |
| 13 | UNIX / Linux Commands | — | No (manual) | private |
| 14 | Cryptography Basics | Note 8 | Yes (Groq) | friends |
| 15 | Graph Algorithm Vocab | Note 10 | Yes (Groq) | friends |
| 16 | Compiler Terminology | Note 5 | Yes (Groq) | private |
| 17 | System Design Patterns | — | No (manual) | friends |
| 18 | Python Built-ins Cheat Sheet | — | No (manual) | private |
| 19 | Interview Behavioral Questions | — | No (manual) | friends |
| 20 | Quantum Computing Intro Terms | Note 9 | Yes (Groq) | friends |

---

## Justin's Tasks — 50+ Total (all 8 types)

All statuses represented: `todo`, `in_progress`, `completed`
Due dates spread across Jan 20 – Apr 30, 2026

### homework (~8)
- Submit Assignment 1: Big-O Analysis (completed, Jan 28)
- Submit Assignment 2: Linked List Implementation (completed, Feb 10)
- Submit Assignment 3: Red-Black Trees (completed, Feb 24)
- Submit Assignment 4: DP Coin Change (in_progress, Mar 20)
- Implement Graph Traversal BFS/DFS (todo, Mar 27)
- Write Compiler Lexer in Java (todo, Apr 3)
- SQL Query Optimization Lab (todo, Apr 10)
- Final Project Report Draft (todo, Apr 17)

### study (~8)
- Study for OS Midterm (completed, Feb 20)
- Review Data Structures for Midterm (completed, Feb 18)
- Flashcard Review: DP Concepts (completed, Mar 5)
- Study for Networks Quiz (in_progress, Mar 19)
- Compilers Midterm Prep (todo, Mar 26)
- Database Final Exam Study Session (todo, Apr 9)
- Algorithm Final Review (todo, Apr 14)
- Systems Design Interview Prep (todo, Apr 20)

### project (~7)
- Final Project: Distributed Key-Value Store (in_progress, Apr 25)
- Build REST API with Express (completed, Feb 7)
- Design Database Schema for Group Project (completed, Feb 28)
- Implement Authentication Module (completed, Mar 7)
- Write Unit Tests for KV Store (todo, Apr 11)
- Deploy Project to Heroku (todo, Apr 22)
- Record Project Demo Video (todo, Apr 28)

### exam (~6)
- CS 211 Data Structures Midterm (completed, Feb 19)
- CS 301 Operating Systems Midterm (completed, Feb 26)
- CS 350 Networks Quiz (completed, Mar 5)
- CS 211 Data Structures Final (todo, Apr 16)
- CS 301 OS Final Exam (todo, Apr 23)
- CS 320 Compilers Final (todo, Apr 21)

### club (~5)
- ACM Weekly Meeting: Feb 5 (completed)
- ACM Weekly Meeting: Feb 19 (completed)
- HackIllinois Prep Session (completed, Mar 1)
- ACM Weekly Meeting: Mar 5 (completed)
- ACM Spring Hackathon (todo, Apr 12)

### professional (~7)
- Update LinkedIn Profile (completed, Jan 25)
- Tailor Resume for Google Application (completed, Jan 30)
- Submit Google SWE Intern Application (completed, Feb 1)
- Prep for Stripe Technical Screen (completed, Feb 15)
- Send Thank You to Google Recruiter (completed, Mar 3)
- Research Companies for Fall Recruiting (todo, Apr 5)
- Finalize Internship Decision (todo, Apr 15)

### personal (~5)
- Buy Algorithm Design textbook (completed, Jan 22)
- Set up development environment (completed, Jan 21)
- Schedule advisor meeting (completed, Feb 3)
- Register for Fall 2026 classes (todo, Apr 8)
- Buy new laptop charger (todo, Mar 30)

### other (~6)
- Watch MIT OCW: Advanced Algorithms Lecture 5 (completed, Feb 8)
- Read "Designing Data-Intensive Applications" Ch 1-2 (completed, Feb 22)
- Write blog post: What I Learned from My First LeetCode 150 (todo, Apr 3)
- Explore Rust for Systems Programming (todo, Apr 7)
- Set up personal portfolio website (in_progress, Apr 20)
- Read "Clean Code" Ch 3-5 (todo, Mar 28)

### Shared Task (with Alex)
- Group Project: System Design Document (shared, isShared: true, participants: [alexchen_cs], due Apr 4)

---

## Applications — 40+ Total (all pipeline stages)

Spread across Jan 2026 – present. Companies are real tech firms.

### draft (~6)
Airbnb SWE Intern, Lyft SWE Intern, Twitter/X SWE Intern, Salesforce SWE Intern, Adobe SWE Intern, Robinhood SWE Intern

### applied (~8)
Meta SWE Intern (Feb 2), Microsoft SWE Intern (Feb 5), Uber SWE Intern (Feb 10), LinkedIn SWE Intern (Feb 12), Coinbase SWE Intern (Feb 15), DoorDash SWE Intern (Feb 18), Netflix SWE Intern (Feb 20), Palantir SWE Intern (Feb 22)

### interview (~8)
Google SWE Intern — technical screen done, loop scheduled (with contact: Sarah Kim, University Recruiter)
Apple SWE Intern — first round done
Nvidia SWE Intern — technical screen
Jane Street Quant Dev — OA completed
Two Sigma SWE Intern — first interview done
Figma SWE Intern — design + coding round
Notion SWE Intern — values interview
Vercel SWE Intern — technical screen

### offer (~4)
Stripe SWE Intern — offer received Feb 28, $58/hr, deadline Apr 15
HubSpot SWE Intern — offer received Mar 5
Shopify SWE Intern — offer received Mar 10
Twilio SWE Intern — offer received Mar 12

### rejected (~8)
Amazon SWE Intern, Goldman Sachs SWE Intern, Citadel SWE Intern, Roblox SWE Intern, ByteDance SWE Intern, Snap SWE Intern, Pinterest SWE Intern, Datadog SWE Intern

### withdrawn (~6)
Zillow SWE Intern (withdrew after Stripe offer), Dropbox SWE Intern, Asana SWE Intern, Box SWE Intern, Qualtrics SWE Intern, Okta SWE Intern

Each application has:
- `notes` field with interview prep notes / recruiter info
- `contacts` array (at least for interview/offer stage apps)
- `followUpReminders` (for apps in interview/offer stage)
- `interviewDates` for interview/offer stage

---

## Friends' Shared Content

Each friend has 5+ notes and 3+ flashcard sets shared with Justin AND with other friends (visibility: 'friends' or specific).

### Alex Chen (CS)
Notes: Big-O Complexity Guide, Sorting Algorithms Comparison, Binary Search Trees Deep Dive, Recursion Patterns, C++ vs Java for Interviews
Flashcard sets: Sorting Algorithms, Tree Traversal Methods, Recursion Patterns

### Maya Patel (Data Science)
Notes: Pandas & NumPy Cheat Sheet, Statistics for ML, Data Visualization Best Practices, Linear Regression Explained, Python for Data Analysis
Flashcard sets: Statistics Key Terms, ML Algorithm Overview, Python Data Science Toolkit

### Jordan Williams (Computer Engineering)
Notes: Digital Logic & Circuit Design, Embedded Systems with Arduino, Memory Hierarchy and Caching, ARM Assembly Basics, Hardware vs Software Tradeoffs
Flashcard sets: Digital Logic Gates, Memory Hierarchy Terms, ARM Assembly Instructions

### Priya Sharma (Pre-Med / Biology)
Notes: Organic Chemistry Reaction Mechanisms, MCAT Study Strategy, Biochemistry: Enzyme Kinetics, Research Methods in Biology, Medical School Application Timeline
Flashcard sets: Organic Chemistry Reactions, Biochem Key Enzymes, MCAT Vocab

### Marcus Johnson (Business Finance)
Notes: Investment Banking Recruiting Guide, Financial Modeling Basics, Valuation Methods (DCF, Comps, Precedents), Excel Shortcuts for Finance, Networking in Finance
Flashcard sets: Finance Interview Questions, Financial Ratios, Valuation Methods

### Sofia Rodriguez (Psychology)
Notes: Cognitive Psychology: Memory & Learning, Research Design and Statistics, Abnormal Psychology Overview, Neuroscience Basics, Graduate School Application Tips
Flashcard sets: Psych Research Methods, Cognitive Psychology Terms, Neuroscience Basics

---

## Conversations — 6 Total (20+ messages each)

All conversations are school-appropriate, academic or professional in tone.

### Justin ↔ Alex (~25 messages)
Topic flow: study group planning → DP assignment help → interview prep → Stripe offer reaction → ACM hackathon coordination
Dates: Feb through April

### Justin ↔ Maya (~22 messages)
Topic flow: data science notes sharing → stats homework → ML project discussion → summer plans → comparing internship offers
Dates: Feb through April

### Justin ↔ Jordan (~20 messages)
Topic flow: hardware vs software career paths → embedded systems question → OS concepts → interview prep (Jordan's senior job search)
Dates: Jan through April

### Justin ↔ Priya (~20 messages)
Topic flow: campus life → study tips across majors → Priya asking for CS advice → Justin asking about biology/pre-med path → mutual encouragement
Dates: Feb through April

### Justin ↔ Marcus (~21 messages)
Topic flow: finance vs tech recruiting comparison → Marcus asks CS help with Excel automation → Justin asks about financial modeling → internship offer salary negotiation tips
Dates: Feb through April

### Justin ↔ Sofia (~20 messages)
Topic flow: research methods class discussion → cognitive load theory applied to studying → Sofia's grad school apps → Justin sharing app season stress → mutual support
Dates: Feb through April

---

## Comments and Likes

**Rule: every shared note and flashcard set gets at least 2 comments and multiple likes.**

### On Justin's shared notes
Each note shared with friends gets comments from 2-4 friends:
- Academic discussion (e.g., "This DP explanation finally clicked for me")
- Questions (e.g., "Do you have practice problems for this?")
- Thanks (e.g., "Shared this with my study group, super helpful")

### On friends' shared notes/flashcard sets
Justin comments on at least 3 notes per friend.
Each shared set gets liked by 3-5 users.

### On flashcard sets
Comments like: "Used this before the midterm, scored 91%", "Missing a few edge cases on the tree questions", "Can you add more DP patterns?"

---

## Activity Feed

At least 15+ activity entries for Justin, visible to friends:
- `note_shared` — for each note Justin shares (5+)
- `flashcard_shared` — for each set Justin shares (8+)
- `task_created` — for the shared task
- `comment_added` — when Justin comments on friends' content
- `like_added` — when Justin likes friends' content

Friends also generate activities visible to Justin (so his feed is populated):
- Each friend shares 2+ pieces of content → shows in Justin's feed

---

## Implementation Notes

### Idempotency
Check for existing seed by looking up note title "Dynamic Programming: From Recursion to Optimization" for Justin's userId. If found, skip (or wipe if `--clean`).

### Groq Rate Limit Strategy
- Call `generateSummary()` for all 10 lecture/research notes
- Call `generateFlashcards()` for 10 AI flashcard sets
- Add 500ms delay between each call
- Wrap every call in try/catch — fall back to pre-written static content if Groq fails
- `--no-ai` flag skips all Groq calls entirely

### Password Validation
Seed users created with `Demo@1234` — satisfies User model validator (8+ chars, letter + number + special char).

### Friendship Hook
Mongoose pre-save hook on Friendship handles user1/user2 ordering — just pass both IDs and let it sort.

### Comment userSnapshot
Mongoose pre-save hook on Comment auto-populates `userSnapshot` from User — just call `Comment.create()` normally.

### Task completedAt
Mongoose pre-save hook on Task auto-sets `completedAt` when status changes to 'completed' — set `status: 'completed'` and the hook handles the rest.

### Script Execution Order
1. Connect to MongoDB (load `.env` from `../backend/.env`)
2. Find Justin by email — abort if not found
3. Create/upsert 6 seed friends
4. Create 6 accepted friendships (Justin ↔ each friend)
5. Create Justin's 25 notes (with Groq summaries)
6. Create friends' shared notes
7. Create Justin's 20 flashcard sets (with Groq cards)
8. Create friends' flashcard sets
9. Create Justin's 50+ tasks
10. Create Justin's 40+ applications
11. Create 6 conversations + messages
12. Create comments + likes on all shared content
13. Create activity feed entries
14. Update Justin's activityVisibility to 'friends'
15. Disconnect and exit

### Static Fallback Content
Pre-write `quickSummary` and `detailedSummary` for all 10 lecture/research notes in `seed-data.js`. Used when `--no-ai` is passed or Groq throws.

Pre-write 10-card arrays for all 10 AI flashcard sets in `seed-data.js`. Same fallback logic.
