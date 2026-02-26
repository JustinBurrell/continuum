const FlashcardSet = require('../models/FlashcardSet');
const Flashcard = require('../models/Flashcard');
const groqService = require('../services/groq.service');

// ============================================================
// FLASHCARD SETS CONTROLLER
// Purpose: Handle business logic for flashcard set endpoints
// Used by: routes/flashcardSets.routes.js
// Endpoints: generateFromContent (API-8)
//            Full CRUD covered in API-9
// ============================================================

// ----------------------------------------
// POST /api/flashcard-sets/generate
// Purpose: Generate AI flashcards from raw submitted content (no note required)
//   - Body: { content, title }
//   - title is optional — defaults to "Generated Flashcard Set"
//   - Creates a FlashcardSet not linked to any note (noteId: null)
//   - Bulk inserts Flashcard docs and updates totalCards
// Generated once — no regeneration
// ----------------------------------------
exports.generateFromContent = async (req, res) => {
    const { content, title } = req.body;

    if (!content || content.trim().length === 0) {
        return res.status(400).json({ success: false, error: 'Content is required to generate flashcards' });
    }

    const result = await groqService.generateFlashcards(content);

    // Create the FlashcardSet — not linked to any note
    const set = await FlashcardSet.create({
        userId: req.user._id,
        noteId: null,
        title: title?.trim() || 'Generated Flashcard Set',
        isAIGenerated: true,
        generatedAt: new Date(),
        totalCards: result.cards.length,
    });

    // Bulk insert all flashcard docs
    const flashcardDocs = result.cards.map((card, index) => ({
        setId: set._id,
        front: card.front,
        back: card.back,
        order: index,
    }));
    await Flashcard.insertMany(flashcardDocs);

    const populatedSet = await FlashcardSet.findById(set._id).populate('flashcards');

    res.status(201).json({ success: true, set: populatedSet });
};
