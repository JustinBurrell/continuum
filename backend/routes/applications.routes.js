const express = require('express');
const router = express.Router();
const applicationsController = require('../controllers/applications.controller');
const authMiddleware = require('../middleware/auth.middleware');

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

// Static route — must come before /:id
router.get('/dashboard', applicationsController.getDashboard);

// CRUD routes
router.post('/', applicationsController.createApplication);
router.get('/', applicationsController.getApplications);
router.put('/:id', applicationsController.updateApplication);

// Sub-resource routes
router.post('/:id/contacts', applicationsController.addContact);
router.post('/:id/reminders', applicationsController.addReminder);

module.exports = router;
