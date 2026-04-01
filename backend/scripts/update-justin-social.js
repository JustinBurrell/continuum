// =============================================================================
// update-justin-social.js — Set social links on Justin's account
// =============================================================================
//
// Usage:
//   node backend/scripts/update-justin-social.js
// =============================================================================

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const { User } = require('../models');
const { invalidate } = require('../lib/cache');

async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const justin = await User.findOne({ email: 'justinburrell715@gmail.com' });
    if (!justin) {
      console.error('Justin not found — register with justinburrell715@gmail.com first.');
      process.exit(1);
    }

    await User.findByIdAndUpdate(justin._id, {
      linkedinUrl: 'https://www.linkedin.com/in/thejustinburrell/',
      instagramHandle: 'thejustinburrell',
    });

    await invalidate(`user:${justin._id}`);

    console.log(`Updated social links for Justin (${justin._id})`);
    console.log('  LinkedIn:  https://www.linkedin.com/in/thejustinburrell/');
    console.log('  Instagram: thejustinburrell');
    console.log('  Redis cache invalidated');
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

main();
