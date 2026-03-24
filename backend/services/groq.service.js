const groq = require('../config/groq');
const { checkAiLimit } = require('../lib/cache');

// ============================================================
// GROQ SERVICE
// Purpose: Centralized module for all Groq AI calls
// Model: llama-3.1-8b-instant (14.4K RPD / 500K TPD on free tier)
// Used by: notes.controller (summary), notes.controller (flashcards — API-8), resumes.controller
// Note: llama-3.3-70b-versatile has better reasoning but only 1K RPD on free tier —
//       not viable for a multi-user product. Prompt engineering used instead for quality.
// ============================================================

const MODEL = 'llama-3.1-8b-instant';
const MAX_INPUT_CHARS = 50000;

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
const generateSummary = async (content, userId) => {
    if (await checkAiLimit(userId)) {
        const err = new Error('Daily AI generation limit reached. Try again tomorrow.');
        err.status = 429;
        throw err;
    }
    content = content.slice(0, MAX_INPUT_CHARS);
    console.info(JSON.stringify({ event: 'ai_call', fn: 'generateSummary', userId, contentLength: content.length, ts: new Date().toISOString() }));
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
        max_tokens: 2500,
        response_format: { type: 'json_object' }, // forces valid JSON output, no manual sanitization needed
    });

    const raw = response.choices[0].message.content.trim();
    const tokenCount = response.usage?.total_tokens ?? null;

    const parsed = JSON.parse(raw);

    // Model sometimes returns detailedSummary as an object instead of a string.
    // Convert it to a formatted markdown string so it can be stored as String in Mongoose.
    let detailedSummary = parsed.detailedSummary;
    if (typeof detailedSummary === 'object' && detailedSummary !== null) {
        detailedSummary = Object.entries(detailedSummary)
            .map(([section, items]) => {
                const bullets = Array.isArray(items)
                    ? items.map((item) => `- ${item}`).join('\n')
                    : items;
                return `${section}\n${bullets}`;
            })
            .join('\n\n');
    }

    return {
        quickSummary: parsed.quickSummary,
        detailedSummary,
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
const generateFlashcards = async (content, userId) => {
    if (await checkAiLimit(userId)) {
        const err = new Error('Daily AI generation limit reached. Try again tomorrow.');
        err.status = 429;
        throw err;
    }
    content = content.slice(0, MAX_INPUT_CHARS);
    console.info(JSON.stringify({ event: 'ai_call', fn: 'generateFlashcards', userId, contentLength: content.length, ts: new Date().toISOString() }));
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

// ----------------------------------------
// generateResumeFeedback
// Purpose: Analyze a resume and return structured AI feedback
// Returns: { overallScore, strengths, improvements, sections, keywordOptimization, model, tokenCount }
//
// overallScore        — 0-100 numeric rating
// strengths           — array of things the resume does well
// improvements        — array of actionable suggestions
// sections            — per-section scores and feedback (Experience, Skills, Education, etc.)
// keywordOptimization — { presentKeywords, missingKeywords }
// ----------------------------------------
const generateResumeFeedback = async (resumeText, userId) => {
    if (await checkAiLimit(userId)) {
        const err = new Error('Daily AI generation limit reached. Try again tomorrow.');
        err.status = 429;
        throw err;
    }
    resumeText = resumeText.slice(0, MAX_INPUT_CHARS);
    console.info(JSON.stringify({ event: 'ai_call', fn: 'generateResumeFeedback', userId, contentLength: resumeText.length, ts: new Date().toISOString() }));
    const systemPrompt = `You are a senior technical recruiter and career coach who has reviewed thousands of resumes for top tech companies.
You give brutally honest, deeply specific feedback that directly quotes and references what is written in the resume.
You never give generic advice. Every sentence you write is grounded in the actual content of the resume being reviewed.
Your feedback is the difference between a candidate getting an interview or being passed over.`;

    const userPrompt = `Review the following resume thoroughly and return a valid JSON object with exactly this structure:

{
  "overallScore": <integer 0-100>,
  "strengths": [
    "<Strength item — follow this pattern: Start with what specifically stands out and why it matters to a recruiter. Quote or directly reference the specific bullet, project, metric, or section. Then explain the impact this has on a hiring decision. Each item must be 3-5 sentences.>",
    ...
  ],
  "improvements": [
    "<Improvement item — follow this pattern: Start with 'Problem:' and describe exactly what is weak, missing, or unclear, quoting the specific line or section. Then write 'Fix:' and give a concrete, ready-to-use rewrite or specific instruction. Each item must be 3-5 sentences total.>",
    ...
  ],
  "sections": [
    {
      "name": "<section name>",
      "strength": "<2-3 sentences: what this section does well, quoting specific content from it>",
      "improvement": "<2-3 sentences: the single most important thing to fix in this section — state the problem and give the exact fix>",
      "score": <integer 0-100>
    },
    ...
  ],
  "keywordOptimization": {
    "presentKeywords": ["<keyword>", ...],
    "missingKeywords": ["<keyword>", ...]
  }
}

Strict rules:
- overallScore: holistic score based on clarity, impact, quantification, ATS-friendliness, and recruiter appeal
- strengths: exactly 5 items — each 3-5 sentences — must quote or directly reference specific resume content — no vague praise
- improvements: exactly 5 items — each must have a clear "Problem:" sentence and a "Fix:" sentence — must reference specific lines
- sections: one entry per section present in the resume — strength and improvement each 2-3 sentences
- missingKeywords: keywords a recruiter for this candidate's field would expect to see but are absent
- Every single item must be specific enough that the candidate knows exactly what to change and how
- Only return the JSON object. No extra text, no markdown code blocks.

Resume:
${resumeText}`;

    const response = await groq.chat.completions.create({
        model: MODEL,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 3500,
        response_format: { type: 'json_object' },
    });

    const raw = response.choices[0].message.content.trim();
    const tokenCount = response.usage?.total_tokens ?? null;
    const parsed = JSON.parse(raw);

    return {
        overallScore: parsed.overallScore,
        strengths: parsed.strengths,
        improvements: parsed.improvements,
        sections: parsed.sections,
        keywordOptimization: parsed.keywordOptimization,
        model: MODEL,
        tokenCount,
    };
};

module.exports = { generateSummary, generateFlashcards, generateResumeFeedback };
