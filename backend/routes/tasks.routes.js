const express = require('express');
const router = express.Router();
const tasksController = require('../controllers/tasks.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { perUserWriteLimit } = require('../middleware/rateLimiter');
const validateObjectId = require('../middleware/validateObjectId');

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
router.param('id', validateObjectId);

/**
 * @swagger
 * /api/tasks/shared:
 *   get:
 *     summary: Get tasks shared with the authenticated user by others
 *     tags: [Tasks]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Returns array of shared tasks
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/shared', tasksController.getSharedTasks);

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, dueDate]
 *             properties:
 *               title:       { type: string, example: Study for exam }
 *               dueDate:     { type: string, format: date-time }
 *               description: { type: string }
 *               priority:    { type: string, enum: [low, medium, high] }
 *               isShared:    { type: boolean, default: false }
 *     responses:
 *       201:
 *         description: Task created
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/', tasksController.createTask);

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Get all tasks owned by the authenticated user
 *     tags: [Tasks]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [todo, in_progress, completed] }
 *     responses:
 *       200:
 *         description: Returns array of tasks
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', tasksController.getTasks);

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: Get a single task by ID
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Returns the task
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', tasksController.getTaskById);

/**
 * @swagger
 * /api/tasks/{id}:
 *   put:
 *     summary: Update a task (owner only)
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:       { type: string }
 *               description: { type: string }
 *               dueDate:     { type: string, format: date-time }
 *               priority:    { type: string, enum: [low, medium, high] }
 *     responses:
 *       200:
 *         description: Task updated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:id', tasksController.updateTask);

/**
 * @swagger
 * /api/tasks/{id}/status:
 *   patch:
 *     summary: Update a task's status (owner or participant)
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [todo, in_progress, completed] }
 *     responses:
 *       200:
 *         description: Status updated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch('/:id/status', tasksController.updateStatus);

/**
 * @swagger
 * /api/tasks/{id}/participants:
 *   patch:
 *     summary: Add or remove a participant from a shared task (owner only)
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [participantId, action]
 *             properties:
 *               participantId: { type: string }
 *               action: { type: string, enum: [add, remove] }
 *     responses:
 *       200:
 *         description: Participants updated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch('/:id/participants', perUserWriteLimit, tasksController.updateParticipants);

/**
 * @swagger
 * /api/tasks/{id}/participant-status:
 *   patch:
 *     summary: Update the authenticated participant's own status on a shared task
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [todo, in_progress, completed] }
 *     responses:
 *       200:
 *         description: Participant status updated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Not a participant on this task
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch('/:id/participant-status', tasksController.updateParticipantStatus);

/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     summary: Delete a task (owner only)
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Task deleted
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id', tasksController.deleteTask);

module.exports = router;
