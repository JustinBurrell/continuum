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
  Friendship, Conversation, Message, Comment, Activity,
} = require('../models');
const Resume = require('../models/Resume');
const { sendShareMessage } = require('../services/share.service');
const data = require('./seed-jane-data');

const CLEAN = process.argv.includes('--clean');

// ─── Jane's 20 friends (promoted from SEED_STRANGERS) ──────────────────────
const JANE_FRIEND_USERNAMES = [
  'carolinehall', 'chrisnguyen', 'connorflynn', 'dianachen', 'ethancooper',
  'evawong', 'graciecallahan', 'isabellachang', 'jadewashington', 'jasonmendez',
  'kevinzhang', 'kiananderson', 'logancarter', 'michaelrobbins', 'noahcoleman',
  'rachelmontgomery', 'ryanfoster', 'taylormorgan', 'trevornash', 'zoeanderson',
];

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

  // Activities
  await Activity.deleteMany({ userId: janeId });

  // Friendships
  await Friendship.deleteMany({
    $or: [{ user1: janeId }, { user2: janeId }],
  });

  // Jane herself
  await User.deleteOne({ _id: janeId });

  console.log('Clean complete.');
}

// ─── SECTION 1: Create Jane ──────────────────────────────────────────────────

async function createJane() {
  console.log('Creating Jane Doe...');
  let jane = await User.findOne({ username: 'janedoe' });
  if (!jane) {
    jane = new User({
      username: 'janedoe',
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
    let user = await User.findOne({ username });
    if (!user) {
      // Friend hasn't been seeded yet — create with isSeedUser flag
      user = new User({
        username,
        email: `${username}_demo@example.com`,
        password: 'Demo@1234',
        firstName: username.charAt(0).toUpperCase() + username.slice(1),
        lastName: '',
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
      contentType: 'markdown',
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
      contentType: 'markdown',
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
    }

    // Jane replies to at least one comment on her shared notes
    if (i < 8) {
      const reply = await Comment.create({
        targetId: note._id,
        targetType: 'note',
        userId: jane._id,
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

  // Jane's shared notes → note_shared activities
  for (let i = 0; i < Math.min(data.activityMeta.noteShareCount, sharedNotes.length); i++) {
    const note = sharedNotes[i];
    await Activity.create({
      userId: jane._id,
      type: 'note_shared',
      targetId: note._id,
      targetType: 'note',
      visibleTo: [jane._id, ...allFriendIds],
      metadata: { noteTitle: note.title, sharedWithAll: true },
      createdAt: bumpDate(),
    });
    count++;
  }

  // Jane's shared flashcard sets → flashcard_shared activities
  const sharedSets = allSets.filter(s => s.visibility === 'friends');
  for (const set of sharedSets) {
    await Activity.create({
      userId: jane._id,
      type: 'flashcard_shared',
      targetId: set._id,
      targetType: 'flashcardSet',
      visibleTo: [jane._id, ...allFriendIds],
      metadata: { setTitle: set.title, sharedWithAll: true },
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
      targetId: comment._id,
      targetType: 'comment',
      visibleTo: [jane._id, ...allFriendIds],
      metadata: { commentPreview: comment.content.slice(0, 100) },
      createdAt: bumpDate(),
    });
    count++;
  }

  // Friends' comment activities (friends commenting on Jane's notes)
  const friendComments = allComments.filter(c => {
    const cId = c.userId?.toString();
    return allFriendIds.some(fid => fid.toString() === cId);
  }).slice(0, 8);

  for (const fc of friendComments) {
    const commenterFriend = friends.find(f => f._id.toString() === fc.userId?.toString());
    if (!commenterFriend) continue;
    const visibleToAll = [commenterFriend._id, jane._id, ...allFriendIds.filter(id => !id.equals(commenterFriend._id))];
    await Activity.create({
      userId: commenterFriend._id,
      type: 'comment_added',
      targetId: fc._id,
      targetType: 'comment',
      visibleTo: visibleToAll,
      metadata: { commentPreview: fc.content.slice(0, 100) },
      createdAt: bumpDate(),
    });
    count++;
  }

  // Task completion activities for Jane's completed tasks
  const completedTasks = allTasks.filter(
    t => t.status === 'completed' && t.userId?.toString() === jane._id.toString()
  ).slice(0, 5);

  for (const task of completedTasks) {
    await Activity.create({
      userId: jane._id,
      type: 'task_completed',
      targetId: task._id,
      targetType: 'task',
      visibleTo: [jane._id, ...allFriendIds],
      metadata: { taskTitle: task.title },
      createdAt: bumpDate(),
    });
    count++;
  }

  console.log(`  Created ${count} activities.`);
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

    // Idempotency check
    const existing = await User.findOne({ username: 'janedoe' });
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

    // 5. Tasks
    const allTasks = await seedTasks(jane, friends);

    // 6. Applications
    await seedApplications(jane);

    // 7. Resume
    await seedResume(jane);

    // 8. Conversations
    await seedConversations(jane, friends);

    // 9. Share messages
    await seedShareMessages(jane, friends, sharedNotes, allSets, allTasks);

    // 10. Comments
    const allComments = await seedComments(jane, friends, sharedNotes);

    // 11. Activity feed
    await seedActivities(jane, friends, sharedNotes, allSets, allTasks, allComments);

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
  }
}

main();
