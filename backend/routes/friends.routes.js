const express = require('express');
const router = express.Router();
const friendsController = require('../controllers/friends.controller');
const authMiddleware = require('../middleware/auth.middleware');
const validateObjectId = require('../middleware/validateObjectId');

// ============================================================
// FRIENDS ROUTES
// Purpose: Map HTTP endpoints to friends controller functions
// Base path: /api/friends (mounted in server.js)
// All routes are protected — JWT required
// Note: static route (/request) defined before dynamic /:id
//       to avoid Express treating "request" as a friendship ID
// ============================================================

router.use(authMiddleware);
router.param('id', validateObjectId);

router.post('/request', friendsController.sendRequest);
router.put('/request/:id', friendsController.respondToRequest);
router.delete('/request/:id', friendsController.cancelRequest);
router.get('/', friendsController.getFriends);
router.delete('/:id', friendsController.removeFriend);

module.exports = router;
