/**
 * Consistent Error response templates for Express routes
 */

const errorResponse = (res, status, error, message) => {
    return res.status(status).json({
        status: 'error',
        error,
        message,
        timestamp: new Date().toISOString()
    });
};

const internalError = (res, err) => {
    console.error('[SERVER ERROR]:', err);
    return errorResponse(res, 500, 'INTERNAL_SERVER_ERROR', err.message || 'An unexpected error occurred');
};

const validationError = (res, message) => {
    return errorResponse(res, 400, 'VALIDATION_ERROR', message);
};

const authError = (res, message = 'Unauthorized') => {
    return errorResponse(res, 401, 'UNAUTHORIZED', message);
};

module.exports = {
    errorResponse,
    internalError,
    validationError,
    authError
};
