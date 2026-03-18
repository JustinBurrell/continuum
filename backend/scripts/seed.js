// =============================================================================
// seed.js — Demo data seeder for Continuum
// =============================================================================
//
// Usage:
//   node backend/scripts/seed.js           # idempotent — skips if data exists
//   node backend/scripts/seed.js --clean   # wipes seed data and reseeds
//   node backend/scripts/seed.js --no-ai   # skips Groq calls, uses fallbacks
// =============================================================================

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const {
  User, Note, FlashcardSet, Flashcard, Task, Application,
  Friendship, Conversation, Message, Comment, Activity,
} = require('../models');
const { generateSummary, generateFlashcards } = require('../services/groq.service');
const seedData = require('./seed-data');

const CLEAN = process.argv.includes('--clean');
const NO_AI = process.argv.includes('--no-ai');

// ─── Seed Friend Data ───────────────────────────────────────────────────────

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

const SEED_USERNAMES = SEED_FRIENDS.map(f => f.username);

// ─── Clean Function ─────────────────────────────────────────────────────────

async function cleanSeedData(justinId) {
  console.log('Cleaning seed data...');

  // Look up seed friend IDs
  const seedUsers = await User.find({ username: { $in: SEED_USERNAMES } });
  const seedIds = seedUsers.map(u => u._id);
  const allIds = [justinId, ...seedIds];

  // Delete all seed-related data
  await Note.deleteMany({ userId: { $in: allIds } });
  await FlashcardSet.deleteMany({ userId: { $in: allIds } });
  await Flashcard.deleteMany({
    setId: { $in: (await FlashcardSet.find({ userId: { $in: allIds } }).select('_id')).map(s => s._id) },
  }).catch(() => {}); // sets already deleted, flashcards may be orphaned
  // Clean orphaned flashcards by looking for sets that no longer exist
  const existingSetIds = (await FlashcardSet.find().select('_id')).map(s => s._id);
  if (existingSetIds.length === 0) {
    await Flashcard.deleteMany({});
  }
  await Task.deleteMany({ userId: justinId });
  await Application.deleteMany({ userId: justinId });
  await Comment.deleteMany({ userId: { $in: allIds } });
  await Activity.deleteMany({ userId: { $in: allIds } });
  await Message.deleteMany({ senderId: { $in: allIds } });
  await Conversation.deleteMany({ participants: { $in: allIds } });
  await Friendship.deleteMany({
    $or: [
      { user1: { $in: allIds } },
      { user2: { $in: allIds } },
    ],
  });

  // Delete the seed friend users (NOT Justin)
  await User.deleteMany({ username: { $in: SEED_USERNAMES } });

  console.log('Clean complete.');
}

// ─── SECTION 1: Seed Users ──────────────────────────────────────────────────

async function seedFriends() {
  console.log('Seeding friend users...');
  const friends = [];

  for (const data of SEED_FRIENDS) {
    let user = await User.findOne({ username: data.username });
    if (!user) {
      user = new User(data);
      await user.save();
      console.log(`  Created user: ${data.username}`);
    } else {
      console.log(`  User exists: ${data.username}`);
    }
    friends.push(user);
  }

  return friends;
}

// ─── SECTION 2: Friendships ─────────────────────────────────────────────────

async function seedFriendships(justin, friends) {
  console.log('Seeding friendships...');

  // Justin <-> each friend
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

  // Inter-friend friendships
  const friendMap = {};
  for (const f of friends) {
    friendMap[f.username] = f;
  }

  const interFriendPairs = [
    ['alexchen_cs', 'mayapatel_ds'],
    ['alexchen_cs', 'jordanwilliams'],
    ['mayapatel_ds', 'priyasharma'],
    ['marcusjohnson', 'sofiarod'],
    ['jordanwilliams', 'marcusjohnson'],
  ];

  for (const [u1, u2] of interFriendPairs) {
    const f1 = friendMap[u1];
    const f2 = friendMap[u2];
    const existing = await Friendship.findOne({
      $or: [
        { user1: f1._id, user2: f2._id },
        { user1: f2._id, user2: f1._id },
      ],
    });
    if (!existing) {
      const f = new Friendship({
        user1: f1._id,
        user2: f2._id,
        requestedBy: f1._id,
        status: 'accepted',
        requestedAt: new Date('2026-01-23'),
        respondedAt: new Date('2026-01-24'),
      });
      await f.save();
    }
  }

  console.log('  Friendships created.');
}

// ─── SECTION 3: Justin's Notes ──────────────────────────────────────────────

async function seedJustinNotes(justin, friends) {
  console.log('Seeding Justin\'s notes...');
  const allFriendIds = friends.map(f => f._id);
  const notes = [];

  // Date spread: lecture/research (0-9) across Jan 20 - Mar 15
  //              general (10-14) across Feb 1 - Mar 10
  //              todo (15-19) across Mar 1 - Apr 5
  //              journal (20-24) across Feb 9 - Apr 26
  const dateMap = [
    '2026-01-22', '2026-01-28', '2026-02-03', '2026-02-08', '2026-02-14', // 0-4
    '2026-02-19', '2026-02-25', '2026-03-02', '2026-03-07', '2026-03-12', // 5-9
    '2026-02-01', '2026-02-06', '2026-02-11', '2026-02-16', '2026-02-21', // 10-14
    '2026-03-01', '2026-03-05', '2026-03-08', '2026-03-16', '2026-03-20', // 15-19
    '2026-02-09', '2026-03-01', '2026-03-15', '2026-04-05', '2026-04-26', // 20-24
  ];

  // Notes with hasFlashcards = true: indices 0-5, 7-9 (not 6 originally, but spec says 0-5 and 7-9)
  const hasFlashcardsIndices = [0, 1, 2, 3, 4, 5, 7, 8, 9];
  // Notes indices 1 and 2 have visibility 'specific' with all friends
  const specificIndices = [1, 2];

  for (let i = 0; i < seedData.justinNotes.length; i++) {
    const noteData = seedData.justinNotes[i];
    const sharedWith = specificIndices.includes(i) ? allFriendIds : [];

    const note = await Note.create({
      userId: justin._id,
      title: noteData.title,
      content: noteData.content,
      contentType: 'markdown',
      type: noteData.type,
      tags: noteData.tags,
      subject: noteData.subject,
      visibility: noteData.visibility,
      sharedWith,
      isPinned: noteData.isPinned,
      hasFlashcards: hasFlashcardsIndices.includes(i),
    });

    // Update createdAt
    await Note.updateOne({ _id: note._id }, { createdAt: new Date(dateMap[i]) });

    // AI summaries for notes 0-9
    if (i < 10) {
      let summary;
      if (!NO_AI) {
        try {
          await new Promise(r => setTimeout(r, 500));
          const result = await generateSummary(noteData.content, justin._id);
          summary = {
            quickSummary: result.quickSummary,
            detailedSummary: result.detailedSummary,
            generatedAt: new Date(),
            model: result.model,
            tokenCount: result.tokenCount,
          };
        } catch (err) {
          console.log(`  AI summary failed for note ${i}, using fallback: ${err.message}`);
          summary = null;
        }
      }
      if (!summary) {
        const fb = seedData.noteSummaryFallbacks[i];
        summary = {
          quickSummary: fb.quickSummary,
          detailedSummary: fb.detailedSummary,
          generatedAt: new Date(),
          model: 'fallback',
          tokenCount: 0,
        };
      }
      await Note.updateOne({ _id: note._id }, { summary });
    }

    notes.push(note);
    console.log(`  Note ${i}: ${noteData.title}`);
  }

  return notes;
}

// ─── SECTION 4: Friends' Notes ──────────────────────────────────────────────

async function seedFriendNotes(friends) {
  console.log('Seeding friend notes...');
  const friendNoteMap = {}; // username -> [noteDoc]

  const friendDateStart = new Date('2026-02-01');

  for (const friend of friends) {
    const notesData = seedData.friendNotes[friend.username];
    if (!notesData) continue;

    friendNoteMap[friend.username] = [];

    for (let i = 0; i < notesData.length; i++) {
      const nd = notesData[i];
      const note = await Note.create({
        userId: friend._id,
        title: nd.title,
        content: nd.content,
        contentType: 'markdown',
        type: 'general',
        tags: nd.tags,
        subject: nd.subject || '',
        visibility: 'friends',
        isPinned: false,
      });

      // Spread dates: each friend's notes over Feb-Mar
      const dayOffset = i * 7 + friends.indexOf(friend) * 3;
      const noteDate = new Date(friendDateStart);
      noteDate.setDate(noteDate.getDate() + dayOffset);
      await Note.updateOne({ _id: note._id }, { createdAt: noteDate });

      friendNoteMap[friend.username].push(note);
    }
    console.log(`  ${friend.username}: ${notesData.length} notes`);
  }

  return friendNoteMap;
}

// ─── SECTION 5: Justin's Flashcard Sets ─────────────────────────────────────

async function seedJustinFlashcardSets(justin, justinNotes) {
  console.log('Seeding Justin\'s flashcard sets...');
  const allSets = [];

  // AI-generated sets (10) — linked to notes
  const aiSetDefs = [
    { title: 'Dynamic Programming Concepts', noteIndex: 0, visibility: 'friends' },
    { title: 'OS Scheduling Algorithms', noteIndex: 1, visibility: 'friends' },
    { title: 'Neural Network Key Terms', noteIndex: 5, visibility: 'friends' },
    { title: 'Distributed Systems Vocab', noteIndex: 6, visibility: 'friends' },
    { title: 'TCP/IP and Networking', noteIndex: 2, visibility: 'friends' },
    { title: 'Database Systems Review', noteIndex: 3, visibility: 'friends' },
    { title: 'Cryptography Basics', noteIndex: 7, visibility: 'friends' },
    { title: 'Graph Algorithm Vocab', noteIndex: 9, visibility: 'friends' },
    { title: 'Compiler Terminology', noteIndex: 4, visibility: 'private' },
    { title: 'Quantum Computing Intro Terms', noteIndex: 8, visibility: 'friends' },
  ];

  for (let i = 0; i < aiSetDefs.length; i++) {
    const def = aiSetDefs[i];
    const sourceNote = justinNotes[def.noteIndex];

    let cards;
    if (!NO_AI) {
      try {
        await new Promise(r => setTimeout(r, 500));
        const result = await generateFlashcards(sourceNote.content || seedData.justinNotes[def.noteIndex].content, justin._id);
        cards = result.cards;
      } catch (err) {
        console.log(`  AI flashcards failed for set ${i}, using fallback: ${err.message}`);
        cards = null;
      }
    }
    if (!cards) {
      cards = seedData.flashcardFallbacks[i];
    }

    const set = await FlashcardSet.create({
      userId: justin._id,
      noteId: sourceNote._id,
      title: def.title,
      description: `AI-generated flashcards from "${seedData.justinNotes[def.noteIndex].title}"`,
      totalCards: cards.length,
      visibility: def.visibility,
      isAIGenerated: true,
      generatedAt: new Date(),
      studySessionCount: Math.floor(Math.random() * 5) + 1,
      lastStudiedAt: new Date('2026-03-10'),
    });

    for (let j = 0; j < cards.length; j++) {
      await Flashcard.create({
        setId: set._id,
        front: cards[j].front,
        back: cards[j].back,
        order: j,
      });
    }

    // Update source note hasFlashcards
    await Note.updateOne({ _id: sourceNote._id }, { hasFlashcards: true });

    allSets.push(set);
    console.log(`  AI Set ${i}: ${def.title} (${cards.length} cards)`);
  }

  // Manual sets (10) — no linked note
  for (let i = 0; i < seedData.manualFlashcardSets.length; i++) {
    const ms = seedData.manualFlashcardSets[i];

    const set = await FlashcardSet.create({
      userId: justin._id,
      noteId: null,
      title: ms.title,
      description: ms.description,
      totalCards: ms.cards.length,
      visibility: ms.visibility,
      isAIGenerated: false,
      studySessionCount: Math.floor(Math.random() * 3),
      lastStudiedAt: new Date('2026-03-08'),
    });

    for (let j = 0; j < ms.cards.length; j++) {
      await Flashcard.create({
        setId: set._id,
        front: ms.cards[j].front,
        back: ms.cards[j].back,
        order: j,
      });
    }

    allSets.push(set);
    console.log(`  Manual Set ${i + 10}: ${ms.title} (${ms.cards.length} cards)`);
  }

  return allSets;
}

// ─── SECTION 6: Friends' Flashcard Sets ─────────────────────────────────────

async function seedFriendFlashcardSets(friends) {
  console.log('Seeding friend flashcard sets...');
  const friendSetMap = {}; // username -> [setDoc]

  for (const friend of friends) {
    const setsData = seedData.friendFlashcardSets[friend.username];
    if (!setsData) continue;

    friendSetMap[friend.username] = [];

    for (let i = 0; i < setsData.length; i++) {
      const sd = setsData[i];
      const set = await FlashcardSet.create({
        userId: friend._id,
        noteId: null,
        title: sd.title,
        description: sd.description || `${friend.firstName}'s ${sd.title} flashcard set`,
        totalCards: sd.cards.length,
        visibility: 'friends',
        isAIGenerated: false,
        studySessionCount: Math.floor(Math.random() * 4) + 1,
        lastStudiedAt: new Date('2026-03-05'),
      });

      for (let j = 0; j < sd.cards.length; j++) {
        await Flashcard.create({
          setId: set._id,
          front: sd.cards[j].front,
          back: sd.cards[j].back,
          order: j,
        });
      }

      friendSetMap[friend.username].push(set);
    }
    console.log(`  ${friend.username}: ${setsData.length} sets`);
  }

  return friendSetMap;
}

// ─── SECTION 7: Tasks ───────────────────────────────────────────────────────

async function seedTasks(justin, friends) {
  console.log('Seeding tasks...');
  const friendMap = {};
  for (const f of friends) friendMap[f.username] = f;

  const allTasks = [
    // homework (8)
    { title: 'Submit Assignment 1: Big-O Analysis', type: 'homework', status: 'completed', priority: 'high', dueDate: '2026-01-28', duration: 120, description: 'Analyze time/space complexity of 5 algorithms. Submit on Gradescope.' },
    { title: 'Submit Assignment 2: Linked List Implementation', type: 'homework', status: 'completed', priority: 'high', dueDate: '2026-02-10', duration: 180, description: 'Implement singly and doubly linked lists in Java with iterator support.' },
    { title: 'Submit Assignment 3: Red-Black Trees', type: 'homework', status: 'completed', priority: 'high', dueDate: '2026-02-24', duration: 240, description: 'Implement insert and delete for red-black trees. Include balancing rotations.' },
    { title: 'Submit Assignment 4: DP Coin Change', type: 'homework', status: 'in_progress', priority: 'high', dueDate: '2026-03-20', duration: 180, description: 'Solve coin change with memoization and tabulation. Compare approaches.' },
    { title: 'Implement Graph Traversal BFS/DFS', type: 'homework', status: 'todo', priority: 'medium', dueDate: '2026-03-27', duration: 120, description: 'Implement BFS and DFS on adjacency list. Include cycle detection.' },
    { title: 'Write Compiler Lexer in Java', type: 'homework', status: 'todo', priority: 'medium', dueDate: '2026-04-03', duration: 180, description: 'Build a lexer for a subset of C. Tokenize keywords, operators, literals.' },
    { title: 'SQL Query Optimization Lab', type: 'homework', status: 'todo', priority: 'medium', dueDate: '2026-04-10', duration: 120, description: 'Analyze query execution plans. Add indexes to improve 5 slow queries.' },
    { title: 'Final Project Report Draft', type: 'homework', status: 'todo', priority: 'high', dueDate: '2026-04-17', duration: 300, description: 'Write 10-page report on distributed KV store architecture and benchmarks.' },
    // study (8)
    { title: 'Study for OS Midterm', type: 'study', status: 'completed', priority: 'high', dueDate: '2026-02-20', duration: 240, description: 'Review process scheduling, memory management, and synchronization.' },
    { title: 'Review Data Structures for Midterm', type: 'study', status: 'completed', priority: 'high', dueDate: '2026-02-18', duration: 240, description: 'Trees, heaps, hash tables, graphs. Practice problems from textbook Ch 4-8.' },
    { title: 'Flashcard Review: DP Concepts', type: 'study', status: 'completed', priority: 'medium', dueDate: '2026-03-05', duration: 60, description: 'Run through DP flashcard set. Focus on optimal substructure and overlapping subproblems.' },
    { title: 'Study for Networks Quiz', type: 'study', status: 'in_progress', priority: 'high', dueDate: '2026-03-19', duration: 120, description: 'TCP handshake, congestion control, HTTP/2 vs HTTP/3.' },
    { title: 'Compilers Midterm Prep', type: 'study', status: 'todo', priority: 'high', dueDate: '2026-03-26', duration: 240, description: 'Lexing, parsing (LL/LR), AST construction, type checking.' },
    { title: 'Database Final Exam Study Session', type: 'study', status: 'todo', priority: 'high', dueDate: '2026-04-09', duration: 300, description: 'Normalization, transactions, ACID, concurrency control, query optimization.' },
    { title: 'Algorithm Final Review', type: 'study', status: 'todo', priority: 'high', dueDate: '2026-04-14', duration: 300, description: 'DP, greedy, graph algorithms, NP-completeness, amortized analysis.' },
    { title: 'Systems Design Interview Prep', type: 'study', status: 'todo', priority: 'medium', dueDate: '2026-04-20', duration: 180, description: 'Practice designing URL shortener, chat system, and news feed.' },
    // project (7)
    { title: 'Final Project: Distributed Key-Value Store', type: 'project', status: 'in_progress', priority: 'high', dueDate: '2026-04-25', duration: 600, description: 'Raft consensus, consistent hashing, gRPC communication layer.' },
    { title: 'Build REST API with Express', type: 'project', status: 'completed', priority: 'medium', dueDate: '2026-02-07', duration: 300, description: 'CRUD endpoints for notes and tasks. JWT auth middleware.' },
    { title: 'Design Database Schema for Group Project', type: 'project', status: 'completed', priority: 'high', dueDate: '2026-02-28', duration: 180, description: 'ER diagram, collection design, index strategy for KV store metadata.' },
    { title: 'Implement Authentication Module', type: 'project', status: 'completed', priority: 'high', dueDate: '2026-03-07', duration: 240, description: 'JWT tokens, refresh flow, password hashing, rate limiting.' },
    { title: 'Write Unit Tests for KV Store', type: 'project', status: 'todo', priority: 'medium', dueDate: '2026-04-11', duration: 180, description: 'Jest test suite for put/get/delete operations. Mock Raft consensus.' },
    { title: 'Deploy Project to Heroku', type: 'project', status: 'todo', priority: 'low', dueDate: '2026-04-22', duration: 120, description: 'Dockerize, set up CI/CD pipeline, configure environment variables.' },
    { title: 'Record Project Demo Video', type: 'project', status: 'todo', priority: 'medium', dueDate: '2026-04-28', duration: 120, description: '5-minute walkthrough of architecture, live demo of key operations.' },
    // exam (6)
    { title: 'CS 211 Data Structures Midterm', type: 'exam', status: 'completed', priority: 'high', dueDate: '2026-02-19', duration: 120, description: 'Covers arrays through balanced BSTs. 2 hours, closed book.' },
    { title: 'CS 301 Operating Systems Midterm', type: 'exam', status: 'completed', priority: 'high', dueDate: '2026-02-26', duration: 120, description: 'Processes, threads, scheduling, deadlocks. Open note.' },
    { title: 'CS 350 Networks Quiz', type: 'exam', status: 'completed', priority: 'medium', dueDate: '2026-03-05', duration: 45, description: 'Application and transport layer protocols. 45 minutes.' },
    { title: 'CS 211 Data Structures Final', type: 'exam', status: 'todo', priority: 'high', dueDate: '2026-04-16', duration: 120, description: 'Comprehensive. DP, graphs, NP-completeness added.' },
    { title: 'CS 301 OS Final Exam', type: 'exam', status: 'todo', priority: 'high', dueDate: '2026-04-23', duration: 120, description: 'Full semester. File systems and security added to midterm topics.' },
    { title: 'CS 320 Compilers Final', type: 'exam', status: 'todo', priority: 'high', dueDate: '2026-04-21', duration: 120, description: 'Lexing through code generation. Includes optimization passes.' },
    // club (5)
    { title: 'ACM Weekly Meeting: Feb 5', type: 'club', status: 'completed', priority: 'low', dueDate: '2026-02-05', duration: 60, description: 'Guest speaker on open source contributions.' },
    { title: 'ACM Weekly Meeting: Feb 19', type: 'club', status: 'completed', priority: 'low', dueDate: '2026-02-19', duration: 60, description: 'LeetCode contest practice session.' },
    { title: 'HackIllinois Prep Session', type: 'club', status: 'completed', priority: 'medium', dueDate: '2026-03-01', duration: 120, description: 'Form teams, brainstorm project ideas, set up dev environments.' },
    { title: 'ACM Weekly Meeting: Mar 5', type: 'club', status: 'completed', priority: 'low', dueDate: '2026-03-05', duration: 60, description: 'Mock interview workshop with industry mentors.' },
    { title: 'ACM Spring Hackathon', type: 'club', status: 'todo', priority: 'medium', dueDate: '2026-04-12', duration: 1440, description: '24-hour hackathon. Theme: developer tools.' },
    // professional (7)
    { title: 'Update LinkedIn Profile', type: 'professional', status: 'completed', priority: 'medium', dueDate: '2026-01-25', duration: 60, description: 'Add fall semester projects, update skills section.' },
    { title: 'Tailor Resume for Google Application', type: 'professional', status: 'completed', priority: 'high', dueDate: '2026-01-30', duration: 90, description: 'Highlight distributed systems coursework and API project.' },
    { title: 'Submit Google SWE Intern Application', type: 'professional', status: 'completed', priority: 'high', dueDate: '2026-02-01', duration: 60, description: 'Applied via careers.google.com. Referral from ACM alum.' },
    { title: 'Prep for Stripe Technical Screen', type: 'professional', status: 'completed', priority: 'high', dueDate: '2026-02-15', duration: 180, description: 'Practice API design questions, payments domain knowledge.' },
    { title: 'Send Thank You to Google Recruiter', type: 'professional', status: 'completed', priority: 'medium', dueDate: '2026-03-03', duration: 15, description: 'Email Sarah Kim after the technical screen.' },
    { title: 'Research Companies for Fall Recruiting', type: 'professional', status: 'todo', priority: 'low', dueDate: '2026-04-05', duration: 120, description: 'Make list of companies with fall 2026 new grad openings.' },
    { title: 'Finalize Internship Decision', type: 'professional', status: 'todo', priority: 'high', dueDate: '2026-04-15', duration: 60, description: 'Compare Stripe, HubSpot, Shopify offers. Deadline Apr 15.' },
    // personal (5)
    { title: 'Buy Algorithm Design textbook', type: 'personal', status: 'completed', priority: 'medium', dueDate: '2026-01-22', duration: 30, description: 'Kleinberg & Tardos, 2nd edition. Check campus bookstore first.' },
    { title: 'Set up development environment', type: 'personal', status: 'completed', priority: 'high', dueDate: '2026-01-21', duration: 120, description: 'Install Node 20, MongoDB, VS Code extensions, configure ESLint.' },
    { title: 'Schedule advisor meeting', type: 'personal', status: 'completed', priority: 'medium', dueDate: '2026-02-03', duration: 30, description: 'Discuss fall course selection and research opportunities.' },
    { title: 'Register for Fall 2026 classes', type: 'personal', status: 'todo', priority: 'high', dueDate: '2026-04-08', duration: 60, description: 'Priority: ML, Distributed Systems, Security. Backup: Graphics.' },
    { title: 'Buy new laptop charger', type: 'personal', status: 'todo', priority: 'low', dueDate: '2026-03-30', duration: 15, description: 'MacBook Pro USB-C charger. Check Amazon vs Apple Store.' },
    // other (6)
    { title: 'Watch MIT OCW: Advanced Algorithms Lecture 5', type: 'other', status: 'completed', priority: 'low', dueDate: '2026-02-08', duration: 90, description: 'Amortized analysis and Fibonacci heaps.' },
    { title: 'Read "Designing Data-Intensive Applications" Ch 1-2', type: 'other', status: 'completed', priority: 'medium', dueDate: '2026-02-22', duration: 120, description: 'Foundations of data systems, data models and query languages.' },
    { title: 'Write blog post: What I Learned from My First LeetCode 150', type: 'other', status: 'todo', priority: 'low', dueDate: '2026-04-03', duration: 120, description: 'Reflect on patterns, time management, and growth mindset.' },
    { title: 'Explore Rust for Systems Programming', type: 'other', status: 'todo', priority: 'low', dueDate: '2026-04-07', duration: 180, description: 'Work through Rust Book chapters 1-4. Build a CLI tool.' },
    { title: 'Set up personal portfolio website', type: 'other', status: 'in_progress', priority: 'medium', dueDate: '2026-04-20', duration: 300, description: 'Next.js + Tailwind. Deploy on Vercel. Showcase 3 projects.' },
    { title: 'Read "Clean Code" Ch 3-5', type: 'other', status: 'todo', priority: 'low', dueDate: '2026-03-28', duration: 90, description: 'Functions, comments, and formatting. Take notes.' },
  ];

  const createdTasks = [];
  for (const t of allTasks) {
    const task = await Task.create({
      userId: justin._id,
      title: t.title,
      type: t.type,
      status: t.status,
      priority: t.priority,
      dueDate: new Date(t.dueDate),
      duration: t.duration || 60,
      description: t.description,
    });
    createdTasks.push(task);
  }

  // Shared task
  const alexId = friendMap.alexchen_cs._id;
  const sharedTask = await Task.create({
    userId: justin._id,
    title: 'Group Project: System Design Document',
    type: 'project',
    status: 'in_progress',
    priority: 'high',
    dueDate: new Date('2026-04-04'),
    description: 'Co-authored system design doc for distributed KV store. Covers architecture, data flow, and failure modes.',
    isShared: true,
    participants: [{ userId: alexId, status: 'in_progress' }],
  });
  createdTasks.push(sharedTask);

  console.log(`  Created ${createdTasks.length} tasks.`);
  return createdTasks;
}

// ─── SECTION 8: Applications ────────────────────────────────────────────────

async function seedApplications(justin) {
  console.log('Seeding applications...');

  const apps = [
    // draft (6)
    { company: 'Airbnb', position: 'Software Engineering Intern', location: 'San Francisco, CA', status: 'draft', notes: 'Need to tailor resume for marketplace/payments team.' },
    { company: 'Lyft', position: 'Software Engineering Intern', location: 'San Francisco, CA', status: 'draft', notes: 'Focus on distributed systems experience.' },
    { company: 'Twitter/X', position: 'Software Engineering Intern', location: 'San Francisco, CA', status: 'draft', notes: 'Research recent engineering blog posts.' },
    { company: 'Salesforce', position: 'Software Engineering Intern', location: 'San Francisco, CA', status: 'draft', notes: 'Check if they have a cloud infrastructure team.' },
    { company: 'Adobe', position: 'Software Engineering Intern', location: 'San Jose, CA', status: 'draft', notes: 'Creative Cloud or Document Cloud team preferred.' },
    { company: 'Robinhood', position: 'Software Engineering Intern', location: 'Menlo Park, CA', status: 'draft', notes: 'Fintech angle — mention Marcus finance connection.' },
    // applied (8)
    { company: 'Meta', position: 'Software Engineering Intern', location: 'Menlo Park, CA', status: 'applied', appliedAt: '2026-02-02', notes: 'Applied to Infrastructure team. Heard back takes 2-4 weeks.' },
    { company: 'Microsoft', position: 'Software Engineering Intern', location: 'Redmond, WA', status: 'applied', appliedAt: '2026-02-05', notes: 'Applied to Azure team. Got auto-confirmation email.' },
    { company: 'Uber', position: 'Software Engineering Intern', location: 'San Francisco, CA', status: 'applied', appliedAt: '2026-02-10', notes: 'Referral from Jordan\'s roommate.' },
    { company: 'LinkedIn', position: 'Software Engineering Intern', location: 'Sunnyvale, CA', status: 'applied', appliedAt: '2026-02-12', notes: 'Applied via university portal.' },
    { company: 'Coinbase', position: 'Software Engineering Intern', location: 'Remote', status: 'applied', appliedAt: '2026-02-15', notes: 'Crypto/blockchain team. Mentioned distributed systems coursework.' },
    { company: 'DoorDash', position: 'Software Engineering Intern', location: 'San Francisco, CA', status: 'applied', appliedAt: '2026-02-18', notes: 'Logistics/routing team.' },
    { company: 'Netflix', position: 'Software Engineering Intern', location: 'Los Gatos, CA', status: 'applied', appliedAt: '2026-02-20', notes: 'Streaming infrastructure team. Long shot but worth trying.' },
    { company: 'Palantir', position: 'Software Engineering Intern', location: 'New York, NY', status: 'applied', appliedAt: '2026-02-22', notes: 'Forward Deployed Engineer track.' },
    // interview (8)
    { company: 'Google', position: 'Software Engineering Intern', location: 'Mountain View, CA', status: 'interview', appliedAt: '2026-02-01', interviewDates: ['2026-02-20', '2026-03-10'], notes: 'Technical screen done. On-site loop scheduled Mar 10. Focus: coding + system design.', contacts: [{ name: 'Sarah Kim', role: 'University Recruiter', email: 'sarahkim@google.com', lastContactDate: new Date('2026-03-03'), notes: 'Very responsive. Sent prep materials.' }], followUpReminders: [{ date: new Date('2026-03-15'), description: 'Follow up on loop results', completed: false }] },
    { company: 'Apple', position: 'Software Engineering Intern', location: 'Cupertino, CA', status: 'interview', appliedAt: '2026-02-03', interviewDates: ['2026-02-25'], notes: 'First round phone screen completed. Waiting for next steps.', contacts: [{ name: 'David Park', role: 'Engineering Manager', email: 'dpark@apple.com', lastContactDate: new Date('2026-02-25'), notes: 'Interviewed me for the WebKit team.' }], followUpReminders: [{ date: new Date('2026-03-05'), description: 'Check in about next round', completed: false }] },
    { company: 'Nvidia', position: 'Software Engineering Intern', location: 'Santa Clara, CA', status: 'interview', appliedAt: '2026-02-08', interviewDates: ['2026-03-01'], notes: 'Technical screen focused on GPU programming concepts.', contacts: [{ name: 'Lisa Chen', role: 'Technical Recruiter', lastContactDate: new Date('2026-03-01'), notes: 'Said results in 1-2 weeks.' }], followUpReminders: [{ date: new Date('2026-03-14'), description: 'Follow up on screen results', completed: false }] },
    { company: 'Jane Street', position: 'Quantitative Developer Intern', location: 'New York, NY', status: 'interview', appliedAt: '2026-01-28', interviewDates: ['2026-02-15'], notes: 'OA completed. Heavy on math and probability.', contacts: [], followUpReminders: [] },
    { company: 'Two Sigma', position: 'Software Engineering Intern', location: 'New York, NY', status: 'interview', appliedAt: '2026-02-01', interviewDates: ['2026-02-22'], notes: 'First interview done. Systems design focus.', contacts: [{ name: 'Rachel Lee', role: 'Campus Recruiter', lastContactDate: new Date('2026-02-22'), notes: 'Mentioned second round in March.' }], followUpReminders: [{ date: new Date('2026-03-08'), description: 'Ask about second round scheduling', completed: false }] },
    { company: 'Figma', position: 'Software Engineering Intern', location: 'San Francisco, CA', status: 'interview', appliedAt: '2026-02-05', interviewDates: ['2026-03-05'], notes: 'Design + coding round. Build a collaborative feature.', contacts: [], followUpReminders: [{ date: new Date('2026-03-12'), description: 'Follow up on round results', completed: false }] },
    { company: 'Notion', position: 'Software Engineering Intern', location: 'San Francisco, CA', status: 'interview', appliedAt: '2026-02-07', interviewDates: ['2026-03-03'], notes: 'Values interview completed. Discussed productivity tooling passion.', contacts: [], followUpReminders: [{ date: new Date('2026-03-10'), description: 'Check for next steps', completed: false }] },
    { company: 'Vercel', position: 'Software Engineering Intern', location: 'Remote', status: 'interview', appliedAt: '2026-02-10', interviewDates: ['2026-03-06'], notes: 'Technical screen on Next.js and edge computing.', contacts: [], followUpReminders: [{ date: new Date('2026-03-13'), description: 'Follow up on technical screen', completed: false }] },
    // offer (4)
    { company: 'Stripe', position: 'Software Engineering Intern', location: 'San Francisco, CA', status: 'offer', appliedAt: '2026-01-25', interviewDates: ['2026-02-10', '2026-02-18'], offerReceivedAt: '2026-02-28', deadlineDate: '2026-04-15', salary: '$58/hr', notes: 'Payments infrastructure team. Best offer so far. 12-week program.', contacts: [{ name: 'Mike Thompson', role: 'Engineering Manager', email: 'mthompson@stripe.com', lastContactDate: new Date('2026-02-28'), notes: 'Sent offer letter. Very welcoming team.' }], followUpReminders: [{ date: new Date('2026-04-10'), description: 'Make final decision before deadline', completed: false }] },
    { company: 'HubSpot', position: 'Software Engineering Intern', location: 'Cambridge, MA', status: 'offer', appliedAt: '2026-01-28', interviewDates: ['2026-02-12', '2026-02-20'], offerReceivedAt: '2026-03-05', deadlineDate: '2026-04-15', salary: '$50/hr', notes: 'CRM platform team. Good culture, hybrid work.', contacts: [{ name: 'Emily Watson', role: 'Recruiter', lastContactDate: new Date('2026-03-05'), notes: 'Sent benefits package details.' }], followUpReminders: [{ date: new Date('2026-04-10'), description: 'Decide on offer', completed: false }] },
    { company: 'Shopify', position: 'Software Engineering Intern', location: 'Remote', status: 'offer', appliedAt: '2026-02-01', interviewDates: ['2026-02-18', '2026-02-28'], offerReceivedAt: '2026-03-10', salary: '$52/hr (CAD adjusted)', notes: 'Commerce platform. Fully remote. Good mentorship program.', contacts: [], followUpReminders: [{ date: new Date('2026-04-10'), description: 'Respond to offer', completed: false }] },
    { company: 'Twilio', position: 'Software Engineering Intern', location: 'San Francisco, CA', status: 'offer', appliedAt: '2026-02-03', interviewDates: ['2026-02-20', '2026-03-01'], offerReceivedAt: '2026-03-12', salary: '$48/hr', notes: 'Communications API team. Interesting product but lower comp.', contacts: [], followUpReminders: [{ date: new Date('2026-04-10'), description: 'Respond to offer', completed: false }] },
    // rejected (8)
    { company: 'Amazon', position: 'Software Engineering Intern', location: 'Seattle, WA', status: 'rejected', appliedAt: '2026-01-25', notes: 'OA score was borderline. Need more LC practice.' },
    { company: 'Goldman Sachs', position: 'Software Engineering Intern', location: 'New York, NY', status: 'rejected', appliedAt: '2026-01-27', notes: 'Rejected after HireVue. Finance questions caught me off guard.' },
    { company: 'Citadel', position: 'Software Engineering Intern', location: 'Chicago, IL', status: 'rejected', appliedAt: '2026-01-28', notes: 'Did not pass the OA. Need stronger math foundation.' },
    { company: 'Roblox', position: 'Software Engineering Intern', location: 'San Mateo, CA', status: 'rejected', appliedAt: '2026-02-01', notes: 'No response after 4 weeks. Assumed rejection.' },
    { company: 'ByteDance', position: 'Software Engineering Intern', location: 'San Jose, CA', status: 'rejected', appliedAt: '2026-02-03', notes: 'Rejected after phone screen. Interviewer focused heavily on system design.' },
    { company: 'Snap', position: 'Software Engineering Intern', location: 'Santa Monica, CA', status: 'rejected', appliedAt: '2026-02-05', notes: 'Form rejection email. Very competitive cycle.' },
    { company: 'Pinterest', position: 'Software Engineering Intern', location: 'San Francisco, CA', status: 'rejected', appliedAt: '2026-02-08', notes: 'Position filled before my application was reviewed.' },
    { company: 'Datadog', position: 'Software Engineering Intern', location: 'New York, NY', status: 'rejected', appliedAt: '2026-02-10', notes: 'Made it to final round but did not receive offer.' },
    // withdrawn (6)
    { company: 'Zillow', position: 'Software Engineering Intern', location: 'Seattle, WA', status: 'withdrawn', appliedAt: '2026-01-30', notes: 'Withdrew after receiving Stripe offer. Did not want to continue process.' },
    { company: 'Dropbox', position: 'Software Engineering Intern', location: 'San Francisco, CA', status: 'withdrawn', appliedAt: '2026-02-01', notes: 'Withdrew to reduce interview load.' },
    { company: 'Asana', position: 'Software Engineering Intern', location: 'San Francisco, CA', status: 'withdrawn', appliedAt: '2026-02-03', notes: 'Timeline did not align with my schedule.' },
    { company: 'Box', position: 'Software Engineering Intern', location: 'Redwood City, CA', status: 'withdrawn', appliedAt: '2026-02-05', notes: 'Withdrew after getting enough active interviews.' },
    { company: 'Qualtrics', position: 'Software Engineering Intern', location: 'Provo, UT', status: 'withdrawn', appliedAt: '2026-02-08', notes: 'Location was not ideal. Withdrew early.' },
    { company: 'Okta', position: 'Software Engineering Intern', location: 'San Francisco, CA', status: 'withdrawn', appliedAt: '2026-02-10', notes: 'Withdrew to focus on top-choice companies.' },
  ];

  for (const a of apps) {
    const appData = {
      userId: justin._id,
      company: a.company,
      position: a.position,
      location: a.location,
      status: a.status,
      notes: a.notes,
    };
    if (a.appliedAt) appData.appliedAt = new Date(a.appliedAt);
    if (a.interviewDates) appData.interviewDates = a.interviewDates.map(d => new Date(d));
    if (a.offerReceivedAt) appData.offerReceivedAt = new Date(a.offerReceivedAt);
    if (a.deadlineDate) appData.deadlineDate = new Date(a.deadlineDate);
    if (a.salary) appData.salary = a.salary;
    if (a.contacts) appData.contacts = a.contacts;
    if (a.followUpReminders) appData.followUpReminders = a.followUpReminders;

    await Application.create(appData);
  }

  console.log(`  Created ${apps.length} applications.`);
}

// ─── SECTION 9: Conversations & Messages ────────────────────────────────────

async function seedConversations(justin, friends) {
  console.log('Seeding conversations...');
  const friendMap = {};
  for (const f of friends) friendMap[f.username] = f;

  const convKeys = [
    { key: 'alex', username: 'alexchen_cs' },
    { key: 'maya', username: 'mayapatel_ds' },
    { key: 'jordan', username: 'jordanwilliams' },
    { key: 'priya', username: 'priyasharma' },
    { key: 'marcus', username: 'marcusjohnson' },
    { key: 'sofia', username: 'sofiarod' },
  ];

  for (const { key, username } of convKeys) {
    const friend = friendMap[username];
    const msgsData = seedData.conversations[key];
    if (!msgsData || !friend) continue;

    // Create conversation
    const conv = await Conversation.create({
      participants: [justin._id, friend._id],
      unreadCounts: [
        { userId: justin._id, count: 0 },
        { userId: friend._id, count: 0 },
      ],
    });

    // Create messages
    let lastMsg = null;
    for (const m of msgsData) {
      const senderId = m.sender === 'justin' ? justin._id : friend._id;
      const msgDate = new Date(m.date);

      const msg = await Message.create({
        conversationId: conv._id,
        senderId,
        content: m.content,
        readBy: [
          { userId: justin._id, readAt: msgDate },
          { userId: friend._id, readAt: msgDate },
        ],
      });

      // Set createdAt
      await Message.updateOne({ _id: msg._id }, { createdAt: msgDate });
      lastMsg = { senderId, content: m.content.slice(0, 200), sentAt: msgDate };
    }

    // Update conversation lastMessage
    if (lastMsg) {
      await Conversation.updateOne({ _id: conv._id }, { lastMessage: lastMsg });
    }

    console.log(`  ${key}: ${msgsData.length} messages`);
  }
}

// ─── SECTION 10: Comments & Likes ───────────────────────────────────────────

async function seedComments(justin, friends, justinNotes, friendNoteMap, justinSets, friendSetMap) {
  console.log('Seeding comments...');
  const friendMap = {};
  for (const f of friends) friendMap[f.username] = f;
  const allFriendIds = friends.map(f => f._id);

  const allComments = [];

  // Comments on Justin's shared notes
  for (const [noteIndexStr, comments] of Object.entries(seedData.justinNoteComments)) {
    const noteIndex = parseInt(noteIndexStr);
    const note = justinNotes[noteIndex];
    if (!note) continue;

    for (const c of comments) {
      const commenter = friendMap[c.username];
      if (!commenter) continue;

      const comment = await Comment.create({
        targetId: note._id,
        targetType: 'note',
        userId: commenter._id,
        content: c.content,
      });

      // Add 2-4 likes from random friends
      const likers = allFriendIds
        .filter(id => !id.equals(commenter._id))
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.floor(Math.random() * 3) + 2);
      await Comment.updateOne({ _id: comment._id }, { $push: { likes: { $each: likers } } });

      allComments.push(comment);
    }
  }

  // Justin's comments on friends' notes
  for (const [username, comments] of Object.entries(seedData.friendNoteComments)) {
    const friendNotesArr = friendNoteMap[username];
    if (!friendNotesArr) continue;

    for (const c of comments) {
      const note = friendNotesArr[c.noteIndex];
      if (!note) continue;

      const comment = await Comment.create({
        targetId: note._id,
        targetType: 'note',
        userId: justin._id,
        content: c.content,
      });

      // Add 2-3 likes
      const likers = allFriendIds
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.floor(Math.random() * 2) + 2);
      await Comment.updateOne({ _id: comment._id }, { $push: { likes: { $each: likers } } });

      allComments.push(comment);
    }
  }

  // Comments on flashcard sets
  for (const c of seedData.flashcardSetComments) {
    let targetSet;
    if (c.setOwner === 'justin') {
      targetSet = justinSets[c.setIndex];
    } else {
      const ownerSets = friendSetMap[c.setOwner];
      if (ownerSets) targetSet = ownerSets[c.setIndex];
    }
    if (!targetSet) continue;

    const commenter = c.username === 'justin' ? justin : friendMap[c.username];
    if (!commenter) continue;

    const commenterId = c.username === 'justin' ? justin._id : commenter._id;

    const comment = await Comment.create({
      targetId: targetSet._id,
      targetType: 'flashcardSet',
      userId: commenterId,
      content: c.content,
    });

    // Add 2-3 likes
    const possibleLikers = [justin._id, ...allFriendIds].filter(id => !id.equals(commenterId));
    const likers = possibleLikers
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.floor(Math.random() * 2) + 2);
    await Comment.updateOne({ _id: comment._id }, { $push: { likes: { $each: likers } } });

    allComments.push(comment);
  }

  console.log(`  Created ${allComments.length} comments with likes.`);
  return allComments;
}

// ─── SECTION 11: Activity Feed ──────────────────────────────────────────────

async function seedActivities(justin, friends, justinNotes, friendNoteMap, justinSets, friendSetMap, tasks, comments) {
  console.log('Seeding activities...');
  const allFriendIds = friends.map(f => f._id);
  const allIds = [justin._id, ...allFriendIds];
  let count = 0;

  // Activity dates spread across Feb-Apr
  let actDate = new Date('2026-02-05');
  const bumpDate = () => {
    actDate = new Date(actDate);
    actDate.setDate(actDate.getDate() + Math.floor(Math.random() * 3) + 1);
    return new Date(actDate);
  };

  // Justin's shared notes activities
  const sharedNoteIndices = [0, 1, 2, 5, 6, 10, 13];
  for (const i of sharedNoteIndices) {
    const note = justinNotes[i];
    if (!note) continue;
    await Activity.create({
      userId: justin._id,
      type: 'note_shared',
      targetId: note._id,
      targetType: 'note',
      visibleTo: allFriendIds,
      metadata: { noteTitle: seedData.justinNotes[i].title },
      createdAt: bumpDate(),
    });
    count++;
  }

  // Justin's shared flashcard set activities
  const sharedSetIndices = [0, 1, 2, 3, 4, 5, 6, 7, 9]; // indices into justinSets that are friends visibility
  for (const i of sharedSetIndices) {
    const set = justinSets[i];
    if (!set || set.visibility === 'private') continue;
    await Activity.create({
      userId: justin._id,
      type: 'flashcard_shared',
      targetId: set._id,
      targetType: 'flashcardSet',
      visibleTo: allFriendIds,
      metadata: { setTitle: set.title },
      createdAt: bumpDate(),
    });
    count++;
  }

  // Shared task activity
  const sharedTask = tasks.find(t => t.isShared);
  if (sharedTask) {
    await Activity.create({
      userId: justin._id,
      type: 'task_created',
      targetId: sharedTask._id,
      targetType: 'task',
      visibleTo: allFriendIds,
      metadata: { taskTitle: sharedTask.title },
      createdAt: bumpDate(),
    });
    count++;
  }

  // Justin's comment activities (pick 5)
  const justinComments = comments.filter(c => c.userId.equals(justin._id)).slice(0, 5);
  for (const comment of justinComments) {
    await Activity.create({
      userId: justin._id,
      type: 'comment_added',
      targetId: comment._id,
      targetType: 'comment',
      visibleTo: allFriendIds,
      metadata: { commentPreview: comment.content.slice(0, 100) },
      createdAt: bumpDate(),
    });
    count++;
  }

  // Friends' activities (2 notes + 1 flashcard set each = 3 per friend)
  for (const friend of friends) {
    const fNotes = friendNoteMap[friend.username];
    const fSets = friendSetMap[friend.username];

    // 2 note_shared activities
    if (fNotes) {
      for (let i = 0; i < Math.min(2, fNotes.length); i++) {
        await Activity.create({
          userId: friend._id,
          type: 'note_shared',
          targetId: fNotes[i]._id,
          targetType: 'note',
          visibleTo: [justin._id, ...allFriendIds.filter(id => !id.equals(friend._id))],
          metadata: { noteTitle: fNotes[i].title },
          createdAt: bumpDate(),
        });
        count++;
      }
    }

    // 1 flashcard_shared activity
    if (fSets && fSets.length > 0) {
      await Activity.create({
        userId: friend._id,
        type: 'flashcard_shared',
        targetId: fSets[0]._id,
        targetType: 'flashcardSet',
        visibleTo: [justin._id, ...allFriendIds.filter(id => !id.equals(friend._id))],
        metadata: { setTitle: fSets[0].title },
        createdAt: bumpDate(),
      });
      count++;
    }
  }

  console.log(`  Created ${count} activities.`);
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1. Find Justin
    const justin = await User.findOne({ email: 'justinburrell715@gmail.com' });
    if (!justin) {
      console.error('Justin not found — register with justinburrell715@gmail.com first.');
      process.exit(1);
    }
    console.log(`Found Justin: ${justin._id}`);

    // 2. Idempotency check
    const existing = await Note.findOne({
      userId: justin._id,
      title: 'Dynamic Programming: From Recursion to Optimization',
    });
    if (existing && !CLEAN) {
      console.log('Seed data already exists. Use --clean to reseed.');
      process.exit(0);
    }

    // 3. Clean if requested
    if (CLEAN) {
      await cleanSeedData(justin._id);
    }

    // 4. Seed users and friendships
    const friends = await seedFriends();
    await seedFriendships(justin, friends);

    // 5. Seed notes
    const justinNotes = await seedJustinNotes(justin, friends);
    const friendNoteMap = await seedFriendNotes(friends);

    // 6. Seed flashcard sets
    const justinSets = await seedJustinFlashcardSets(justin, justinNotes);
    const friendSetMap = await seedFriendFlashcardSets(friends);

    // 7. Seed tasks and applications
    const tasks = await seedTasks(justin, friends);
    await seedApplications(justin);

    // 8. Seed conversations
    await seedConversations(justin, friends);

    // 9. Seed comments and activities
    const comments = await seedComments(justin, friends, justinNotes, friendNoteMap, justinSets, friendSetMap);
    await seedActivities(justin, friends, justinNotes, friendNoteMap, justinSets, friendSetMap, tasks, comments);

    // 10. Update Justin's activity visibility
    await User.updateOne({ _id: justin._id }, { 'settings.activityVisibility': 'friends' });

    console.log('\nSeed complete!');
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

main();
