const mongoose = require('mongoose');

// ============================================================
// WaitlistEntry model
// Purpose: Store email signups from the mobile gate screen
//          for notifying users when native iOS/Android apps launch
// Source field allows future reuse (newsletter, product updates, etc.)
// ============================================================

const waitlistEntrySchema = new mongoose.Schema({
    email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
    firstName: { type: String, trim: true, default: null },
    source:    { type: String, default: 'mobile_gate' },
}, { timestamps: true });

module.exports = mongoose.model('WaitlistEntry', waitlistEntrySchema);
