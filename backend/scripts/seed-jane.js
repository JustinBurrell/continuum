// =============================================================================
// seed-jane.js — Demo account seeder for Continuum (Jane Doe)
// =============================================================================
//
// Usage:
//   node backend/scripts/seed-jane.js              # idempotent — skips if Jane exists
//   node backend/scripts/seed-jane.js --clean      # wipes Jane's data and reseeds
//
// Multi-DB:
//   MONGO_URI=<uri> node backend/scripts/seed-jane.js   # targets a specific DB
//   (default: reads MONGODB_URI from backend/.env)
// =============================================================================

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const {
  User, Note, FlashcardSet, Flashcard, Task, Application,
  Friendship, Conversation, Message, Comment, Activity, StudySession,
  Notification,
} = require('../models');
const Resume = require('../models/Resume');
const { sendShareMessage } = require('../services/share.service');
const data = require('./seed-jane-data');

const CLEAN = process.argv.includes('--clean');

// ─── Jane's 20 friends (promoted from SEED_STRANGERS) ──────────────────────
const JANE_FRIEND_USERNAMES = [
  'carolinehall_demo', 'chrisnguyen_demo', 'connorflynn_demo', 'dianachen_demo', 'ethancooper_demo',
  'evawong_demo', 'graciecallahan_demo', 'isabellachang_demo', 'jadewashington_demo', 'jasonmendez_demo',
  'kevinzhang_demo', 'kiananderson_demo', 'logancarter_demo', 'michaelrobbins_demo', 'noahcoleman_demo',
  'rachelmontgomery_demo', 'ryanfoster_demo', 'taylormorgan_demo', 'trevornash_demo', 'zoeanderson_demo',
];

const FRIEND_NAMES = {
  carolinehall_demo:    { firstName: 'Caroline',  lastName: 'Hall' },
  chrisnguyen_demo:     { firstName: 'Chris',     lastName: 'Nguyen' },
  connorflynn_demo:     { firstName: 'Connor',    lastName: 'Flynn' },
  dianachen_demo:       { firstName: 'Diana',     lastName: 'Chen' },
  ethancooper_demo:     { firstName: 'Ethan',     lastName: 'Cooper' },
  evawong_demo:         { firstName: 'Eva',       lastName: 'Wong' },
  graciecallahan_demo:  { firstName: 'Gracie',    lastName: 'Callahan' },
  isabellachang_demo:   { firstName: 'Isabella',  lastName: 'Chang' },
  jadewashington_demo:  { firstName: 'Jade',      lastName: 'Washington' },
  jasonmendez_demo:     { firstName: 'Jason',     lastName: 'Mendez' },
  kevinzhang_demo:      { firstName: 'Kevin',     lastName: 'Zhang' },
  kiananderson_demo:    { firstName: 'Kian',      lastName: 'Anderson' },
  logancarter_demo:     { firstName: 'Logan',     lastName: 'Carter' },
  michaelrobbins_demo:  { firstName: 'Michael',   lastName: 'Robbins' },
  noahcoleman_demo:     { firstName: 'Noah',      lastName: 'Coleman' },
  rachelmontgomery_demo:{ firstName: 'Rachel',    lastName: 'Montgomery' },
  ryanfoster_demo:      { firstName: 'Ryan',      lastName: 'Foster' },
  taylormorgan_demo:    { firstName: 'Taylor',    lastName: 'Morgan' },
  trevornash_demo:      { firstName: 'Trevor',    lastName: 'Nash' },
  zoeanderson_demo:     { firstName: 'Zoe',       lastName: 'Anderson' },
};

// ─── Clean ───────────────────────────────────────────────────────────────────

async function cleanJaneData(janeId) {
  console.log('Cleaning Jane Doe seed data...');

  // Notes
  const janeNotes = await Note.find({ userId: janeId }).select('_id');
  const janeNoteIds = janeNotes.map(n => n._id);

  await Note.deleteMany({ userId: janeId });

  // Flashcard sets
  const janeSets = await FlashcardSet.find({ userId: janeId }).select('_id');
  const janeSetIds = janeSets.map(s => s._id);
  await Flashcard.deleteMany({ setId: { $in: janeSetIds } });
  await FlashcardSet.deleteMany({ userId: janeId });

  // Tasks (including shared tasks where Jane is a participant)
  await Task.deleteMany({ userId: janeId });

  // Applications + Resume
  await Application.deleteMany({ userId: janeId });
  await Resume.deleteMany({ userId: janeId });

  // Conversations + Messages
  const janConvs = await Conversation.find({ participants: janeId }).select('_id');
  const janeConvIds = janConvs.map(c => c._id);
  await Message.deleteMany({ conversationId: { $in: janeConvIds } });
  await Conversation.deleteMany({ participants: janeId });

  // Comments by Jane and on Jane's notes
  await Comment.deleteMany({
    $or: [
      { userId: janeId },
      { targetId: { $in: janeNoteIds } },
    ],
  });

  // Study sessions
  await StudySession.deleteMany({ userId: janeId });

  // Activities
  await Activity.deleteMany({ userId: janeId });

  // Notifications
  await Notification.deleteMany({ userId: janeId });

  // Friendships
  await Friendship.deleteMany({
    $or: [{ user1: janeId }, { user2: janeId }],
  });

  // Friend content (shared notes, flashcard sets, shared tasks seeded for Jane's friends)
  // Search by email too — handles migration from pre-rename usernames (e.g. 'carolinehall' → 'carolinehall_demo')
  const friendEmails = JANE_FRIEND_USERNAMES.map(u => `${u}@example.com`);
  const friendUsers = await User.find({
    $or: [{ username: { $in: JANE_FRIEND_USERNAMES } }, { email: { $in: friendEmails } }],
  }).select('_id');
  const friendIds = friendUsers.map(f => f._id);
  if (friendIds.length) {
    const friendSets = await FlashcardSet.find({ userId: { $in: friendIds } }).select('_id');
    await Flashcard.deleteMany({ setId: { $in: friendSets.map(s => s._id) } });
    await FlashcardSet.deleteMany({ userId: { $in: friendIds } });
    await Note.deleteMany({ userId: { $in: friendIds } });
    await Task.deleteMany({ userId: { $in: friendIds }, isShared: true });
    await Comment.deleteMany({ userId: janeId, targetType: 'note' }); // Jane's comments on friend notes
  }

  // Jane herself
  await User.deleteOne({ _id: janeId });

  console.log('Clean complete.');
}

// ─── SECTION 1: Create Jane ──────────────────────────────────────────────────

async function createJane() {
  console.log('Creating Jane Doe...');
  let jane = await User.findOne({ email: 'janedoe_demo@example.com' });
  if (!jane) {
    jane = new User({
      username: 'janedoe_demo',
      email: 'janedoe_demo@example.com',
      password: 'Demo@1234',
      firstName: 'Jane',
      lastName: 'Doe',
      bio: 'CS junior passionate about product design and full-stack development. Building side projects and prepping for internship season.',
      settings: { activityVisibility: 'friends' },
      isDemo: true,
      isSeedUser: true,
      emailVerified: true,
    });
    await jane.save();
    console.log(`  Created Jane: ${jane._id}`);
  } else {
    console.log(`  Jane exists: ${jane._id}`);
  }
  return jane;
}

// ─── SECTION 2: Ensure friends exist + create friendships ───────────────────

async function seedFriends(jane) {
  console.log('Looking up Jane\'s 20 friends...');
  const friends = [];

  for (const username of JANE_FRIEND_USERNAMES) {
    const email = `${username}@example.com`;
    let user = await User.findOne({ $or: [{ username }, { email }] });
    if (user && user.username !== username) {
      user.username = username;
      await user.save();
    }
    if (!user) {
      // Friend hasn't been seeded yet — create with isSeedUser flag
      const names = FRIEND_NAMES[username] || { firstName: username, lastName: 'Demo' };
      user = new User({
        username,
        email,
        password: 'Demo@1234',
        firstName: names.firstName,
        lastName: names.lastName,
        bio: '',
        settings: { activityVisibility: 'public' },
        isSeedUser: true,
        emailVerified: true,
      });
      await user.save();
      console.log(`  Created missing friend: ${username}`);
    }
    friends.push(user);
  }

  console.log('Seeding Jane\'s friendships...');
  for (const friend of friends) {
    const existing = await Friendship.findOne({
      $or: [
        { user1: jane._id, user2: friend._id },
        { user1: friend._id, user2: jane._id },
      ],
    });
    if (!existing) {
      await Friendship.create({
        user1: jane._id,
        user2: friend._id,
        requestedBy: jane._id,
        status: 'accepted',
        requestedAt: new Date('2026-01-10'),
        respondedAt: new Date('2026-01-11'),
      });
    }
  }

  console.log(`  ${friends.length} friendships ready.`);
  return friends;
}

// ─── SECTION 3: Notes ────────────────────────────────────────────────────────

async function seedNotes(jane, friends) {
  console.log('Seeding Jane\'s notes...');
  const allFriendIds = friends.map(f => f._id);

  // Date spreads
  const personalDateMap = [
    '2026-01-18', '2026-01-22', '2026-01-26', '2026-01-30', '2026-02-03',
    '2026-02-07', '2026-02-11', '2026-02-15', '2026-02-03', '2026-02-06',
    '2026-02-09', '2026-02-12', '2026-02-15', '2026-02-18', '2026-02-21',
    '2026-02-08', '2026-02-18', '2026-03-01', '2026-03-12', '2026-02-25',
  ];
  const sharedDateMap = [
    '2026-01-20', '2026-01-25', '2026-01-29', '2026-02-02', '2026-02-06',
    '2026-02-10', '2026-02-14', '2026-02-18', '2026-02-04', '2026-02-08',
    '2026-02-12', '2026-02-16', '2026-02-20', '2026-02-24', '2026-02-28',
    '2026-03-04', '2026-02-22', '2026-03-01', '2026-01-15', '2026-02-28',
  ];

  const createdPersonal = [];
  for (let i = 0; i < data.personalNotes.length; i++) {
    const n = data.personalNotes[i];
    const note = await Note.create({
      userId: jane._id,
      title: n.title,
      content: n.content,
      contentType: n.contentType || 'html',
      type: n.type,
      tags: n.tags,
      subject: n.subject || '',
      visibility: 'private',
      sharedWith: [],
      isPinned: n.isPinned || false,
      hasFlashcards: false,
    });
    await Note.updateOne({ _id: note._id }, { createdAt: new Date(personalDateMap[i]) });
    createdPersonal.push(note);
    console.log(`  Personal note ${i}: ${n.title}`);
  }

  const createdShared = [];
  for (let i = 0; i < data.sharedNotes.length; i++) {
    const n = data.sharedNotes[i];
    const note = await Note.create({
      userId: jane._id,
      title: n.title,
      content: n.content,
      contentType: n.contentType || 'html',
      type: n.type,
      tags: n.tags,
      subject: n.subject || '',
      visibility: 'friends',
      sharedWith: [],
      isPinned: n.isPinned || false,
      hasFlashcards: false,
    });
    await Note.updateOne({ _id: note._id }, { createdAt: new Date(sharedDateMap[i]) });
    createdShared.push(note);
    console.log(`  Shared note ${i}: ${n.title}`);
  }

  return { personalNotes: createdPersonal, sharedNotes: createdShared };
}

// ─── SECTION 4: Flashcard Sets ────────────────────────────────────────────────

async function seedFlashcardSets(jane, sharedNotes) {
  console.log('Seeding Jane\'s flashcard sets...');
  const allSets = [];

  // Link first 5 private sets to first 5 personal notes indices (conceptually)
  // Link first 5 shared sets to first 5 shared notes
  for (let i = 0; i < data.flashcardSets.length; i++) {
    const sd = data.flashcardSets[i];

    // Link shared sets to shared notes (sets 5-9 are friends-visible)
    const noteId = sd.visibility === 'friends' && sharedNotes[i - 5]
      ? sharedNotes[i - 5]._id
      : null;

    const set = await FlashcardSet.create({
      userId: jane._id,
      noteId,
      title: sd.title,
      description: sd.description,
      totalCards: sd.cards.length,
      visibility: sd.visibility,
      isAIGenerated: false,
      studySessionCount: Math.floor(Math.random() * 5) + 1,
      lastStudiedAt: new Date('2026-03-10'),
    });

    for (let j = 0; j < sd.cards.length; j++) {
      await Flashcard.create({
        setId: set._id,
        front: sd.cards[j].front,
        back: sd.cards[j].back,
        order: j,
      });
    }

    // Mark linked note as having flashcards
    if (noteId) {
      await Note.updateOne({ _id: noteId }, { hasFlashcards: true });
    }

    allSets.push(set);
    console.log(`  Set ${i}: ${sd.title} (${sd.cards.length} cards, ${sd.visibility})`);
  }

  return allSets;
}

// ─── SECTION 5: Tasks ─────────────────────────────────────────────────────────

async function seedTasks(jane, friends) {
  console.log('Seeding Jane\'s tasks...');
  const friendMap = {};
  for (const f of friends) friendMap[f.username] = f;

  const allTasks = [];

  // Personal tasks: 21 total (7 per status)
  for (const status of ['todo', 'in_progress', 'completed']) {
    for (const t of data.tasks[status]) {
      const task = await Task.create({
        userId: jane._id,
        title: t.title,
        type: t.type,
        status,
        priority: t.priority,
        dueDate: t.dueDate,
        description: t.description,
      });
      allTasks.push(task);
    }
  }

  // Shared tasks: Jane owns 3, shared with her friends
  const chrisId    = friendMap.chrisnguyen?._id;
  const loganId    = friendMap.logancarter?._id;
  const isabellaId = friendMap.isabellachang?._id;
  const ryanId     = friendMap.ryanfoster?._id;
  const zoeId      = friendMap.zoeanderson?._id;

  const janeOwnedSharedTasks = [
    {
      title: 'Distributed Systems Final: KV Store Demo',
      type: 'project', status: 'in_progress', priority: 'high',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      description: 'Coordinate the live demo walkthrough. Jane handles Raft, Chris handles WAL, Logan handles client.',
      participants: [
        ...(chrisId ? [{ userId: chrisId, status: 'in_progress' }] : []),
        ...(loganId ? [{ userId: loganId, status: 'in_progress' }] : []),
      ],
    },
    {
      title: 'Interview Prep: Mock System Design Session',
      type: 'study', status: 'todo', priority: 'high',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      description: 'Practice designing real-time collaboration systems (Figma-style). Isabella and Ryan reviewing each other.',
      participants: [
        ...(isabellaId ? [{ userId: isabellaId, status: 'todo' }] : []),
        ...(ryanId ? [{ userId: ryanId, status: 'todo' }] : []),
      ],
    },
    {
      title: 'AI Safety Reading Group: Constitutional AI Deep Dive',
      type: 'study', status: 'todo', priority: 'medium',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      description: 'Prepare discussion questions and summary for Zoe\'s Thursday session.',
      participants: [
        ...(zoeId ? [{ userId: zoeId, status: 'todo' }] : []),
      ],
    },
  ];

  for (const td of janeOwnedSharedTasks) {
    const task = await Task.create({
      userId: jane._id,
      title: td.title,
      type: td.type,
      status: td.status,
      priority: td.priority,
      dueDate: td.dueDate,
      description: td.description,
      isShared: true,
      participants: td.participants,
    });
    allTasks.push(task);
  }

  // Shared tasks: friends own them, Jane is a participant
  const friendOwnedSharedTasks = [
    {
      ownerId: loganId,
      title: 'KV Store Client Library Review',
      type: 'project', status: 'in_progress', priority: 'high',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      description: 'Logan\'s client library PR needs a second set of eyes. Jane reviewing the API design.',
      participants: [{ userId: jane._id, status: 'in_progress' }],
    },
    {
      ownerId: isabellaId,
      title: 'Portfolio Review & Feedback Session',
      type: 'project', status: 'todo', priority: 'medium',
      dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      description: 'Isabella presenting her portfolio updates. Jane giving feedback on project descriptions and layout.',
      participants: [{ userId: jane._id, status: 'todo' }],
    },
  ];

  for (const td of friendOwnedSharedTasks) {
    if (!td.ownerId) continue;
    const task = await Task.create({
      userId: td.ownerId,
      title: td.title,
      type: td.type,
      status: td.status,
      priority: td.priority,
      dueDate: td.dueDate,
      description: td.description,
      isShared: true,
      participants: td.participants,
    });
    allTasks.push(task);
  }

  console.log(`  Created ${allTasks.length} tasks.`);
  return allTasks;
}

// ─── SECTION 6: Applications ─────────────────────────────────────────────────

async function seedApplications(jane) {
  console.log('Seeding Jane\'s applications...');
  for (const a of data.applications) {
    const appData = {
      userId: jane._id,
      company: a.company,
      position: a.position,
      location: a.location,
      status: a.status,
      notes: a.notes || '',
    };
    if (a.appliedAt) appData.appliedAt = a.appliedAt;
    if (a.interviewDates) appData.interviewDates = a.interviewDates;
    if (a.offerReceivedAt) appData.offerReceivedAt = a.offerReceivedAt;
    if (a.deadlineDate) appData.deadlineDate = a.deadlineDate;
    if (a.salary) appData.salary = a.salary;
    if (a.contacts) appData.contacts = a.contacts;

    await Application.create(appData);
  }
  console.log(`  Created ${data.applications.length} applications.`);
}

// ─── SECTION 7: Resume ───────────────────────────────────────────────────────

async function seedResume(jane) {
  console.log('Seeding Jane\'s resume...');
  const r = data.resume;
  await Resume.create({
    userId: jane._id,
    fileName: r.fileName,
    fileUrl: r.cloudinaryUrl,
    publicId: r.cloudinaryPublicId,
    mimeType: 'application/pdf',
    feedback: r.feedback,
  });
  console.log('  Resume created.');
}

// ─── SECTION 8: Conversations & Messages ─────────────────────────────────────

async function seedConversations(jane, friends) {
  console.log('Seeding Jane\'s conversations...');
  const friendMap = {};
  for (const f of friends) friendMap[f.username] = f;

  // Base date: spread messages over last 30 days
  const baseDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  for (let ci = 0; ci < data.conversations.length; ci++) {
    const conv = data.conversations[ci];
    const friend = friendMap[conv.friend];
    if (!friend) {
      console.log(`  Skipping conversation with ${conv.friend} — not found`);
      continue;
    }

    const convDoc = await Conversation.create({
      participants: [jane._id, friend._id],
      unreadCounts: [
        { userId: jane._id, count: 0 },
        { userId: friend._id, count: 0 },
      ],
    });

    let lastMsg = null;
    for (let mi = 0; mi < conv.messages.length; mi++) {
      const m = conv.messages[mi];
      const senderId = m.from === 'jane' ? jane._id : friend._id;
      const msgDate = new Date(baseDate.getTime() + (ci * 4 + mi) * 12 * 60 * 60 * 1000);

      const msg = await Message.create({
        conversationId: convDoc._id,
        senderId,
        content: m.content,
        readBy: [
          { userId: jane._id, readAt: msgDate },
          { userId: friend._id, readAt: msgDate },
        ],
      });
      await Message.updateOne({ _id: msg._id }, { createdAt: msgDate });
      lastMsg = { senderId, content: m.content.slice(0, 200), sentAt: msgDate };
    }

    if (lastMsg) {
      await Conversation.updateOne({ _id: convDoc._id }, { lastMessage: lastMsg });
    }

    console.log(`  ${conv.friend}: ${conv.messages.length} messages`);
  }
}

// ─── SECTION 9: Share Messages ────────────────────────────────────────────────

async function seedShareMessages(jane, friends, sharedNotes, allSets, allTasks) {
  console.log('Seeding share messages...');
  let count = 0;
  const friendMap = {};
  for (const f of friends) friendMap[f.username] = f;

  // Share all 'friends' visible notes via share messages to first 3 friends
  const sample = friends.slice(0, 3);
  for (const note of sharedNotes.slice(0, 5)) {
    for (const friend of sample) {
      try {
        await sendShareMessage(jane._id, friend._id, 'note', note.title, note._id);
        count++;
      } catch (_) { /* non-critical */ }
    }
  }

  // Share messages for Jane-owned shared tasks
  for (const task of allTasks.filter(t => t.isShared && t.userId?.toString() === jane._id.toString())) {
    for (const p of (task.participants || [])) {
      const pId = p.userId?._id || p.userId;
      if (!pId) continue;
      try {
        await sendShareMessage(jane._id, pId, 'task', task.title, task._id);
        count++;
      } catch (_) { /* non-critical */ }
    }
  }

  console.log(`  ${count} share messages created.`);
}

// ─── SECTION 10: Comments ─────────────────────────────────────────────────────

async function seedComments(jane, friends, sharedNotes) {
  console.log('Seeding comments...');
  const allFriendIds = friends.map(f => f._id);
  const allComments = [];

  const noteCommentBank = [
    'These notes are incredibly well-organized. Adding to my study list!',
    'This is exactly what I needed before the midterm — thank you for sharing.',
    'Great breakdown. The examples make the concept really easy to follow.',
    'I was confused about this topic but these notes cleared it right up.',
    'Really solid. The step-by-step walkthrough here is super clear.',
    'I got through the whole thing in one sitting. Very well written.',
    'Going to use this for my exam prep sprint — much better than the textbook.',
    'The diagrams here help so much with visualization.',
    'Could you share the lecture slides too? Would love to cross-reference.',
    'This is better than the lecture recording honestly.',
    'Exactly the summary I needed. Nice work.',
    'Just shared this with my whole study group.',
  ];

  // Friends comment on Jane's shared notes (2-3 friends per note, first 12 notes)
  for (let i = 0; i < Math.min(12, sharedNotes.length); i++) {
    const note = sharedNotes[i];
    const commenters = [...allFriendIds]
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.floor(Math.random() * 2) + 2);

    let firstComment = null;
    for (const cId of commenters) {
      const text = noteCommentBank[Math.floor(Math.random() * noteCommentBank.length)];
      const comment = await Comment.create({
        targetId: note._id,
        targetType: 'note',
        userId: cId,
        content: text,
      });
      // 2-3 other friends like the comment
      const likers = allFriendIds.filter(id => !id.equals(cId)).slice(0, Math.floor(Math.random() * 2) + 2);
      if (likers.length) {
        await Comment.updateOne({ _id: comment._id }, { $push: { likes: { $each: likers } } });
      }
      allComments.push(comment);
      if (!firstComment) firstComment = comment;
    }

    // Jane replies to the first comment on her shared notes (proper threaded reply)
    if (i < 8 && firstComment) {
      const reply = await Comment.create({
        targetId: note._id,
        targetType: 'note',
        userId: jane._id,
        parentId: firstComment._id,
        content: noteCommentBank[Math.floor(Math.random() * noteCommentBank.length)].replace('These notes', 'Glad this helps').replace('Thank you', 'Of course'),
      });
      const replyLikers = allFriendIds.slice(0, 2);
      if (replyLikers.length) {
        await Comment.updateOne({ _id: reply._id }, { $push: { likes: { $each: replyLikers } } });
      }
      allComments.push(reply);
    }
  }

  console.log(`  Created ${allComments.length} comments.`);
  return allComments;
}

// ─── SECTION 11: Activity Feed ────────────────────────────────────────────────

async function seedActivities(jane, friends, sharedNotes, allSets, allTasks, allComments) {
  console.log('Seeding activity feed...');
  const allFriendIds = friends.map(f => f._id);
  let count = 0;

  const activityWindowMs = 60 * 24 * 60 * 60 * 1000; // 60 days
  let actDate = new Date(Date.now() - activityWindowMs);
  const oneDayMs = 24 * 60 * 60 * 1000;
  const capDate = new Date(Date.now() - 30 * 60 * 1000);
  const bumpDate = () => {
    actDate = new Date(actDate.getTime() + (Math.floor(Math.random() * 2) + 1) * oneDayMs);
    return actDate < capDate ? new Date(actDate) : new Date(capDate);
  };

  // Jane's note_created activities — friends see what she's been building
  for (let i = 0; i < Math.min(data.activityMeta.noteShareCount, sharedNotes.length); i++) {
    const note = sharedNotes[i];
    await Activity.create({
      userId: jane._id,
      type: 'note_created',
      targetId: note._id,
      targetType: 'note',
      visibleTo: [jane._id, ...allFriendIds],
      metadata: { noteTitle: note.title },
      createdAt: bumpDate(),
    });
    count++;
  }

  // Jane's flashcard_set_created activities
  const sharedSets = allSets.filter(s => s.visibility === 'friends');
  for (const set of sharedSets) {
    await Activity.create({
      userId: jane._id,
      type: 'flashcard_set_created',
      targetId: set._id,
      targetType: 'flashcardSet',
      visibleTo: [jane._id, ...allFriendIds],
      metadata: { setTitle: set.title },
      createdAt: bumpDate(),
    });
    count++;
  }

  // Jane's shared task activities
  const janeSharedTasks = allTasks.filter(
    t => t.isShared && t.userId?.toString() === jane._id.toString()
  );
  for (const task of janeSharedTasks) {
    const participantNames = (task.participants || []).map(p => {
      const pid = p.userId?.toString ? p.userId.toString() : p.userId;
      const pFriend = friends.find(f => f._id.toString() === pid);
      return pFriend ? { _id: pFriend._id, firstName: pFriend.firstName, lastName: pFriend.lastName } : null;
    }).filter(Boolean);

    if (!participantNames.length) continue;

    const ts = bumpDate();
    // Owner sees participant names
    await Activity.create({
      userId: jane._id,
      type: 'task_created',
      targetId: task._id,
      targetType: 'task',
      visibleTo: [jane._id],
      metadata: { taskTitle: task.title, sharedWithNames: participantNames },
      createdAt: ts,
    });
    count++;

    // Each participant gets a "with you" entry
    for (const pName of participantNames) {
      const recipientFriend = friends.find(f => f._id.toString() === pName._id.toString());
      if (!recipientFriend) continue;
      await Activity.create({
        userId: jane._id,
        type: 'task_created',
        targetId: task._id,
        targetType: 'task',
        visibleTo: [recipientFriend._id],
        metadata: { taskTitle: task.title, isRecipient: true },
        createdAt: ts,
      });
      count++;
    }
  }

  // Comment activities (Jane's comments on friends' content)
  const janeComments = allComments.filter(c => c.userId?.toString() === jane._id.toString()).slice(0, 5);
  for (const comment of janeComments) {
    await Activity.create({
      userId: jane._id,
      type: 'comment_added',
      targetId: comment.targetId,
      targetType: comment.targetType,
      visibleTo: [jane._id, ...allFriendIds],
      metadata: { commentPreview: comment.content.slice(0, 100), commentId: comment._id.toString() },
      createdAt: bumpDate(),
    });
    count++;
  }

  // Friends' note_created and flashcard_set_created activities
  // Query existing friend content so this works even if seedFriendContent was idempotent
  const friendNotes = await Note.find({ userId: { $in: allFriendIds }, visibility: 'friends', deletedAt: null }).limit(60);
  const friendSets  = await FlashcardSet.find({ userId: { $in: allFriendIds }, visibility: 'friends', deletedAt: null }).limit(40);

  for (const fn of friendNotes) {
    const friend = friends.find(f => f._id.toString() === fn.userId.toString());
    if (!friend) continue;
    const isPrivate = friend.settings?.activityVisibility === 'private';
    const visibleTo = isPrivate
      ? [friend._id]
      : [friend._id, jane._id, ...allFriendIds.filter(id => !id.equals(friend._id))];
    const existing = await Activity.findOne({ userId: friend._id, type: 'note_created', targetId: fn._id });
    if (existing) continue;
    await Activity.create({
      userId: friend._id, type: 'note_created', targetId: fn._id,
      targetType: 'note', visibleTo, metadata: { noteTitle: fn.title }, createdAt: bumpDate(),
    });
    count++;
  }

  for (const fs of friendSets) {
    const friend = friends.find(f => f._id.toString() === fs.userId.toString());
    if (!friend) continue;
    const isPrivate = friend.settings?.activityVisibility === 'private';
    const visibleTo = isPrivate
      ? [friend._id]
      : [friend._id, jane._id, ...allFriendIds.filter(id => !id.equals(friend._id))];
    const existing = await Activity.findOne({ userId: friend._id, type: 'flashcard_set_created', targetId: fs._id });
    if (existing) continue;
    await Activity.create({
      userId: friend._id, type: 'flashcard_set_created', targetId: fs._id,
      targetType: 'flashcardSet', visibleTo, metadata: { setTitle: fs.title }, createdAt: bumpDate(),
    });
    count++;
  }

  // Friends' comment activities (ambient social signal)
  const friendComments = allComments.filter(c => {
    const cId = c.userId?.toString();
    return allFriendIds.some(fid => fid.toString() === cId);
  }).slice(0, 8);

  for (const fc of friendComments) {
    const commenterFriend = friends.find(f => f._id.toString() === fc.userId?.toString());
    if (!commenterFriend) continue;
    const isPrivate = commenterFriend.settings?.activityVisibility === 'private';
    const visibleToAll = isPrivate
      ? [commenterFriend._id]
      : [commenterFriend._id, jane._id, ...allFriendIds.filter(id => !id.equals(commenterFriend._id))];
    await Activity.create({
      userId: commenterFriend._id,
      type: 'comment_added',
      targetId: fc.targetId,
      targetType: fc.targetType,
      visibleTo: visibleToAll,
      metadata: { commentPreview: fc.content.slice(0, 100), commentId: fc._id.toString() },
      createdAt: bumpDate(),
    });
    count++;
  }

  console.log(`  Created ${count} activities.`);
}

// ─── SECTION 12: Friend Content ───────────────────────────────────────────────
// Give each of Jane's 20 friends shared notes, a flashcard set, and (for some)
// a shared task — so Jane's feeds and profile pages feel populated.

const FRIEND_NOTES = [
  { title: 'OS Scheduling Algorithms', type: 'lecture', content: '<p>Round Robin, FCFS, SJF, and Priority scheduling. Round Robin assigns each process a fixed time slice (quantum). Preemptive priority scheduling can cause starvation — solved by aging.</p><ul><li>CPU burst vs I/O burst</li><li>Gantt chart analysis for average wait time</li><li>Multilevel feedback queue combines approaches</li></ul>' },
  { title: 'Database Normalization', type: 'lecture', content: '<p>1NF: atomic values, no repeating groups. 2NF: no partial dependencies on composite keys. 3NF: no transitive dependencies. BCNF: every determinant is a candidate key.</p><p>Denormalization trades storage for read performance.</p>' },
  { title: 'React Hooks Deep Dive', type: 'general', content: '<p>useState, useEffect, useCallback, useMemo, useRef — when and why to use each. useCallback memoizes functions; useMemo memoizes computed values. Both take dependency arrays.</p><p>Custom hooks encapsulate reusable stateful logic.</p>' },
  { title: 'Algorithms: Dynamic Programming', type: 'lecture', content: '<p>Optimal substructure + overlapping subproblems → DP. Top-down (memoization) vs bottom-up (tabulation). Classic examples: Fibonacci, Knapsack, Longest Common Subsequence, Edit Distance.</p>' },
  { title: 'Machine Learning: Gradient Descent', type: 'research', content: '<p>Gradient descent minimizes the loss function by iteratively moving in the direction of steepest descent. Learning rate α controls step size. Variants: batch GD, stochastic GD (SGD), mini-batch GD.</p><p>Adam optimizer adapts learning rates per parameter.</p>' },
  { title: 'Computer Networks: TCP/IP', type: 'lecture', content: '<p>TCP: reliable, ordered, connection-oriented. Three-way handshake (SYN, SYN-ACK, ACK). Flow control via sliding window. Congestion control: slow start, congestion avoidance, fast retransmit.</p>' },
  { title: 'Software Engineering Principles', type: 'general', content: '<p>SOLID principles: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion. DRY, YAGNI, KISS. Design patterns: Factory, Singleton, Observer, Strategy.</p>' },
  { title: 'Linear Algebra for ML', type: 'research', content: '<p>Vectors, matrices, dot products, eigenvalues. Matrix multiplication dimensions must align. Singular Value Decomposition (SVD) used in recommendation systems and PCA for dimensionality reduction.</p>' },
  { title: 'Midterm Prep: Data Structures', type: 'lecture', content: '<p>Arrays, linked lists, stacks, queues, trees, heaps, hash tables, graphs. Know time complexity for insert/search/delete. Binary search tree: O(log n) average, O(n) worst case. Red-black trees guarantee O(log n).</p>' },
  { title: 'Cloud Computing Fundamentals', type: 'general', content: '<p>IaaS vs PaaS vs SaaS. AWS core services: EC2 (compute), S3 (storage), RDS (relational DB), Lambda (serverless). Horizontal vs vertical scaling. CAP theorem: consistency, availability, partition tolerance — pick two.</p>' },
  { title: 'UX Research Methods', type: 'research', content: '<p>User interviews, surveys, usability testing, A/B testing, heuristic evaluation. Think-aloud protocol captures user mental models. Affinity diagrams synthesize qualitative data. Persona creation from research findings.</p>' },
  { title: 'Cybersecurity Fundamentals', type: 'lecture', content: '<p>CIA triad: Confidentiality, Integrity, Availability. Common attacks: SQL injection, XSS, CSRF, man-in-the-middle. Defense: input validation, HTTPS, CSP headers, rate limiting, principle of least privilege.</p>' },
  { title: 'Product Management Basics', type: 'general', content: '<p>Product roadmap, OKRs, user stories, sprint planning. Jobs-to-be-done framework. Prioritization: RICE score (Reach, Impact, Confidence, Effort). Metrics: DAU, retention, NPS, conversion rate.</p>' },
  { title: 'Compilers: Lexing and Parsing', type: 'lecture', content: '<p>Lexical analysis converts source code to tokens. Parsing builds an AST. Context-free grammars define language syntax. LL(1) vs LR(1) parsers. Recursive descent parsing is intuitive to implement.</p>' },
  { title: 'Statistics for Data Science', type: 'research', content: '<p>Descriptive vs inferential statistics. Central limit theorem, hypothesis testing, p-values, confidence intervals. Type I (false positive) and Type II (false negative) errors. Bayesian vs frequentist approaches.</p>' },
  { title: 'Distributed Systems Notes', type: 'general', content: '<p>Consistency models: strong, eventual, causal. Consensus algorithms: Paxos, Raft. Leader election, fault tolerance, replication. Two-phase commit for distributed transactions. Vector clocks for event ordering.</p>' },
  { title: 'iOS Development: SwiftUI', type: 'general', content: '<p>Declarative UI — describe what, not how. Views are value types (structs). State management: @State, @Binding, @ObservedObject, @EnvironmentObject. Navigation: NavigationStack, TabView. Combine for reactive data flow.</p>' },
  { title: 'Ethics in AI', type: 'research', content: '<p>Algorithmic bias, fairness definitions (demographic parity, equalized odds). Explainability vs accuracy trade-off. Data privacy: GDPR, differential privacy. Responsible AI frameworks: transparency, accountability, non-maleficence.</p>' },
  { title: 'System Design Interview Prep', type: 'general', content: '<p>Clarify requirements → estimate scale → high-level design → deep dive → bottlenecks. Key concepts: load balancing, caching (Redis), CDNs, database sharding, message queues (Kafka), microservices vs monolith.</p>' },
  { title: 'Interview Prep: Behavioral Questions', type: 'general', content: '<p>STAR method: Situation, Task, Action, Result. Prepare stories for: leadership, conflict, failure, teamwork, technical challenge. Research company values and align examples. Ask thoughtful questions about team and growth.</p>' },
];

const FRIEND_FLASHCARD_SETS = [
  { title: 'OS Concepts', cards: [{ front: 'What is a process?', back: 'A program in execution, with its own memory space, registers, and program counter.' }, { front: 'Deadlock conditions', back: 'Mutual exclusion, hold and wait, no preemption, circular wait — all four must hold.' }, { front: 'What is thrashing?', back: 'When a system spends more time paging than executing processes due to insufficient physical memory.' }] },
  { title: 'DB Normalization', cards: [{ front: '1NF requirement', back: 'All attributes are atomic (indivisible) and each row is unique.' }, { front: '3NF rule', back: 'No transitive dependencies — non-key attributes depend only on the primary key.' }, { front: 'ACID properties', back: 'Atomicity, Consistency, Isolation, Durability — guarantees for database transactions.' }] },
  { title: 'React Fundamentals', cards: [{ front: 'useCallback vs useMemo', back: 'useCallback memoizes a function reference; useMemo memoizes the return value of a function.' }, { front: 'When to use useRef?', back: 'Accessing DOM elements directly, persisting values across renders without causing re-renders.' }, { front: 'React reconciliation', back: 'React diffs the virtual DOM tree to find minimal changes needed to update the real DOM.' }] },
  { title: 'DP Patterns', cards: [{ front: 'Overlapping subproblems', back: 'The same sub-problems are solved multiple times — DP stores solutions to avoid recomputation.' }, { front: 'Optimal substructure', back: 'An optimal solution to a problem contains optimal solutions to its subproblems.' }, { front: 'Knapsack complexity', back: 'O(n × W) with bottom-up DP, where n = items and W = max capacity.' }] },
  { title: 'ML Key Concepts', cards: [{ front: 'Bias-variance trade-off', back: 'High bias = underfitting; high variance = overfitting. Goal is to balance both for good generalization.' }, { front: 'What is regularization?', back: 'Techniques (L1/L2) that penalize large model weights to reduce overfitting.' }, { front: 'Cross-entropy loss', back: 'Measures difference between predicted probability distribution and true labels in classification.' }] },
  { title: 'Networks & Protocols', cards: [{ front: 'TCP vs UDP', back: 'TCP: reliable, ordered, connection-oriented. UDP: fast, connectionless, no delivery guarantees.' }, { front: 'HTTP status codes', back: '2xx success, 3xx redirect, 4xx client error, 5xx server error. 404 = Not Found, 401 = Unauthorized.' }, { front: 'What is DNS?', back: 'Domain Name System translates human-readable hostnames to IP addresses.' }] },
  { title: 'SOLID Principles', cards: [{ front: 'Single Responsibility Principle', back: 'A class should have only one reason to change — one job, one responsibility.' }, { front: 'Open/Closed Principle', back: 'Software entities should be open for extension but closed for modification.' }, { front: 'Dependency Inversion', back: 'Depend on abstractions, not concretions. High-level modules should not depend on low-level modules.' }] },
  { title: 'Cloud & Distributed Systems', cards: [{ front: 'CAP Theorem', back: 'A distributed system can guarantee only 2 of 3: Consistency, Availability, Partition Tolerance.' }, { front: 'What is eventual consistency?', back: 'Replicas will converge to the same value eventually, but reads may be stale in the interim.' }, { front: 'Horizontal vs vertical scaling', back: 'Horizontal: add more machines. Vertical: add more resources to one machine.' }] },
  { title: 'System Design Vocab', cards: [{ front: 'What is a CDN?', back: 'Content Delivery Network — caches static assets geographically close to users to reduce latency.' }, { front: 'Message queue purpose', back: 'Decouples producers and consumers; buffers bursts of traffic; enables async processing.' }, { front: 'Database sharding', back: 'Partitioning a database horizontally across multiple servers to improve scalability.' }] },
  { title: 'Interview Behavioral', cards: [{ front: 'STAR method', back: 'Situation, Task, Action, Result — structure for answering behavioral interview questions.' }, { front: 'Good failure story', back: 'Pick a real failure, own your role, explain what you learned, and show how you applied that learning.' }, { front: 'Why this company?', back: 'Show research: mention specific product, values, team, or problems the company is solving that excite you.' }] },
  { title: 'Statistics Vocabulary', cards: [{ front: 'p-value meaning', back: 'Probability of observing results at least as extreme as the data, assuming the null hypothesis is true.' }, { front: 'Type I error', back: 'False positive — rejecting the null hypothesis when it is actually true. Controlled by significance level α.' }, { front: 'Central Limit Theorem', back: 'The sampling distribution of the mean approaches a normal distribution as sample size increases.' }] },
  { title: 'Data Structure Complexity', cards: [{ front: 'Hash table lookup', back: 'O(1) average case for search, insert, delete. O(n) worst case due to hash collisions.' }, { front: 'Heap operations', back: 'Insert and extract-min/max: O(log n). Build heap from array: O(n) using Floyd\'s algorithm.' }, { front: 'Binary search', back: 'O(log n) — requires sorted array. Halves the search space with each comparison.' }] },
  { title: 'UX Principles', cards: [{ front: 'Hick\'s Law', back: 'The time to make a decision increases logarithmically with the number of choices.' }, { front: 'Fitts\'s Law', back: 'Time to reach a target depends on distance and size — larger, closer targets are faster to click.' }, { front: 'Jakob\'s Law', back: 'Users expect your site to work the same as all other sites they already use.' }] },
  { title: 'Security Concepts', cards: [{ front: 'SQL injection', back: 'Attacker injects SQL code via user inputs to manipulate database queries. Prevent with parameterized queries.' }, { front: 'XSS (Cross-Site Scripting)', back: 'Injecting malicious scripts into web pages viewed by others. Prevent with output encoding and CSP headers.' }, { front: 'JWT structure', back: 'Header.Payload.Signature — base64 encoded. Signature verifies the token was not tampered with.' }] },
  { title: 'SwiftUI Essentials', cards: [{ front: '@State vs @Binding', back: '@State owns the data; @Binding is a reference to @State owned by a parent view.' }, { front: 'ViewModifier protocol', back: 'Allows creating reusable, composable view transformations applied with .modifier() or custom methods.' }, { front: 'LazyVStack vs VStack', back: 'LazyVStack renders only visible items — use for long lists to avoid memory and performance issues.' }] },
  { title: 'Product Metrics', cards: [{ front: 'DAU / MAU ratio', back: 'Measures stickiness — how often monthly active users return daily. >20% is generally healthy.' }, { front: 'NPS (Net Promoter Score)', back: 'Asks "how likely to recommend?" (0-10). Promoters (9-10) minus Detractors (0-6) = NPS.' }, { front: 'Cohort retention', back: 'Tracks what % of users who joined in a given period return in subsequent periods.' }] },
  { title: 'Compiler Theory', cards: [{ front: 'Lexical analysis output', back: 'A stream of tokens — the fundamental units of the language (keywords, identifiers, literals, operators).' }, { front: 'AST (Abstract Syntax Tree)', back: 'Tree representation of the abstract syntactic structure of source code, built during parsing.' }, { front: 'Semantic analysis', back: 'Checks type correctness, scope resolution, and meaning after parsing — catches logical errors.' }] },
  { title: 'AI Ethics Terms', cards: [{ front: 'Demographic parity', back: 'A fairness criterion requiring that positive outcome rates are equal across demographic groups.' }, { front: 'Differential privacy', back: 'A mathematical framework ensuring individual records cannot be identified from aggregate query results.' }, { front: 'Explainability vs accuracy', back: 'Simpler models (linear, decision tree) are more explainable but often less accurate than deep learning.' }] },
  { title: 'Distributed Systems', cards: [{ front: 'Raft consensus', back: 'Leader election + log replication. A leader is elected by majority vote and replicates log entries to followers.' }, { front: 'Vector clocks', back: 'Track causality in distributed systems — each event increments the sender\'s clock entry in the vector.' }, { front: '2-Phase Commit', back: 'Coordinator asks all participants to prepare (phase 1), then sends commit or abort (phase 2). Blocking protocol.' }] },
  { title: 'Behavioral Finance', cards: [{ front: 'Loss aversion', back: 'People feel losses ~2× more intensely than equivalent gains (Kahneman & Tversky).' }, { front: 'Confirmation bias', back: 'Tendency to search for and interpret information in a way that confirms pre-existing beliefs.' }, { front: 'Sunk cost fallacy', back: 'Continuing a decision because of already-invested resources rather than future value.' }] },
];

async function seedFriendContent(jane, friends) {
  console.log('Seeding friend content (notes, flashcard sets, shared tasks)...');
  let noteCount = 0;
  let setCount = 0;
  let taskCount = 0;

  const allFriendIds = friends.map(f => f._id);

  for (let i = 0; i < friends.length; i++) {
    const friend = friends[i];

    // Skip if this friend already has shared notes (idempotent)
    const existingNotes = await Note.countDocuments({ userId: friend._id, visibility: 'friends' });
    if (existingNotes >= 2) continue;

    const noteA = FRIEND_NOTES[i % FRIEND_NOTES.length];
    const noteB = FRIEND_NOTES[(i + 10) % FRIEND_NOTES.length];

    const noteDate = new Date(Date.now() - (60 - i * 2) * 24 * 60 * 60 * 1000);

    // friend's activityVisibility controls who sees their activity in the feed
    const friendVisibility = friend.settings?.activityVisibility ?? 'friends';
    const friendVisibleTo = friendVisibility === 'private'
      ? [friend._id]
      : [friend._id, jane._id, ...allFriendIds.filter(id => !id.equals(friend._id))];

    const [createdNoteA, createdNoteB] = await Note.create([
      {
        userId: friend._id,
        title: noteA.title,
        content: noteA.content,
        type: noteA.type,
        visibility: 'friends',
        tags: [],
        createdAt: noteDate,
        updatedAt: noteDate,
      },
      {
        userId: friend._id,
        title: noteB.title,
        content: noteB.content,
        type: noteB.type,
        visibility: 'friends',
        tags: [],
        createdAt: new Date(noteDate.getTime() + 3 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(noteDate.getTime() + 3 * 24 * 60 * 60 * 1000),
      },
    ]);
    noteCount += 2;

    // note_created activities for both notes
    await Activity.create([
      {
        userId: friend._id, type: 'note_created', targetId: createdNoteA._id,
        targetType: 'note', visibleTo: friendVisibleTo,
        metadata: { noteTitle: createdNoteA.title }, createdAt: noteDate,
      },
      {
        userId: friend._id, type: 'note_created', targetId: createdNoteB._id,
        targetType: 'note', visibleTo: friendVisibleTo,
        metadata: { noteTitle: createdNoteB.title },
        createdAt: new Date(noteDate.getTime() + 3 * 24 * 60 * 60 * 1000),
      },
    ]);

    // Flashcard set
    const existingSets = await FlashcardSet.countDocuments({ userId: friend._id, visibility: 'friends' });
    if (existingSets === 0) {
      const fsData = FRIEND_FLASHCARD_SETS[i % FRIEND_FLASHCARD_SETS.length];
      const fs = await FlashcardSet.create({
        userId: friend._id,
        title: fsData.title,
        visibility: 'friends',
        createdAt: noteDate,
        updatedAt: noteDate,
      });

      for (const card of fsData.cards) {
        await Flashcard.create({ setId: fs._id, front: card.front, back: card.back });
      }
      setCount++;

      // flashcard_set_created activity
      await Activity.create({
        userId: friend._id, type: 'flashcard_set_created', targetId: fs._id,
        targetType: 'flashcardSet', visibleTo: friendVisibleTo,
        metadata: { setTitle: fs.title }, createdAt: noteDate,
      });
    }

    // Shared task with Jane as participant (first 6 friends only)
    if (i < 6) {
      const sharedTaskTitles = [
        'CS Senior Project: Design Doc',
        'Study Group: Algorithms Final',
        'Hackathon: Team Planning',
        'Research Paper Outline',
        'Group Presentation Slides',
        'Capstone Milestone Review',
      ];
      const existing = await Task.countDocuments({
        userId: friend._id,
        isShared: true,
        'participants.userId': jane._id,
      });
      if (existing === 0) {
        await Task.create({
          userId: friend._id,
          title: sharedTaskTitles[i],
          description: 'Shared task — collaborating with Jane and others.',
          status: i < 2 ? 'in_progress' : i < 4 ? 'todo' : 'completed',
          priority: 'medium',
          type: 'project',
          isShared: true,
          participants: [{ userId: jane._id, role: 'contributor' }],
          dueDate: new Date(Date.now() + (7 + i * 5) * 24 * 60 * 60 * 1000),
          createdAt: noteDate,
          updatedAt: noteDate,
        });
        taskCount++;
      }
    }
  }

  // Jane comments on a few friends' shared notes
  const friendNotes = await Note.find({
    userId: { $in: allFriendIds },
    visibility: 'friends',
  }).limit(10);

  const janeCommentBank = [
    'This is super helpful — exactly what I needed for my exam review.',
    'Love how clearly you broke this down. Adding to my notes!',
    'Really useful perspective here. Thanks for sharing!',
    'This would have saved me hours last semester. Bookmarked.',
    'Great summary. The examples help a ton.',
    'This is the clearest explanation of this topic I\'ve seen.',
    'Could you share more resources on this? Would love to dive deeper.',
    'I was struggling with this concept — this cleared everything up.',
  ];

  let janeCommentCount = 0;
  for (let i = 0; i < Math.min(8, friendNotes.length); i++) {
    const existing = await Comment.countDocuments({ userId: jane._id, targetId: friendNotes[i]._id });
    if (existing === 0) {
      await Comment.create({
        targetId: friendNotes[i]._id,
        targetType: 'note',
        userId: jane._id,
        content: janeCommentBank[i % janeCommentBank.length],
      });
      janeCommentCount++;
    }
  }

  console.log(`  Friends: ${noteCount} notes, ${setCount} flashcard sets, ${taskCount} shared tasks, ${janeCommentCount} Jane comments`);
}

// ─── SECTION 13: Study Sessions ──────────────────────────────────────────────

async function seedStudySessions(jane, janeSets) {
  console.log("Seeding Jane's study sessions...");

  // Seed sessions over the last 5 days to create a visible streak
  const today = new Date('2026-04-01T20:00:00Z');
  const sessionDays = [];
  for (let daysAgo = 4; daysAgo >= 0; daysAgo--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - daysAgo);
    d.setUTCHours(19 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 60), 0, 0);
    sessionDays.push(d);
  }

  let created = 0;
  for (let i = 0; i < sessionDays.length; i++) {
    const completedAt = sessionDays[i];
    const set = janeSets[i % Math.min(3, janeSets.length)];
    if (!set) continue;

    const cards = await Flashcard.find({ setId: set._id, deletedAt: null }).lean();
    if (!cards.length) continue;

    const correctRate = 0.55 + (i / sessionDays.length) * 0.35; // 55% → 90%
    const cardResults = cards.slice(0, Math.min(cards.length, 8)).map(card => ({
      cardId: card._id,
      correct: Math.random() < correctRate,
    }));

    const totalCards = cardResults.length;
    const correctCount = cardResults.filter(r => r.correct).length;
    const score = Math.round((correctCount / totalCards) * 100);
    const durationSeconds = 60 + Math.floor(Math.random() * 180);

    await StudySession.create({
      userId: jane._id,
      setId: set._id,
      completedAt,
      durationSeconds,
      totalCards,
      correctCount,
      score,
      cardResults,
    });

    await FlashcardSet.findByIdAndUpdate(set._id, {
      lastStudiedAt: completedAt,
      $inc: { studySessionCount: 1 },
    });

    created++;
  }

  console.log(`  Created ${created} study sessions (5-day streak)`);
}

// ─── SECTION 14: Notifications ───────────────────────────────────────────────
// Seeds realistic in-app notifications for Jane across all four time groups
// so the bell and /notifications history page look populated on first load.

async function seedNotifications(jane, friends, sharedNotes, allComments, conversations) {
  console.log("Seeding Jane's notifications...");

  const friendMap = {};
  for (const f of friends) friendMap[f.username] = f;

  const now = Date.now();
  const hoursAgo = (h) => new Date(now - h * 3600000);
  const daysAgo = (d) => new Date(now - d * 86400000);

  // Resolve specific friends used in notification messages
  const chris = friendMap['chrisnguyen_demo'];
  const ryan = friendMap['ryanfoster_demo'];
  const zoe = friendMap['zoeanderson_demo'];
  const isabella = friendMap['isabellachang_demo'];
  const logan = friendMap['logancarter_demo'];
  const caroline = friendMap['carolinehall_demo'];
  const kian = friendMap['kiananderson_demo'];

  // Pick shared notes by title for realistic message text
  const urlShortenerNote = sharedNotes.find(n => n.title.includes('URL Shortener')) || sharedNotes[0];
  const reactHooksNote = sharedNotes.find(n => n.title.includes('React Hooks')) || sharedNotes[2];
  const a11yNote = sharedNotes.find(n => n.title.includes('Accessibility') || n.title.includes('a11y')) || sharedNotes[7];

  // Pick a Jane reply comment (parentId set) for like notifications
  const janeReply = allComments.find(c =>
    c.userId?.toString() === jane._id.toString() && c.parentId
  ) || allComments[0];

  // Look up actual comments for metadata
  const chrisCommentOnUrl = chris && urlShortenerNote && allComments.find(c =>
    c.userId?.toString() === chris._id.toString() &&
    c.targetId?.toString() === urlShortenerNote._id.toString()
  );
  const ryanCommentOnReact = ryan && reactHooksNote && allComments.find(c =>
    c.userId?.toString() === ryan._id.toString() &&
    c.targetId?.toString() === reactHooksNote._id.toString()
  );
  const zoeCommentOnA11y = zoe && a11yNote && allComments.find(c =>
    c.userId?.toString() === zoe._id.toString() &&
    c.targetId?.toString() === a11yNote._id.toString()
  );

  // Pick a conversation with Chris and with Ryan
  const chrisConv = conversations.find(c =>
    chris && c.participants.some(p => p.toString() === chris._id.toString())
  );
  const ryanConv = conversations.find(c =>
    ryan && c.participants.some(p => p.toString() === ryan._id.toString())
  );

  const entries = [
    // Today (unread)
    chris && urlShortenerNote && {
      userId: jane._id,
      actorId: chris._id,
      type: 'comment_added',
      targetId: urlShortenerNote._id,
      targetType: 'note',
      message: `Chris commented on your note: "System Design - URL Shortener"`,
      metadata: chrisCommentOnUrl ? { commentPreview: chrisCommentOnUrl.content.slice(0, 120), commentId: chrisCommentOnUrl._id.toString() } : undefined,
      read: false,
      createdAt: hoursAgo(2),
    },
    isabella && janeReply && {
      userId: jane._id,
      actorId: isabella._id,
      type: 'like_added',
      targetId: janeReply._id,
      targetType: 'comment',
      message: 'Isabella liked your comment',
      metadata: janeReply ? { commentPreview: janeReply.content?.slice(0, 120), commentId: janeReply._id.toString(), resourceId: janeReply.targetId?.toString(), resourceType: janeReply.targetType } : undefined,
      read: false,
      createdAt: hoursAgo(3),
    },
    chris && chrisConv && {
      userId: jane._id,
      actorId: chris._id,
      type: 'new_message',
      targetId: chrisConv._id,
      targetType: 'conversation',
      message: 'Chris sent you a message',
      metadata: { messagePreview: 'Hey Jane, are you free to review my React hooks implementation?' },
      read: false,
      createdAt: hoursAgo(4),
    },
    // This week (mix of read/unread)
    ryan && reactHooksNote && {
      userId: jane._id,
      actorId: ryan._id,
      type: 'comment_added',
      targetId: reactHooksNote._id,
      targetType: 'note',
      message: `Ryan commented on your note: "React Hooks - Deep Dive"`,
      metadata: ryanCommentOnReact ? { commentPreview: ryanCommentOnReact.content.slice(0, 120), commentId: ryanCommentOnReact._id.toString() } : undefined,
      read: false,
      createdAt: daysAgo(3),
    },
    logan && janeReply && {
      userId: jane._id,
      actorId: logan._id,
      type: 'like_added',
      targetId: janeReply._id,
      targetType: 'comment',
      message: 'Logan liked your comment',
      metadata: janeReply ? { commentPreview: janeReply.content?.slice(0, 120), commentId: janeReply._id.toString(), resourceId: janeReply.targetId?.toString(), resourceType: janeReply.targetType } : undefined,
      read: true,
      readAt: daysAgo(3),
      createdAt: daysAgo(4),
    },
    // This month (read)
    zoe && a11yNote && {
      userId: jane._id,
      actorId: zoe._id,
      type: 'comment_added',
      targetId: a11yNote._id,
      targetType: 'note',
      message: `Zoe commented on your note: "Web Accessibility (a11y) Guide"`,
      metadata: zoeCommentOnA11y ? { commentPreview: zoeCommentOnA11y.content.slice(0, 120), commentId: zoeCommentOnA11y._id.toString() } : undefined,
      read: true,
      readAt: daysAgo(12),
      createdAt: daysAgo(13),
    },
    ryan && ryanConv && {
      userId: jane._id,
      actorId: ryan._id,
      type: 'new_message',
      targetId: ryanConv?._id || urlShortenerNote._id,
      targetType: ryanConv ? 'conversation' : 'note',
      message: 'Ryan sent you a message',
      metadata: { messagePreview: 'I pushed the URL shortener implementation - can you take a look?' },
      read: true,
      readAt: daysAgo(11),
      createdAt: daysAgo(12),
    },
    caroline && {
      userId: jane._id,
      actorId: caroline._id,
      type: 'friend_accepted',
      targetId: jane._id,
      targetType: 'friendship',
      message: 'Caroline accepted your friend request',
      read: true,
      readAt: daysAgo(14),
      createdAt: daysAgo(15),
    },
    // Earlier (read)
    kian && {
      userId: jane._id,
      actorId: kian._id,
      type: 'friend_request',
      targetId: jane._id,
      targetType: 'friendship',
      message: 'Kian sent you a friend request',
      read: true,
      readAt: daysAgo(46),
      createdAt: daysAgo(47),
    },
  ].filter(Boolean);

  for (const entry of entries) {
    await Notification.create(entry);
  }

  console.log(`  Created ${entries.length} notifications for Jane.`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('No MongoDB URI — set MONGODB_URI in backend/.env or pass MONGO_URI=<uri>');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Idempotency check — match by email to handle migration from old 'janedoe' username
    const existing = await User.findOne({ email: 'janedoe_demo@example.com' });
    if (existing && !CLEAN) {
      console.log('Jane Doe already exists. Use --clean to reseed.');
      process.exit(0);
    }

    // Clean if requested
    if (CLEAN && existing) {
      await cleanJaneData(existing._id);
    }

    // 1. Create Jane
    const jane = await createJane();

    // 2. Friends + friendships
    const friends = await seedFriends(jane);

    // 3. Notes
    const { personalNotes, sharedNotes } = await seedNotes(jane, friends);

    // 4. Flashcard sets
    const allSets = await seedFlashcardSets(jane, sharedNotes);

    // 4.5. Study sessions
    await seedStudySessions(jane, allSets);

    // 5. Tasks
    const allTasks = await seedTasks(jane, friends);

    // 6. Applications
    await seedApplications(jane);

    // 7. Resume
    await seedResume(jane);

    // 8. Conversations
    const convDocs = await Conversation.find({ participants: jane._id }).lean();
    await seedConversations(jane, friends);

    // 9. Share messages
    await seedShareMessages(jane, friends, sharedNotes, allSets, allTasks);

    // 10. Comments
    const allComments = await seedComments(jane, friends, sharedNotes);

    // 11. Activity feed
    await seedActivities(jane, friends, sharedNotes, allSets, allTasks, allComments);

    // 12. Friend content (shared notes, flashcard sets, shared tasks with Jane)
    await seedFriendContent(jane, friends);

    // 13. Notifications
    const convDocsAfter = await Conversation.find({ participants: jane._id }).lean();
    await seedNotifications(jane, friends, sharedNotes, allComments, convDocsAfter);

    // Bust Redis activity cache so pages don't show stale data after reseed
    try {
      const { invalidatePattern } = require('../lib/cache');
      const allIds = [jane._id, ...friends.map(f => f._id)];
      for (const uid of allIds) await invalidatePattern(`activity:${uid}:first`);
    } catch (_) {}

    console.log('\nJane Doe demo account seeded successfully!');
    console.log('  Email:    janedoe_demo@example.com');
    console.log('  Password: Demo@1234');
    console.log('  Notes:    ' + (personalNotes.length + sharedNotes.length));
    console.log('  Friends:  ' + friends.length);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
