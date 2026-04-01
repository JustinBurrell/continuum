const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Continuum API',
            version: '1.0.0',
            description:
                'REST API for the Continuum student productivity platform. ' +
                'All protected routes require a JWT in the `Authorization: Bearer <token>` header.',
        },
        servers: [
            { url: 'http://localhost:5001', description: 'Local development' },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        error: { type: 'string', example: 'Error message' },
                    },
                },
                StudySession: {
                    type: 'object',
                    properties: {
                        _id:             { type: 'string', example: '64a1f2b3c4d5e6f7a8b9c0d1' },
                        userId:          { type: 'string', description: 'ID of the user who studied' },
                        setId:           { type: 'string', description: 'ID of the flashcard set' },
                        completedAt:     { type: 'string', format: 'date-time' },
                        durationSeconds: { type: 'integer', minimum: 0, example: 120 },
                        totalCards:      { type: 'integer', minimum: 1, example: 10 },
                        correctCount:    { type: 'integer', minimum: 0, example: 7 },
                        score:           { type: 'integer', minimum: 0, maximum: 100, example: 70, description: 'Math.round(correctCount/totalCards * 100)' },
                        cardResults: {
                            type: 'array',
                            description: 'Per-card results — only included in single-session detail responses',
                            items: {
                                type: 'object',
                                properties: {
                                    cardId:  { type: 'string' },
                                    correct: { type: 'boolean' },
                                },
                            },
                        },
                    },
                },
            },
            responses: {
                Unauthorized: {
                    description: 'Missing or invalid JWT',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Error' },
                            example: { success: false, error: 'Unauthorized' },
                        },
                    },
                },
                Forbidden: {
                    description: 'Forbidden — you do not own this resource',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Error' },
                            example: { success: false, error: 'Access denied' },
                        },
                    },
                },
                NotFound: {
                    description: 'Resource not found',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Error' },
                            example: { success: false, error: 'Not found' },
                        },
                    },
                },
                BadRequest: {
                    description: 'Bad request — missing or invalid fields',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Error' },
                            example: { success: false, error: 'Field is required' },
                        },
                    },
                },
            },
        },
        security: [{ bearerAuth: [] }],
        tags: [
            { name: 'Auth', description: 'Authentication and account management' },
            { name: 'Notes', description: 'Note creation, editing, sharing, and AI features' },
            { name: 'Tasks', description: 'Task management and collaboration' },
            { name: 'Flashcards', description: 'Flashcard sets, cards, and AI generation' },
            { name: 'StudySessions', description: 'Study session tracking, history, and streaks' },
            { name: 'Friends', description: 'Friend requests and social connections' },
            { name: 'Messages', description: 'Direct messages and conversations' },
            { name: 'Applications', description: 'Job application tracker' },
            { name: 'Resumes', description: 'Resume upload and AI feedback' },
            { name: 'Calendar', description: 'Calendar view of tasks by date' },
            { name: 'Activity', description: 'Social activity feed' },
            { name: 'Users', description: 'User profiles and search' },
            { name: 'Comments', description: 'Comments and likes on notes' },
            { name: 'Google', description: 'Google Drive integration' },
            { name: 'Sync', description: 'Offline sync processing' },
        ],
    },
    apis: ['./routes/*.js'],
};

module.exports = swaggerJsdoc(options);
