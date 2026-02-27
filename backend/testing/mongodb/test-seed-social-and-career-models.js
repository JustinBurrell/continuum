const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/database');

// Import all models needed for this seed script
const User = require('../models/User');
const Note = require('../models/Note');
const Friendship = require('../models/Friendship');
const Comment = require('../models/Comment');
const Resume = require('../models/Resume');
const Application = require('../models/Application');

// ============================================================
// SEED SCRIPT FOR SOCIAL & CAREER MODELS
// Purpose: Populate the database with test data to verify social and career models work
// Run: node backend/scripts/test-seed-social-and-career-models.js
// Tests: Friendship (pre-save hook, unique index), Comment (pre-save snapshot),
//        Resume (embedded feedback, virtuals), Application (contacts, reminders)
// ============================================================

const seedDatabase = async () => {
    try {
        // Connect to MongoDB
        await connectDB();
        console.log('--- Starting social & career seed script ---\n');

        // ========================================
        // CLEAR EXISTING TEST DATA
        // Purpose: Start fresh every time the script runs
        // Note: Order matters — clear child documents before parents
        // ========================================
        await Application.deleteMany({});
        await Resume.deleteMany({});
        await Comment.deleteMany({});
        await Friendship.deleteMany({});
        await Note.deleteMany({});
        await User.deleteMany({});
        console.log('Cleared existing data.\n');

        // ========================================
        // CREATE USERS
        // Purpose: Seed two test users for friendship and social features
        // ========================================
        const user1 = await User.create({
            email: 'alice@continuum.dev',
            username: 'alice',
            password: 'Test1234!',
            firstName: 'Alice',
            lastName: 'Johnson',
        });

        const user2 = await User.create({
            email: 'bob@continuum.dev',
            username: 'bob',
            password: 'Test1234!',
            firstName: 'Bob',
            lastName: 'Smith',
        });

        console.log('USERS CREATED');
        console.log('  user1:', user1._id, '|', user1.fullName);
        console.log('  user2:', user2._id, '|', user2.fullName);
        console.log();

        // ========================================
        // CREATE NOTE (for comment target)
        // Purpose: Seed a note so we can test comments on it
        // ========================================
        const note = await Note.create({
            userId: user1._id,
            title: 'Shared Study Notes',
            content: '<p>These are notes shared with friends.</p>',
            contentType: 'html',
            tags: ['study'],
            visibility: 'friends',
        });

        console.log('NOTE CREATED');
        console.log('  _id:', note._id);
        console.log('  title:', note.title);
        console.log();

        // ========================================
        // CREATE FRIENDSHIP
        // Purpose: Test the friendship model and pre-save hook
        // Verify: Pre-save hook swaps user1/user2 so user1 < user2
        // Verify: requestedBy tracks who sent the request
        // ========================================

        // Intentionally pass the "bigger" ObjectId as user1 to test the swap
        const biggerFirst = user1._id.toString() > user2._id.toString();
        const friendship = await Friendship.create({
            user1: biggerFirst ? user1._id : user2._id,  // pass the bigger one first
            user2: biggerFirst ? user2._id : user1._id,  // pass the smaller one second
            requestedBy: user1._id,
            status: 'pending',
            requestedAt: new Date(),
        });

        console.log('FRIENDSHIP CREATED');
        console.log('  _id:', friendship._id);
        console.log('  user1:', friendship.user1);
        console.log('  user2:', friendship.user2);
        console.log('  requestedBy:', friendship.requestedBy);
        console.log('  status:', friendship.status);

        // Verify pre-save hook enforced user1 < user2
        const user1IsSmaller = friendship.user1.toString() < friendship.user2.toString();
        console.log('  user1 < user2 (pre-save hook worked):', user1IsSmaller);
        console.log();

        // ========================================
        // TEST UNIQUE COMPOUND INDEX (FRIENDSHIP)
        // Purpose: Verify that creating a duplicate friendship throws an error
        // ========================================
        console.log('UNIQUE INDEX TEST');
        try {
            await Friendship.create({
                user1: user1._id,
                user2: user2._id,
                requestedBy: user2._id,
                status: 'pending',
                requestedAt: new Date(),
            });
            console.log('  FAIL — duplicate friendship was created (should have been rejected)');
        } catch (error) {
            console.log('  PASS — duplicate friendship rejected:', error.code === 11000 ? 'E11000 duplicate key' : error.message);
        }
        console.log();

        // ========================================
        // ACCEPT FRIENDSHIP
        // Purpose: Test updating friendship status
        // Verify: respondedAt gets set, status changes to 'accepted'
        // ========================================
        friendship.status = 'accepted';
        friendship.respondedAt = new Date();
        await friendship.save();

        console.log('FRIENDSHIP ACCEPTED');
        console.log('  status:', friendship.status);
        console.log('  respondedAt:', friendship.respondedAt);
        console.log();

        // ========================================
        // CREATE COMMENT
        // Purpose: Test the comment model and pre-save user snapshot hook
        // Verify: userSnapshot is auto-populated from the User collection on creation
        // ========================================
        const comment = await Comment.create({
            targetId: note._id,
            targetType: 'note',
            userId: user2._id,
            content: 'Great notes! The data structures section was really helpful.',
        });

        console.log('COMMENT CREATED');
        console.log('  _id:', comment._id);
        console.log('  targetType:', comment.targetType);
        console.log('  content:', comment.content.substring(0, 50) + '...');
        console.log('  userSnapshot.username:', comment.userSnapshot?.username);
        console.log('  userSnapshot.firstName:', comment.userSnapshot?.firstName);
        console.log('  userSnapshot.lastName:', comment.userSnapshot?.lastName);
        console.log('  snapshot populated (pre-save hook worked):', !!comment.userSnapshot?.username);
        console.log();

        // ========================================
        // CREATE REPLY COMMENT (THREADING)
        // Purpose: Test threaded comments via parentId
        // Verify: parentId links to the original comment
        // ========================================
        const reply = await Comment.create({
            targetId: note._id,
            targetType: 'note',
            userId: user1._id,
            content: 'Thanks! I spent a lot of time on that section.',
            parentId: comment._id,
        });

        console.log('REPLY COMMENT CREATED');
        console.log('  _id:', reply._id);
        console.log('  parentId:', reply.parentId);
        console.log('  is reply to original:', reply.parentId.equals(comment._id));
        console.log('  userSnapshot.username:', reply.userSnapshot?.username);
        console.log();

        // ========================================
        // ADD LIKE TO COMMENT
        // Purpose: Test the likes array
        // Verify: User ObjectId is added to the likes array
        // ========================================
        comment.likes.push(user1._id);
        await comment.save();

        console.log('LIKE ADDED');
        console.log('  likes count:', comment.likes.length);
        console.log('  liked by:', comment.likes[0]);
        console.log();

        // ========================================
        // CREATE RESUME
        // Purpose: Test the resume model with embedded feedback
        // Verify: hasFeedback virtual returns false before feedback, true after
        // Verify: latestFeedback virtual returns the most recent feedback entry
        // ========================================
        const resume = await Resume.create({
            userId: user1._id,
            fileName: 'Alice_Johnson_Resume_2026.pdf',
            fileUrl: 'https://res.cloudinary.com/continuum/raw/upload/v1/resumes/alice_resume.pdf',
            fileSize: 245000,
            mimeType: 'application/pdf',
            version: 'Software Engineer v1',
            targetRole: 'Full-Stack Developer',
            uploadedAt: new Date(),
        });

        console.log('RESUME CREATED');
        console.log('  _id:', resume._id);
        console.log('  fileName:', resume.fileName);
        console.log('  version:', resume.version);
        console.log('  hasFeedback (before):', resume.hasFeedback);
        console.log();

        // ========================================
        // ADD AI FEEDBACK TO RESUME
        // Purpose: Test embedded feedback array and virtuals
        // Verify: Feedback is pushed to the array, not a separate collection
        // Verify: latestFeedback returns the most recent entry
        // ========================================
        resume.feedback.push({
            overallScore: 72,
            strengths: ['Strong technical skills section', 'Clean formatting'],
            improvements: ['Add more quantifiable achievements', 'Include a summary statement'],
            sections: [
                { name: 'Experience', feedback: 'Good descriptions but lacks metrics', score: 68 },
                { name: 'Skills', feedback: 'Well-organized and relevant', score: 85 },
                { name: 'Education', feedback: 'Complete and well-formatted', score: 80 },
            ],
            keywordOptimization: {
                presentKeywords: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
                missingKeywords: ['TypeScript', 'CI/CD', 'AWS', 'Docker'],
            },
            model: 'llama-3.1-70b',
            generatedAt: new Date(),
        });
        await resume.save();

        console.log('AI FEEDBACK ADDED');
        console.log('  hasFeedback (after):', resume.hasFeedback);
        console.log('  latestFeedback.overallScore:', resume.latestFeedback?.overallScore);
        console.log('  latestFeedback.strengths:', resume.latestFeedback?.strengths);
        console.log('  latestFeedback.sections count:', resume.latestFeedback?.sections?.length);
        console.log('  missingKeywords:', resume.latestFeedback?.keywordOptimization?.missingKeywords);
        console.log();

        // ========================================
        // VERIFY extractedText (select: false)
        // Purpose: Test that extractedText is excluded from normal queries
        // Verify: Normal findById doesn't return extractedText
        // Verify: select('+extractedText') includes it
        // ========================================

        // First, add extracted text to the resume
        await Resume.findByIdAndUpdate(resume._id, {
            extractedText: 'Alice Johnson | Software Engineer | alice@email.com\nExperience: ...',
        });

        const resumeNormal = await Resume.findById(resume._id);
        const resumeWithText = await Resume.findById(resume._id).select('+extractedText');

        console.log('extractedText SELECT TEST');
        console.log('  without select: extractedText is', resumeNormal.extractedText === undefined ? 'hidden (correct)' : 'visible (wrong)');
        console.log('  with +select: extractedText is', resumeWithText.extractedText ? 'visible (correct)' : 'hidden (wrong)');
        console.log();

        // ========================================
        // CREATE APPLICATION
        // Purpose: Test the application model with contacts and reminders
        // Verify: Embedded contacts and followUpReminders arrays work
        // Verify: resumeUsed links to the Resume model
        // ========================================
        const application = await Application.create({
            userId: user1._id,
            company: 'Google',
            position: 'Software Engineer Intern',
            location: 'Mountain View, CA',
            jobUrl: 'https://careers.google.com/jobs/123',
            status: 'applied',
            appliedAt: new Date(),
            deadlineDate: new Date('2026-03-15'),
            resumeUsed: resume._id,
            contacts: [{
                name: 'Sarah Chen',
                role: 'Engineering Manager',
                email: 'sarah@google.com',
                linkedIn: 'https://linkedin.com/in/sarahchen',
                lastContactDate: new Date(),
                notes: 'Met at campus career fair, very encouraging',
            }],
            notes: 'Applied through campus recruiting. Prep focus: system design, algorithms, behavioral.',
            followUpReminders: [{
                date: new Date('2026-03-01'),
                description: 'Follow up with Sarah about application status',
                completed: false,
            }],
        });

        console.log('APPLICATION CREATED');
        console.log('  _id:', application._id);
        console.log('  company:', application.company);
        console.log('  position:', application.position);
        console.log('  status:', application.status);
        console.log('  contacts count:', application.contacts.length);
        console.log('  contact name:', application.contacts[0]?.name);
        console.log('  reminders count:', application.followUpReminders.length);
        console.log('  reminder:', application.followUpReminders[0]?.description);
        console.log('  resumeUsed:', application.resumeUsed);
        console.log();

        // ========================================
        // VERIFY REFERENCES (POPULATE)
        // Purpose: Test that ObjectId references actually link to real documents
        // ========================================
        const populatedApp = await Application.findById(application._id)
            .populate('userId', 'username firstName lastName')
            .populate('resumeUsed', 'fileName version');

        console.log('POPULATE TEST');
        console.log('  Application owner:', populatedApp.userId.firstName, populatedApp.userId.lastName);
        console.log('  Resume used:', populatedApp.resumeUsed.fileName, '(' + populatedApp.resumeUsed.version + ')');
        console.log();

        // ========================================
        // UPDATE APPLICATION STATUS
        // Purpose: Test status pipeline transitions
        // ========================================
        application.status = 'interview';
        application.interviewDates.push(new Date('2026-03-10'));
        await application.save();

        console.log('APPLICATION STATUS UPDATED');
        console.log('  status:', application.status);
        console.log('  interviewDates:', application.interviewDates);
        console.log();

        // ========================================
        // SUMMARY
        // ========================================
        const counts = {
            users: await User.countDocuments(),
            notes: await Note.countDocuments(),
            friendships: await Friendship.countDocuments(),
            comments: await Comment.countDocuments(),
            resumes: await Resume.countDocuments(),
            applications: await Application.countDocuments(),
        };

        console.log('DOCUMENT COUNTS');
        Object.entries(counts).forEach(([model, count]) => {
            console.log(`  ${model}: ${count}`);
        });

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
