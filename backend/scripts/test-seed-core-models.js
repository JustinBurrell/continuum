const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/database');

// Import all core models
const User = require('../models/User');
const Note = require('../models/Note');
const FlashcardSet = require('../models/FlashcardSet');
const Flashcard = require('../models/Flashcard');
const Task = require('../models/Task');

// ============================================================
// SEED SCRIPT FOR CORE MODELS
// Purpose: Populate the database with test data to verify models work
// Run: node backend/scripts/test-seed-core-models.js
// ============================================================

const seedDatabase = async () => {
    try {
        // Connect to MongoDB
        await connectDB();
        console.log('--- Starting seed script ---\n');

        // ========================================
        // CLEAR EXISTING TEST DATA
        // Purpose: Start fresh every time the script runs
        // Note: deleteMany({}) removes ALL documents in each collection
        // ========================================
        await Flashcard.deleteMany({});
        await FlashcardSet.deleteMany({});
        await Task.deleteMany({});
        await Note.deleteMany({});
        await User.deleteMany({});
        console.log('Cleared existing data.\n');

        // ========================================
        // CREATE USER
        // Purpose: Seed a test user (all other models reference userId)
        // Verify: password gets hashed by pre-save hook (not stored as plain text)
        // ========================================
        const user = await User.create({
            email: 'testuser@continuum.dev',
            username: 'testuser',
            password: 'Test1234!',
            firstName: 'Justin',
            lastName: 'Burrell',
        });

        console.log('USER CREATED');
        console.log('  _id:', user._id);
        console.log('  email:', user.email);
        console.log('  fullName:', user.fullName);

        // Verify password was hashed by the pre-save hook
        // We need select('+password') because password has select: false in the schema
        const userWithPassword = await User.findById(user._id).select('+password');
        console.log('  password hashed:', userWithPassword.password !== 'Test1234!');
        console.log('  hashed value:', userWithPassword.password.substring(0, 20) + '...');
        console.log();

        // ========================================
        // CREATE NOTE
        // Purpose: Seed a test note linked to the user
        // Verify: hasSummary virtual returns false (no summary yet)
        // ========================================
        const note = await Note.create({
            userId: user._id,
            title: 'Introduction to Data Structures',
            content: '<h1>Arrays</h1><p>An array is a collection of elements...</p>',
            contentType: 'html',
            tags: ['computer-science', 'data-structures'],
            subject: 'CS 201',
            visibility: 'private',
        });

        console.log('NOTE CREATED');
        console.log('  _id:', note._id);
        console.log('  title:', note.title);
        console.log('  hasSummary:', note.hasSummary);
        console.log('  tags:', note.tags);
        console.log();

        // ========================================
        // CREATE FLASHCARD SET
        // Purpose: Seed a flashcard set linked to the user and note
        // Verify: totalCards defaults to 0, visibility defaults to 'private'
        // ========================================
        const set = await FlashcardSet.create({
            userId: user._id,
            noteId: note._id,
            title: 'Data Structures Flashcards',
            description: 'Key terms from CS 201 notes',
        });

        console.log('FLASHCARD SET CREATED');
        console.log('  _id:', set._id);
        console.log('  title:', set.title);
        console.log('  totalCards:', set.totalCards);
        console.log('  visibility:', set.visibility);
        console.log();

        // ========================================
        // CREATE FLASHCARDS
        // Purpose: Seed flashcards linked to the set
        // Verify: Cards are created with correct setId reference
        // ========================================
        const card1 = await Flashcard.create({
            setId: set._id,
            front: 'What is an array?',
            back: 'A collection of elements stored at contiguous memory locations.',
            order: 0,
        });

        const card2 = await Flashcard.create({
            setId: set._id,
            front: 'What is the time complexity of array access by index?',
            back: 'O(1) — constant time.',
            order: 1,
        });

        const card3 = await Flashcard.create({
            setId: set._id,
            front: 'What is a linked list?',
            back: 'A linear data structure where elements are stored in nodes connected by pointers.',
            order: 2,
        });

        console.log('FLASHCARDS CREATED');
        console.log('  card1:', card1._id, '|', card1.front);
        console.log('  card2:', card2._id, '|', card2.front);
        console.log('  card3:', card3._id, '|', card3.front);
        console.log('  all reference setId:', card1.setId.equals(set._id) && card2.setId.equals(set._id));
        console.log();

        // ========================================
        // CREATE TASK
        // Purpose: Seed a test task linked to the user
        // Verify: isOverdue virtual works, completedAt is null for 'todo' status
        // ========================================
        const task = await Task.create({
            userId: user._id,
            title: 'Study for CS 201 Midterm',
            description: 'Review data structures notes and flashcards',
            dueDate: new Date('2026-02-20'),
            type: 'study',
            priority: 'high',
            status: 'todo',
        });

        console.log('TASK CREATED');
        console.log('  _id:', task._id);
        console.log('  title:', task.title);
        console.log('  status:', task.status);
        console.log('  isOverdue:', task.isOverdue);
        console.log('  completedAt:', task.completedAt);
        console.log();

        // ========================================
        // VERIFY REFERENCES (POPULATE)
        // Purpose: Test that ObjectId references actually link to real documents
        // ========================================

        // Populate note's userId — replaces the raw ObjectId with the actual User document
        // Second arg ('username email') limits which User fields come back
        const populatedNote = await Note.findById(note._id).populate('userId', 'username email');
        console.log('POPULATE TEST');
        console.log('  Note owner:', populatedNote.userId.username, '(' + populatedNote.userId.email + ')');

        // Populate flashcard set's virtual 'flashcards' — pulls in all Flashcard docs where setId matches
        const populatedSet = await FlashcardSet.findById(set._id).populate('flashcards');
        console.log('  Cards in set:', populatedSet.flashcards.length);
        populatedSet.flashcards.forEach(card => {
            console.log('    -', card.front);
        });
        console.log();

        // ========================================
        // VERIFY PRE-SAVE HOOK (TASK COMPLETION)
        // Purpose: Test that completing a task auto-sets completedAt
        // ========================================

        // Change status and call .save() — this triggers the pre-save hook
        // The hook detects isModified('status') and sets completedAt = new Date()
        task.status = 'completed';
        await task.save();

        console.log('PRE-SAVE HOOK TEST');
        console.log('  status:', task.status);
        console.log('  completedAt:', task.completedAt);
        console.log('  completedAt is a Date:', task.completedAt instanceof Date);

        console.log('\n--- Seed script complete ---');

    } catch (error) {
        console.error('Seed script failed:', error.message);
        console.error(error);
    } finally {
        // Always disconnect when done
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
    }
};

// Run the script
seedDatabase();