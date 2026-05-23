/**
 * __mocks__/firebase-admin.js
 *
 * Replaces firebase-admin in all Jest test runs.
 * Prevents any real FCM calls and lets tests inspect payloads.
 */

const mockSendEachForMulticast = jest.fn().mockResolvedValue({
    responses: [{ success: true }],
    successCount: 1,
    failureCount: 0,
});

const mockMessaging = jest.fn(() => ({
    sendEachForMulticast: mockSendEachForMulticast,
}));

const mockApps = [];

const admin = {
    apps: mockApps,
    initializeApp: jest.fn(() => mockApps.push({})),
    credential: {
        cert: jest.fn((sa) => ({ type: 'service_account', ...sa })),
    },
    messaging: mockMessaging,
    _reset() {
        mockApps.length = 0;
        mockSendEachForMulticast.mockResolvedValue({
            responses: [{ success: true }],
            successCount: 1,
            failureCount: 0,
        });
        mockSendEachForMulticast.mockClear();
        mockMessaging.mockClear();
    },
    _mockSendEachForMulticast: mockSendEachForMulticast,
};

module.exports = admin;
