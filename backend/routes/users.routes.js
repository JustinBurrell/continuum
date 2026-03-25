const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller');
const authMiddleware = require('../middleware/auth.middleware');
const validateObjectId = require('../middleware/validateObjectId');

// ============================================================
// USERS ROUTES
// Purpose: Map HTTP endpoints to users controller functions
// Base path: /api/users (mounted in server.js)
// All routes are protected — JWT required
// ============================================================

router.use(authMiddleware);
router.param('id', validateObjectId);

router.get('/search', usersController.searchUsers);
router.get('/:id', usersController.getUserProfile);

module.exports = router;
