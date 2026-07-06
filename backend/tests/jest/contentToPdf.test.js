/**
 * contentToPdf.test.js
 *
 * Smoke tests for the shared html-to-pdf content renderer
 * (services/contentToPdf.service.js):
 *   - plain text and markdown content both render through a real headless
 *     Chromium launch and produce a well-formed PDF buffer.
 *   - the render queue rejects with a 503 once too much work is already
 *     queued, instead of piling up unbounded Chromium processes.
 */

const { generatePdfFromContent, _internal } = require('../../services/contentToPdf.service');

// Real Chromium launches are slow; give this file more headroom than the
// default 30s test timeout.
jest.setTimeout(60000);

describe('generatePdfFromContent', () => {
  it('renders plain text content into a real PDF', async () => {
    const buffer = await generatePdfFromContent(
      'Hello world.\n\nThis is a second paragraph.',
      'plain',
      'Plain Text Note'
    );

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.subarray(0, 5).toString('utf8')).toBe('%PDF-');
    expect(buffer.length).toBeGreaterThan(1000);
  });

  it('renders markdown content with a heading and a code block into a real PDF', async () => {
    const markdown = [
      '# Study Notes',
      '',
      'Here is a snippet:',
      '',
      '```js',
      'const x = 1;',
      '```',
    ].join('\n');

    const buffer = await generatePdfFromContent(markdown, 'markdown', 'Markdown Note');

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.subarray(0, 5).toString('utf8')).toBe('%PDF-');
    expect(buffer.length).toBeGreaterThan(1000);
  });

  describe('queue bound', () => {
    const originalRenderHtmlToPdf = _internal.renderHtmlToPdf;

    afterEach(() => {
      _internal.renderHtmlToPdf = originalRenderHtmlToPdf;
    });

    it('rejects with a 503 once the queue already has 5 tasks pending or waiting', async () => {
      // Stub the Chromium step so every task hangs forever. That lets us
      // fill the queue deterministically without waiting on real renders,
      // and without the earlier queued tasks ever draining mid-test.
      _internal.renderHtmlToPdf = jest.fn(() => new Promise(() => {}));

      const attempts = [];
      for (let i = 0; i < 7; i++) {
        attempts.push(generatePdfFromContent('content', 'plain', `Doc ${i}`));
      }

      // The first 5 calls occupy the queue (1 running + 4 waiting) and hang
      // forever under the stub above; only assert on the 7th, which must be
      // rejected because the queue is already full by the time it is made.
      attempts.forEach((p) => p.catch(() => {}));

      await expect(attempts[6]).rejects.toMatchObject({
        status: 503,
        message: 'Import is busy, try again in a moment.',
      });
    });
  });
});
