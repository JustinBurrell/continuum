const puppeteer = require('puppeteer');
const { marked } = require('marked');
const sanitizeHtml = require('sanitize-html');
const PQueue = require('p-queue').default;

// ============================================================
// CONTENT TO PDF SERVICE
// Purpose: Shared renderer that turns note-style content (plain text,
//          markdown, or HTML) into a PDF buffer using headless Chromium.
// Used by: integrations.routes health check today; future export/import
//          features will call the same generatePdfFromContent entry point.
//
// Concurrency: PDF rendering spins up a full Chromium process, which is
// expensive. A single module-level queue caps concurrency at 1 render at
// a time and rejects new work once too many requests are already
// queued, instead of letting the process fall over under load.
// ============================================================

const MAX_QUEUE_SIZE = 5;

const pdfQueue = new PQueue({ concurrency: 1 });

const BASE_STYLES = `
    :root { color-scheme: light; }
    @page {
        size: A4;
        margin: 2cm;
    }
    body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        font-size: 16px;
        line-height: 1.5;
        color: #1a1a1a;
    }
    h1 {
        font-size: 1.75em;
        margin-bottom: 0.5em;
    }
    p {
        margin: 0 0 1em 0;
    }
    code {
        font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
        background-color: #f2f2f2;
        padding: 0.15em 0.35em;
        border-radius: 3px;
        font-size: 0.9em;
    }
    pre {
        font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
        background-color: #f2f2f2;
        padding: 1em;
        border-radius: 4px;
        overflow-x: auto;
    }
    pre code {
        background-color: transparent;
        padding: 0;
    }
    table {
        border-collapse: collapse;
        width: 100%;
        margin: 1em 0;
    }
    th, td {
        border: 1px solid #ccc;
        padding: 0.5em 0.75em;
        text-align: left;
    }
`;

/**
 * Escapes HTML special characters in a plain-text string.
 */
function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Converts plain text into HTML paragraphs.
 * Blocks are split on double newlines; single newlines become <br> within
 * a paragraph so casual line breaks are preserved.
 */
function plainTextToHtml(text) {
    const blocks = String(text).split(/\n{2,}/);
    return blocks
        .map((block) => {
            const escaped = escapeHtml(block).replace(/\n/g, '<br>');
            return `<p>${escaped}</p>`;
        })
        .join('\n');
}

/**
 * Renders content to a body of HTML based on contentType.
 * Markdown and HTML content is sanitized before being embedded in the
 * document; content passed here may originate from user-authored notes.
 */
function renderBodyHtml(content, contentType) {
    if (contentType === 'markdown') {
        return sanitizeHtml(marked.parse(content || ''));
    }
    if (contentType === 'html') {
        return sanitizeHtml(content || '');
    }
    // Default / 'plain'
    return plainTextToHtml(content || '');
}

/**
 * Wraps rendered body HTML in a minimal standalone document with a title
 * and a print-friendly base stylesheet.
 */
function buildDocument(bodyHtml, title) {
    const safeTitle = escapeHtml(title || 'Untitled');
    return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>${safeTitle}</title>
<style>${BASE_STYLES}</style>
</head>
<body>
<h1>${safeTitle}</h1>
${bodyHtml}
</body>
</html>`;
}

/**
 * Launches Chromium, renders the given HTML, and returns a PDF Buffer.
 * Exposed separately so tests can stub it without touching the queueing
 * or bound-checking logic above it.
 */
async function renderHtmlToPdf(html) {
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    try {
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'load' });
        // page.pdf() resolves with a Uint8Array; wrap it in a Buffer since
        // that is what callers of generatePdfFromContent expect.
        const pdfData = await page.pdf({ format: 'A4', printBackground: true });
        return Buffer.from(pdfData);
    } finally {
        await browser.close();
    }
}

// Held on a mutable object (rather than called directly) so tests can stub
// out the actual Chromium launch step via `internal.renderHtmlToPdf = fn`
// while still exercising the real queueing and bound-checking logic below.
const internal = { renderHtmlToPdf };

/**
 * generatePdfFromContent
 * Renders note-style content to a PDF buffer.
 *
 * @param {String} content     raw content (plain text, markdown, or HTML)
 * @param {String} contentType 'plain' | 'markdown' | 'html'
 * @param {String} title       document title, shown as an <h1>
 * @returns {Promise<Buffer>}  the rendered PDF
 *
 * Throws an error with err.status = 503 if the render queue is already
 * full (queue size >= MAX_QUEUE_SIZE), so callers can surface a
 * "try again in a moment" response instead of piling up Chromium
 * processes.
 */
async function generatePdfFromContent(content, contentType, title) {
    if (pdfQueue.size + pdfQueue.pending >= MAX_QUEUE_SIZE) {
        const err = new Error('Import is busy, try again in a moment.');
        err.status = 503;
        throw err;
    }

    const bodyHtml = renderBodyHtml(content, contentType);
    const html = buildDocument(bodyHtml, title);

    return pdfQueue.add(() => internal.renderHtmlToPdf(html));
}

module.exports = {
    generatePdfFromContent,
    // Exposed for tests only.
    _internal: internal,
};
