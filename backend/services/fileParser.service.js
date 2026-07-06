const { PDFParse } = require('pdf-parse');
const { parseOfficeAsync } = require('officeparser');

// ============================================================
// FILE PARSER SERVICE
// Purpose: Centralized text extraction for uploaded files (PDF + Office formats)
// Used by: resumes.controller (uploadResume), future note/document uploads
// Errors thrown here are user-facing — err.status is set so the global error
// handler in app.js returns the message as-is instead of "Internal server error"
// ============================================================

const MACRO_ENABLED_MIME_TYPES = new Set([
    'application/vnd.ms-word.document.macroEnabled.12',
    'application/vnd.ms-powerpoint.presentation.macroEnabled.12',
    'application/vnd.ms-excel.sheet.macroEnabled.12',
]);

const MACRO_ENABLED_EXTENSIONS = /\.(docm|pptm|xlsm)$/i;

const OFFICE_MIME_TYPES = new Set([
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.oasis.opendocument.text', // .odt
    'application/vnd.oasis.opendocument.presentation', // .odp
    'application/vnd.oasis.opendocument.spreadsheet', // .ods
]);

// ----------------------------------------
// Helper: userFacingError
// Purpose: Build an error safe to surface directly to the client
// ----------------------------------------
const userFacingError = (message) => {
    const err = new Error(message);
    err.isUserFacing = true;
    err.status = 400;
    return err;
};

// ----------------------------------------
// Helper: isMacroEnabled
// Purpose: Detect macro-enabled Office files by MIME type or file name/extension
// Macro-enabled files are rejected up front, before any format-specific parsing
// ----------------------------------------
const isMacroEnabled = (mimeType, fileName) => {
    if (mimeType && MACRO_ENABLED_MIME_TYPES.has(mimeType)) return true;
    if (fileName && MACRO_ENABLED_EXTENSIONS.test(fileName)) return true;
    return false;
};

// ----------------------------------------
// Helper: parsePdf
// Purpose: Extract text from a PDF buffer using the pdf-parse v2 API
// Mirrors the pattern used in resumes.controller.js uploadResume
// ----------------------------------------
const parsePdf = async (buffer) => {
    let parser;
    try {
        parser = new PDFParse({ data: buffer });
        const pdfData = await parser.getText();
        const text = pdfData.text;

        if (!text || text.trim().length === 0) {
            throw userFacingError('This PDF appears to be a scanned image. Please upload a PDF with selectable text.');
        }

        return text;
    } catch (err) {
        if (err.isUserFacing) throw err;
        if (err.name === 'PasswordException') {
            throw userFacingError('This PDF is password-protected. Please upload an unlocked version.');
        }
        throw err;
    } finally {
        if (parser) await parser.destroy();
    }
};

// ----------------------------------------
// Helper: parseOfficeFileFormat
// Purpose: Extract text from Office/OpenDocument formats via officeparser
// ----------------------------------------
const parseOfficeFileFormat = async (buffer, options) => {
    const text = await parseOfficeAsync(buffer, options);

    if (!text || text.trim().length === 0) {
        throw userFacingError('No text content could be extracted from this file.');
    }

    return text;
};

// ----------------------------------------
// parseOfficeFile
// Purpose: Unified entry point for extracting plain text from an uploaded file buffer
// Supports: PDF, DOCX, PPTX, XLSX, ODT, ODP, ODS
// Rejects: macro-enabled Office files (.docm/.pptm/.xlsm) and unsupported types
// ----------------------------------------
const parseOfficeFile = async (buffer, mimeType, options = {}) => {
    if (isMacroEnabled(mimeType, options.fileName)) {
        throw userFacingError('Macro-enabled Office files are not supported. Please upload a standard .docx, .pptx, or .xlsx file.');
    }

    if (mimeType === 'application/pdf') {
        return parsePdf(buffer);
    }

    if (OFFICE_MIME_TYPES.has(mimeType)) {
        return parseOfficeFileFormat(buffer, options);
    }

    throw userFacingError('File type not supported. Please upload DOCX, PPTX, XLSX, or PDF.');
};

module.exports = { parseOfficeFile };
