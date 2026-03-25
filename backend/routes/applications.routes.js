const express = require('express');
const router = express.Router();
const applicationsController = require('../controllers/applications.controller');
const authMiddleware = require('../middleware/auth.middleware');
const validateObjectId = require('../middleware/validateObjectId');

// ============================================================
// APPLICATIONS ROUTES
// Purpose: Map HTTP endpoints to applications controller functions
// Base path: /api/applications (mounted in server.js)
// All routes are protected — JWT required
// Note: static routes (/dashboard, /:id/contacts, /:id/reminders)
//       defined before dynamic /:id to prevent Express matching
//       "dashboard" as an application ID
// ============================================================

router.use(authMiddleware);
router.param('id', validateObjectId);

/**
 * @swagger
 * /api/applications/dashboard:
 *   get:
 *     summary: Get application counts grouped by status (for dashboard stats)
 *     tags: [Applications]
 *     responses:
 *       200:
 *         description: Returns status breakdown counts
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/dashboard', applicationsController.getDashboard);

/**
 * @swagger
 * /api/applications:
 *   post:
 *     summary: Create a new job application
 *     tags: [Applications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [company, position]
 *             properties:
 *               company:  { type: string, example: Google }
 *               position: { type: string, example: Software Engineer Intern }
 *               status:   { type: string, enum: [applied, phone_screen, interview, offer, rejected, withdrawn], default: applied }
 *               url:      { type: string, format: uri }
 *               notes:    { type: string }
 *     responses:
 *       201:
 *         description: Application created
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/', applicationsController.createApplication);

/**
 * @swagger
 * /api/applications:
 *   get:
 *     summary: Get all job applications for the authenticated user
 *     tags: [Applications]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [applied, phone_screen, interview, offer, rejected, withdrawn] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Filter by company or position
 *     responses:
 *       200:
 *         description: Returns array of applications
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', applicationsController.getApplications);

/**
 * @swagger
 * /api/applications/{id}:
 *   put:
 *     summary: Update an application (status, notes, url, etc.)
 *     tags: [Applications]
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
 *               status:   { type: string, enum: [applied, phone_screen, interview, offer, rejected, withdrawn] }
 *               notes:    { type: string }
 *               url:      { type: string, format: uri }
 *               position: { type: string }
 *               company:  { type: string }
 *     responses:
 *       200:
 *         description: Application updated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:id', applicationsController.updateApplication);

/**
 * @swagger
 * /api/applications/{id}/contacts:
 *   post:
 *     summary: Add a contact (recruiter, hiring manager) to an application
 *     tags: [Applications]
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
 *             required: [name]
 *             properties:
 *               name:  { type: string, example: Jane Smith }
 *               role:  { type: string, example: Recruiter }
 *               email: { type: string, format: email }
 *               phone: { type: string }
 *     responses:
 *       200:
 *         description: Contact added
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/:id/contacts', applicationsController.addContact);

/**
 * @swagger
 * /api/applications/{id}/reminders:
 *   post:
 *     summary: Add a follow-up reminder to an application
 *     tags: [Applications]
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
 *             required: [date, note]
 *             properties:
 *               date: { type: string, format: date-time }
 *               note: { type: string, example: Follow up if no response by Friday }
 *     responses:
 *       200:
 *         description: Reminder added
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/:id/reminders', applicationsController.addReminder);

module.exports = router;
