const express = require('express');
const router = express.Router();
const tasksController = require('../controllers/tasks.controller');
const authMiddleware = require('../middleware/auth.middleware');

// ============================================================
// TASKS ROUTES
// Purpose: Map HTTP endpoints to tasks controller functions
// Base path: /api/tasks (mounted in server.js)
// All routes are protected — JWT required
// Note: static routes (/:id/status) defined before dynamic /:id
//       to avoid Express treating "status" as a task ID
// ============================================================

router.use(authMiddleware);

router.post('/', tasksController.createTask);
router.get('/', tasksController.getTasks);
router.get('/:id', tasksController.getTaskById);
router.put('/:id', tasksController.updateTask);
router.patch('/:id/status', tasksController.updateStatus);
router.delete('/:id', tasksController.deleteTask);

module.exports = router;
