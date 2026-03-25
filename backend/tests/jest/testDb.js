/**
 * testDb.js — shared MongoDB in-memory setup for Jest tests.
 *
 * How it works:
 *   - beforeAll: start a temporary MongoDB instance (in RAM, no disk, no port)
 *     and connect mongoose to it.
 *   - afterEach: wipe all collections so each test starts with a clean slate.
 *   - afterAll: close the mongoose connection and stop the in-memory server.
 *
 * Usage in any test file:
 *   const { connectTestDb, closeTestDb, clearTestDb } = require('./testDb');
 *   beforeAll(connectTestDb);
 *   afterEach(clearTestDb);
 *   afterAll(closeTestDb);
 */

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongod;

async function connectTestDb() {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
}

async function clearTestDb() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

async function closeTestDb() {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
}

module.exports = { connectTestDb, clearTestDb, closeTestDb };
