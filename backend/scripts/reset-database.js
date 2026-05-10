// =============================================================================
// reset-database.js — Drop all user-generated collections for a clean launch
// =============================================================================
//
// Usage:
//   node backend/scripts/reset-database.js
//
// Reads MONGODB_URI from backend/.env (same as the seed scripts).
// To target prod: set MONGODB_URI in backend/.env to your Atlas prod URI.
// To target test: set MONGODB_URI to your test URI.
//
// After running, re-seed with:
//   node backend/scripts/seed-jane.js
//   node backend/scripts/seed-justin.js
// =============================================================================

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const readline = require('readline');

const COLLECTIONS = [
  'users',
  'notes',
  'flashcardsets',
  'flashcards',
  'tasks',
  'applications',
  'friendships',
  'conversations',
  'messages',
  'comments',
  'activities',
  'studysessions',
  'resumes',
  'sessions',
  'refreshtokens',
  'oauthcodes',
  'syncqueues',
  // 'waitlists' intentionally excluded — these are kept across resets so users can be notified at launch
];

async function confirm(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Error: MONGODB_URI not set in backend/.env');
    process.exit(1);
  }

  // Show the target database so you know exactly what will be wiped
  const dbName = uri.split('/').pop().split('?')[0];
  console.log('\n⚠️  Target database:', dbName);
  console.log('⚠️  URI:', uri.replace(/:([^:@]+)@/, ':****@'));
  console.log('\nCollections to drop:');
  COLLECTIONS.forEach((c) => console.log('  -', c));

  const answer = await confirm('\nType RESET to confirm dropping all collections: ');
  if (answer !== 'RESET') {
    console.log('Aborted.');
    process.exit(0);
  }

  await mongoose.connect(uri);
  console.log('\nConnected to MongoDB. Dropping collections...\n');

  const db = mongoose.connection.db;

  for (const name of COLLECTIONS) {
    const collection = db.collection(name);
    const count = await collection.countDocuments();
    if (count === 0) {
      console.log(`  ${name}: empty, skipping`);
      continue;
    }
    await collection.drop().catch(() => {});
    console.log(`  ${name}: dropped (${count} documents removed)`);
  }

  console.log('\nDone. Database is clean.');
  console.log('\nNext steps:');
  console.log('  node backend/scripts/seed-jane.js');
  console.log('  node backend/scripts/seed-justin.js');

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
