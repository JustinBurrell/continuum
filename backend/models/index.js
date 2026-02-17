/**
 * Model Export Hub
 * Import all models from here for clean imports throughout the app
 *
 * Usage: const { User, Note, Task } = require('../models');
 *
 * Phase 1 Session 1: User, Note, FlashcardSet, Flashcard, Task
 * Phase 1 Session 2: Friendship, Comment, Resume, Application
 * Stretch: Conversation, Message, SyncQueue, Activity
 */

module.exports = {
  // Phase 1 Session 1 — Auth, Notes (summary embedded), Learning, Tasks
  // User: require('./User'),
  // Note: require('./Note'),
  // FlashcardSet: require('./FlashcardSet'),
  // Flashcard: require('./Flashcard'),
  // Task: require('./Task'),

  // Phase 1 Session 2 — Social, Career (feedback embedded in Resume)
  // Friendship: require('./Friendship'),
  // Comment: require('./Comment'),
  // Resume: require('./Resume'),
  // Application: require('./Application'),

  // Stretch — Messaging & Offline
  // Conversation: require('./Conversation'),
  // Message: require('./Message'),
  // SyncQueue: require('./SyncQueue'),
  // Activity: require('./Activity'),
};
