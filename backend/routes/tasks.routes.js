const express = require('express');
const router = express.Router();
const tasksController = require('../controllers/tasks.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { perUserWriteLimit } = require('../middleware/rateLimiter');

// ============================================================
// TASKS ROUTES
// Purpose: Map HTTP endpoints to tasks controller functions
// Base path: /api/tasks (mounted in server.js)
// All routes are protected — JWT required
// Note: static routes (/shared, /:id/status, /:id/participant-status)
//       defined before dynamic /:id to avoid Express matching
//       "shared" as a task ID
// ============================================================

router.use(authMiddleware);

// Static route — must come before /:id
router.get('/shared', tasksController.getSharedTasks);

router.post('/', tasksController.createTask);
router.get('/', tasksController.getTasks);
router.get('/:id', tasksController.getTaskById);
router.put('/:id', tasksController.updateTask);
router.patch('/:id/status', tasksController.updateStatus);
router.patch('/:id/participants', perUserWriteLimit, tasksController.updateParticipants);
router.patch('/:id/participant-status', tasksController.updateParticipantStatus);
router.delete('/:id', tasksController.deleteTask);

module.exports = router;
