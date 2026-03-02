const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller');
const authMiddleware = require('../middleware/auth.middleware');

// ============================================================
// USERS ROUTES
// Purpose: Map HTTP endpoints to users controller functions
// Base path: /api/users (mounted in server.js)
// All routes are protected — JWT required
// ============================================================

router.use(authMiddleware);

router.get('/search', usersController.searchUsers);

module.exports = router;
