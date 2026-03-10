import { NextResponse } from 'next/server';

// Allowed MIME types for image uploads
const ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
];

// Allowed MIME types for document uploads
const ALLOWED_DOC_TYPES = [
    ...ALLOWED_IMAGE_TYPES,
    'application/pdf',
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

interface ValidateOptions {
    /** Maximum file size in bytes (default: 5MB) */
    maxSize?: number;
    /** Allowed MIME types (default: images only) */
    allowedTypes?: string[];
    /** Whether the file is required (default: false) */
    required?: boolean;
}

interface ValidationResult {
    valid: boolean;
    error?: string;
    file?: File;
}

/**
 * Validate an uploaded file.
 */
export function validateFile(
    file: File | null,
    options: ValidateOptions = {}
): ValidationResult {
    const {
        maxSize = MAX_FILE_SIZE,
        allowedTypes = ALLOWED_IMAGE_TYPES,
        required = false,
    } = options;

    if (!file || file.size === 0) {
        if (required) {
            return { valid: false, error: 'File wajib diupload' };
        }
        return { valid: true }; // No file, that's OK
    }

    // Check file size
    if (file.size > maxSize) {
        const maxMB = (maxSize / (1024 * 1024)).toFixed(0);
        return { valid: false, error: `Ukuran file maksimal ${maxMB}MB` };
    }

    // Check MIME type
    if (!allowedTypes.includes(file.type)) {
        const readable = allowedTypes
            .map(t => t.split('/')[1].toUpperCase())
            .join(', ');
        return { valid: false, error: `Format file tidak didukung. Diizinkan: ${readable}` };
    }

    return { valid: true, file };
}

/**
 * Validate file and return error response if invalid.
 * Returns null if valid, or a NextResponse error.
 */
export function validateFileOrError(
    file: File | null,
    options: ValidateOptions = {}
): NextResponse | null {
    const result = validateFile(file, options);
    if (!result.valid) {
        return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return null;
}

// Re-export constants
export { ALLOWED_IMAGE_TYPES, ALLOWED_DOC_TYPES, MAX_FILE_SIZE };
