const groq = require('../config/groq');

// ============================================================
// GROQ SERVICE
// Purpose: Centralized module for all Groq AI calls
// Model: llama-3.1-8b-instant (14.4K RPD / 500K TPD on free tier)
// Used by: notes.controller (summary), notes.controller (flashcards — API-8)
// ============================================================

const MODEL = 'llama-3.1-8b-instant';

// ----------------------------------------
// generateSummary
// Purpose: Generate a quick summary and detailed breakdown of note content
// Returns: { quickSummary, detailedSummary, model, tokenCount }
//
// Quick summary  — 3-5 sentence TL;DR in plain prose
// Detailed summary — covers:
//   - Key Concepts: definitions and explanations of main terms
//   - Main Ideas: core topics and arguments covered
//   - Important Details: specific facts, formulas, examples worth remembering
//   - Things to Keep in Mind: caveats, common mistakes, or nuances
// ----------------------------------------
const generateSummary = async (content) => {
    const systemPrompt = `You are a study assistant helping college students understand and review their academic notes.
Your job is to produce clear, accurate summaries that help students study efficiently.
Always write for someone who has already read the notes but needs a structured review.
Never make up information — only summarize what is present in the notes.`;

    const userPrompt = `Summarize the following student notes. Return your response as a valid JSON object with exactly these two fields:

{
  "quickSummary": "A 3-5 sentence paragraph that captures the overall topic and most important takeaways. Written as a TL;DR a student could read in 30 seconds.",
  "detailedSummary": "A structured breakdown with four labeled sections:\\n\\n**Key Concepts**\\n[Definitions and explanations of the main terms and ideas]\\n\\n**Main Ideas**\\n[The core topics, arguments, or themes covered in the notes]\\n\\n**Important Details**\\n[Specific facts, formulas, dates, examples, or data points worth remembering]\\n\\n**Things to Keep in Mind**\\n[Caveats, common mistakes, nuances, or anything a student should be careful about]"
}

Only return the JSON object. No extra text, no markdown code blocks.

Notes:
${content}`;

    const response = await groq.chat.completions.create({
        model: MODEL,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ],
        temperature: 0.3, // low temperature for factual, consistent output
        max_tokens: 1500,
    });

    const raw = response.choices[0].message.content.trim();
    const tokenCount = response.usage?.total_tokens ?? null;

    // Parse JSON response from model
    // If the model wraps it in a code block despite instructions, strip it
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
        quickSummary: parsed.quickSummary,
        detailedSummary: parsed.detailedSummary,
        model: MODEL,
        tokenCount,
    };
};

// ----------------------------------------
// generateFlashcards
// Purpose: Extract Q&A flashcard pairs from note or document content
// Returns: { cards: [{ front, back }], model, tokenCount }
//
// Cards are capped at 20 per generation
// front — a question, term, or concept prompt
// back  — the answer, definition, or explanation
// ----------------------------------------
const generateFlashcards = async (content) => {
    const systemPrompt = `You are a study assistant helping college students create flashcards from their academic notes and documents.
Your job is to identify the most important concepts, terms, and ideas and turn them into effective flashcard Q&A pairs.
Write questions that test understanding, not just memorization.
Never make up information — only use what is present in the provided content.`;

    const userPrompt = `Create flashcards from the following content. Return your response as a valid JSON array of objects with exactly these two fields per card:

[
  { "front": "A clear question, term, or concept prompt", "back": "The answer, definition, or explanation" },
  ...
]

Rules:
- Generate between 5 and 20 cards depending on how much content there is
- Prioritize key terms, definitions, formulas, and important concepts
- Write "front" as a question (e.g. "What is X?" or "Define Y") or a term to define
- Write "back" as a concise but complete answer (1-3 sentences max)
- Do not create duplicate or near-duplicate cards
- Only return the JSON array. No extra text, no markdown code blocks.

Content:
${content}`;

    const response = await groq.chat.completions.create({
        model: MODEL,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 2000,
    });

    const raw = response.choices[0].message.content.trim();
    const tokenCount = response.usage?.total_tokens ?? null;

    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    const cards = JSON.parse(cleaned);

    return {
        cards,
        model: MODEL,
        tokenCount,
    };
};

module.exports = { generateSummary, generateFlashcards };
