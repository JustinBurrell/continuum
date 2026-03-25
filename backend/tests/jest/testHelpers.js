/**
 * testHelpers.js — utilities for creating test users and getting auth tokens.
 *
 * registerAndLogin creates a fresh user and returns { token, userId }
 * so test files can make authenticated requests without repeating setup code.
 */

const request = require('supertest');
const app = require('../../app');

let _counter = 0;

/**
 * Creates a unique user and logs them in.
 * Returns { token, userId, email, username }.
 */
async function registerAndLogin(overrides = {}) {
  _counter++;
  const email = overrides.email || `testuser${_counter}@continuum.test`;
  const username = overrides.username || `testuser${_counter}`;
  const password = overrides.password || 'Test@1234';
  const firstName = overrides.firstName || 'Test';
  const lastName = overrides.lastName || 'User';

  const registerRes = await request(app).post('/api/auth/register').send({
    email,
    username,
    password,
    firstName,
    lastName,
  });

  if (!registerRes.body.token) {
    throw new Error(
      `registerAndLogin failed: ${JSON.stringify(registerRes.body)}`
    );
  }

  return {
    token: registerRes.body.token,
    userId: registerRes.body.user?._id || registerRes.body.user?.id,
    email,
    username,
    password,
  };
}

/**
 * Creates two users and establishes an accepted friendship between them.
 * Returns { alice, bob } each with { token, userId }.
 */
async function makeFriends() {
  const alice = await registerAndLogin();
  const bob = await registerAndLogin();

  const req = await request(app)
    .post('/api/friends/request')
    .set('Authorization', `Bearer ${alice.token}`)
    .send({ recipientId: bob.userId });

  const friendshipId = req.body.friendship._id;

  await request(app)
    .put(`/api/friends/request/${friendshipId}`)
    .set('Authorization', `Bearer ${bob.token}`)
    .send({ action: 'accept' });

  return { alice, bob };
}

module.exports = { registerAndLogin, makeFriends };
