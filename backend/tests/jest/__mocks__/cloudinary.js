/**
 * __mocks__/cloudinary.js
 *
 * Replaces the real Cloudinary SDK in all Jest test runs.
 * Prevents the SDK from making any network calls on module load,
 * which was causing ETIMEDOUT timeouts and hanging the test suite.
 */

const cloudinary = {
  v2: {
    config: jest.fn(),
    uploader: {
      upload: jest.fn().mockResolvedValue({
        secure_url: 'https://res.cloudinary.com/test/image/upload/test.jpg',
        public_id: 'test/mock-public-id',
        resource_type: 'image',
      }),
      destroy: jest.fn().mockResolvedValue({ result: 'ok' }),
      upload_stream: jest.fn(),
    },
    url: jest.fn().mockReturnValue('https://res.cloudinary.com/test/image/upload/test.jpg'),
    utils: {
      api_sign_request: jest.fn().mockReturnValue('mock-signature'),
    },
  },
};

// Support both `require('cloudinary').v2` and `require('cloudinary/v2')` patterns
cloudinary.v2.v2 = cloudinary.v2;

module.exports = cloudinary;
