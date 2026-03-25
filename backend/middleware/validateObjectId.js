const mongoose = require('mongoose');

// ============================================================
// VALIDATE OBJECT ID MIDDLEWARE
// Purpose: Validate route params are valid MongoDB ObjectIds before
//          hitting the database. Prevents Mongoose CastErrors from
//          leaking as 500s and stops unnecessary DB queries.
// Usage:   router.param('id', validateObjectId)
//          router.param('setId', validateObjectId)
// ============================================================

module.exports = function validateObjectId(req, res, next, value) {
    if (!mongoose.Types.ObjectId.isValid(value)) {
        return res.status(400).json({ success: false, error: 'Invalid ID format' });
    }
    next();
};
