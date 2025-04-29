// Imports
const logger = require('../logging/logger.js');

/**
 * Error types for categorizing different errors in the application
 */
const ErrorType = {
    // User input errors
    INVALID_INPUT: 'INVALID_INPUT',
    PERMISSION_DENIED: 'PERMISSION_DENIED',

    // Resource errors
    RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
    RESOURCE_UNAVAILABLE: 'RESOURCE_UNAVAILABLE',

    // Discord API errors
    DISCORD_API_ERROR: 'DISCORD_API_ERROR',
    INTERACTION_ERROR: 'INTERACTION_ERROR',

    // Application errors
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    CONFIG_ERROR: 'CONFIG_ERROR',

    // Unknown errors
    UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

/**
 * Handles an error by logging it and optionally responding to an interaction
 *
 * @param {Error|string} error - The error object or error message
 * @param {string} source - The source of the error (file path or component name)
 * @param {Object} options - Additional options for error handling
 * @param {string} options.type - The type of error from ErrorType enum
 * @param {Object} options.interaction - Discord interaction object for responding to the user
 * @param {boolean} options.silent - If true, doesn't respond to the interaction
 * @param {Object} options.context - Additional context information for debugging
 * @return {void}
 */
function handleError(error, source, options = {}) {
    const { type = ErrorType.UNKNOWN_ERROR, interaction, silent = false, context = {} } = options;

    // Extract error message
    const errorMessage = error instanceof Error ? error.message : error;

    // Log the error with the appropriate level based on type
    if (type === ErrorType.INTERNAL_ERROR || type === ErrorType.UNKNOWN_ERROR) {
        logger.error(`${type}: ${errorMessage}`, source);
        if (error instanceof Error && error.stack) {
            logger.log(error.stack, logger.colors.fg.crimson);
        }
    } else if (type === ErrorType.DISCORD_API_ERROR || type === ErrorType.CONFIG_ERROR) {
        logger.warn(`${type}: ${errorMessage} at ${source}`);
        if (error instanceof Error && error.stack) {
            logger.log(error.stack, logger.colors.fg.yellow);
        }
    } else {
        logger.info(`${type}: ${errorMessage} at ${source}`);
    }

    // Log additional context if provided
    if (Object.keys(context).length > 0) {
        logger.info(`Error context: ${JSON.stringify(context)}`);
    }

    // Respond to interaction if provided and not silent
    if (interaction && !silent) {
        respondToInteraction(interaction, type, errorMessage);
    }
}

/**
 * Responds to a Discord interaction with an appropriate error message
 *
 * @param {Object} interaction - The Discord interaction object
 * @param {string} errorType - The type of error from ErrorType enum
 * @param {string} errorMessage - The error message
 * @return {void}
 */
async function respondToInteraction(interaction, errorType, errorMessage) {
    // Check if interaction has already been replied to
    if (interaction.replied || interaction.deferred) {
        try {
            await interaction.followUp({
                content: getUserFriendlyErrorMessage(errorType, errorMessage),
                ephemeral: true
            });
        } catch (err) {
            logger.warn(`Failed to follow up on interaction: ${err.message}`);
        }
    } else {
        try {
            await interaction.reply({
                content: getUserFriendlyErrorMessage(errorType, errorMessage),
                ephemeral: true
            });
        } catch (err) {
            logger.warn(`Failed to reply to interaction: ${err.message}`);
        }
    }
}

/**
 * Converts an error type and message to a user-friendly message
 *
 * @param {string} errorType - The type of error from ErrorType enum
 * @param {string} errorMessage - The technical error message
 * @return {string} A user-friendly error message
 */
function getUserFriendlyErrorMessage(errorType, errorMessage) {
    switch (errorType) {
        case ErrorType.INVALID_INPUT:
            return `Ungültige Eingabe: ${errorMessage}`;

        case ErrorType.PERMISSION_DENIED:
            return `Keine Berechtigung: ${errorMessage}`;

        case ErrorType.RESOURCE_NOT_FOUND:
            return `Ressource nicht gefunden: ${errorMessage}`;

        case ErrorType.RESOURCE_UNAVAILABLE:
            return `Ressource nicht verfügbar: ${errorMessage}`;

        case ErrorType.DISCORD_API_ERROR:
        case ErrorType.INTERACTION_ERROR:
            return 'Es ist ein Discord-API-Fehler aufgetreten. Bitte versuche es später erneut.';

        case ErrorType.INTERNAL_ERROR:
        case ErrorType.CONFIG_ERROR:
        case ErrorType.UNKNOWN_ERROR:
        default:
            return 'Es ist ein interner Fehler aufgetreten. Bitte kontaktiere einen Administrator.';
    }
}

/**
 * Wraps an async function with error handling
 *
 * @param {Function} fn - The async function to wrap
 * @param {string} source - The source of the function (file path or component name)
 * @param {Object} options - Additional options for error handling
 * @return {Function} The wrapped function with error handling
 */
function withErrorHandling(fn, source, options = {}) {
    return async function(...args) {
        try {
            return await fn(...args);
        } catch (error) {
            handleError(error, source, {
                ...options,
                interaction: args.find(arg => arg && typeof arg === 'object' && 'reply' in arg)
            });
        }
    };
}

module.exports = {
    ErrorType,
    handleError,
    withErrorHandling
};