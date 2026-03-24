const { Queue, Worker } = require('bullmq');
const { getIO } = require('./socket');

// ============================================================
// AI JOB QUEUE
// Purpose: Run AI generation tasks off the request thread using BullMQ.
//          Endpoints enqueue a job and return { jobId } immediately.
//          A socket event fires to the user's room when the job completes.
// Requires: REDIS_URL env var. Falls back to synchronous when unset.
// Job types: note-summary, note-flashcards, flashcard-generate, resume-feedback
// ============================================================

let aiQueue = null;

// ----------------------------------------
// initQueue
// Call once at server startup (after initSocket).
// No-op if REDIS_URL is not set — controllers fall back to synchronous.
// ----------------------------------------
async function initQueue() {
    if (!process.env.REDIS_URL) return;

    const IORedis = require('ioredis');

    // BullMQ requires maxRetriesPerRequest: null on ioredis connections
    const queueConn = new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
    const workerConn = new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null });

    aiQueue = new Queue('ai-jobs', { connection: queueConn });

    const worker = new Worker('ai-jobs', async (job) => {
        const groqService = require('../services/groq.service');
        const io = getIO();

        // ── note-summary ─────────────────────────────────────
        if (job.name === 'note-summary') {
            const { noteId, userId, isOwner } = job.data;
            const Note = require('../models/Note');
            const note = await Note.findById(noteId);
            if (!note) return;

            const result = await groqService.generateSummary(note.content, userId);

            if (isOwner) {
                await Note.findByIdAndUpdate(noteId, {
                    summary: {
                        quickSummary: result.quickSummary,
                        detailedSummary: result.detailedSummary,
                        generatedAt: new Date(),
                        model: result.model,
                        tokenCount: result.tokenCount,
                    },
                });
            }

            io?.to(`user:${userId}`).emit('note_summary_ready', {
                noteId,
                summary: { quickSummary: result.quickSummary, detailedSummary: result.detailedSummary },
                persisted: isOwner,
            });
        }

        // ── note-flashcards ───────────────────────────────────
        else if (job.name === 'note-flashcards') {
            const { noteId, userId, isOwner } = job.data;
            const Note = require('../models/Note');
            const FlashcardSet = require('../models/FlashcardSet');
            const Flashcard = require('../models/Flashcard');

            const note = await Note.findById(noteId);
            if (!note) return;

            const result = await groqService.generateFlashcards(note.content, userId);

            const set = await FlashcardSet.create({
                userId,
                noteId: note._id,
                title: note.title ? `${note.title} — Flashcards` : 'Generated Flashcard Set',
                isAIGenerated: true,
                generatedAt: new Date(),
                totalCards: result.cards.length,
            });

            const flashcardDocs = result.cards.map((card, index) => ({
                setId: set._id,
                front: card.front,
                back: card.back,
                order: index,
            }));
            await Flashcard.insertMany(flashcardDocs);

            if (isOwner) {
                await Note.findByIdAndUpdate(noteId, { hasFlashcards: true });
            }

            io?.to(`user:${userId}`).emit('flashcards_ready', {
                noteId,
                setId: set._id.toString(),
            });
        }

        // ── flashcard-generate (from raw content) ─────────────
        else if (job.name === 'flashcard-generate') {
            const { content, title, userId } = job.data;
            const FlashcardSet = require('../models/FlashcardSet');
            const Flashcard = require('../models/Flashcard');

            const result = await groqService.generateFlashcards(content, userId);

            const set = await FlashcardSet.create({
                userId,
                noteId: null,
                title: title || 'Generated Flashcard Set',
                isAIGenerated: true,
                generatedAt: new Date(),
                totalCards: result.cards.length,
            });

            const flashcardDocs = result.cards.map((card, index) => ({
                setId: set._id,
                front: card.front,
                back: card.back,
                order: index,
            }));
            await Flashcard.insertMany(flashcardDocs);

            io?.to(`user:${userId}`).emit('flashcards_ready', {
                noteId: null,
                setId: set._id.toString(),
            });
        }

        // ── resume-feedback ───────────────────────────────────
        else if (job.name === 'resume-feedback') {
            const { resumeId, userId } = job.data;
            const Resume = require('../models/Resume');

            const resume = await Resume.findOne({ _id: resumeId, userId }).select('+extractedText');
            if (!resume) return;

            const result = await groqService.generateResumeFeedback(resume.extractedText, userId);

            const updated = await Resume.findByIdAndUpdate(
                resumeId,
                {
                    $push: {
                        feedback: {
                            overallScore: result.overallScore,
                            strengths: result.strengths,
                            improvements: result.improvements,
                            sections: result.sections,
                            keywordOptimization: result.keywordOptimization,
                            model: result.model,
                            generatedAt: new Date(),
                        },
                    },
                },
                { new: true }
            );

            const newFeedback = updated.feedback[updated.feedback.length - 1];
            io?.to(`user:${userId}`).emit('resume_feedback_ready', {
                resumeId,
                feedbackId: newFeedback._id.toString(),
            });
        }
    }, { connection: workerConn });

    // Log failures and notify the user via socket
    worker.on('failed', (job, err) => {
        console.error(JSON.stringify({
            event: 'job_failed',
            jobId: job?.id,
            jobName: job?.name,
            error: err.message,
            ts: new Date().toISOString(),
        }));

        const io = getIO();
        const userId = job?.data?.userId;
        if (io && userId) {
            const failEventMap = {
                'note-summary': 'note_summary_failed',
                'note-flashcards': 'flashcards_failed',
                'flashcard-generate': 'flashcards_failed',
                'resume-feedback': 'resume_feedback_failed',
            };
            const event = failEventMap[job.name];
            if (event) {
                io.to(`user:${userId}`).emit(event, { error: 'AI generation failed. Please try again.' });
            }
        }
    });
}

function getQueue() {
    return aiQueue;
}

module.exports = { initQueue, getQueue };
