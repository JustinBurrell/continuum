/**
 * integrations.js
 *
 * Static configuration for all third-party integrations that send email on connect/disconnect.
 * Controllers import INTEGRATIONS and spread the relevant entry — no controller needs to know
 * the capability text. Adding a new integration means adding a key here only.
 */

const INTEGRATIONS = {
    'google-drive': {
        serviceName: 'Google Drive',
        capabilities: [
            'Import documents directly from your Drive into Continuum notes',
            'View and sync notes in Google Docs',
            'Import PDFs with automatic text extraction',
        ],
        whatHappensNext: [
            'Your imported notes are preserved and remain fully editable',
            'You can reconnect Google Drive anytime from Settings → Integrations',
            'Notes imported before disconnecting are not affected',
        ],
        manageUrl: '/settings/integrations',
        helpUrl: null,
    },
};

module.exports = { INTEGRATIONS };
