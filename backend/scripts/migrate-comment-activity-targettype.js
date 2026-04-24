/**
 * Migration: fix comment_added activity records that have targetType: 'comment'
 * and targetId pointing to the comment's own _id.
 *
 * Correct shape: targetId = resource _id (note/flashcardSet/task), targetType = resource type.
 * Broken shape:  targetId = comment._id, targetType = 'comment' (seed bug).
 *
 * For each broken record, look up the comment and copy comment.targetId / comment.targetType.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Activity = require('../models/Activity');
const Comment  = require('../models/Comment');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected');

  const broken = await Activity.find({ type: 'comment_added', targetType: 'comment' });
  console.log(`Found ${broken.length} broken comment_added activities`);

  let fixed = 0;
  let skipped = 0;

  for (const act of broken) {
    const comment = await Comment.findById(act.targetId).select('targetId targetType');
    if (!comment) { skipped++; continue; }

    await Activity.updateOne(
      { _id: act._id },
      { $set: { targetId: comment.targetId, targetType: comment.targetType } }
    );
    fixed++;
  }

  console.log(`Fixed: ${fixed}, Skipped (comment deleted): ${skipped}`);
  await mongoose.disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });
