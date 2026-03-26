/**
 * __mocks__/resend.js
 *
 * Replaces the real Resend SDK in all Jest test runs.
 * Prevents the SDK from making any network calls, which would fail
 * in the test environment where RESEND_API_KEY is a dummy value.
 */

const mockSend = jest.fn().mockResolvedValue({ id: 'mock-email-id' });

const Resend = jest.fn().mockImplementation(() => ({
  emails: {
    send: mockSend,
  },
}));

module.exports = { Resend };
