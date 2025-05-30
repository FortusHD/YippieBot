// Imports
const logger = require('../logging/logger.js');
const { getEnv, getAdminUserId } = require('../util/config');
const { buildErrorEmbed } = require('../util/util');

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
    MESSAGE_NOT_SENT: 'MESSAGE_NOT_SENT',
    UNKNOWN_COMMAND: 'UNKNOWN_COMMAND',
    UNKNOWN_BUTTON: 'UNKNOWN_BUTTON',
    UNKNOWN_MODAL: 'UNKNOWN_MODAL',

    // Application errors
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    CONFIG_ERROR: 'CONFIG_ERROR',

    // Data errors
    FILE_NOT_CREATED: 'FILE_NOT_CREATED',
    FILE_NOT_READ: 'FILE_NOT_READ',
    FILE_NULL: 'FILE_NULL',
    FILE_OPERATION_FAILED: 'FILE_OPERATION_FAILED',

    // YouTube cookie error
    PLAY_ERROR: 'PLAY_ERROR',

    // Unknown errors
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
};

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
    case ErrorType.MESSAGE_NOT_SENT:
        return 'Es ist ein Discord-API-Fehler aufgetreten. Bitte versuche es später erneut.';

    case ErrorType.UNKNOWN_COMMAND:
        return 'Dieser Befehl ist nicht bekannt. Bitte frage bei einem Administrator nach.';
    case ErrorType.UNKNOWN_BUTTON:
        return 'Dieser Knopf ist nicht bekannt. Bitte frage bei einem Administrator nach.';
    case ErrorType.UNKNOWN_MODAL:
        return 'Dieses Modal ist nicht bekannt. Bitte frage bei einem Administrator nach.';

    case ErrorType.PLAY_ERROR:
        return 'Die Cookies des Bots könnten abgelaufen sein. Ein Admin wurde darüber informiert.';

    case ErrorType.INTERNAL_ERROR:
    case ErrorType.CONFIG_ERROR:
    case ErrorType.FILE_NOT_CREATED:
    case ErrorType.FILE_NOT_READ:
    case ErrorType.FILE_NULL:
    case ErrorType.FILE_OPERATION_FAILED:
    case ErrorType.UNKNOWN_ERROR:
    default:
        return 'Es ist ein interner Fehler aufgetreten. Bitte kontaktiere einen Administrator.';
    }
}

/**
 * Sends an alert to the admin user via a direct message if alerts are enabled in the environment configuration.
 *
 * @param {object} client - The client instance used to interact with the system or API.
 * @param {string} type - The type of alert being sent.
 * @param {string} errorMessage - A descriptive error message to include in the alert.
 * @param {string} source - The source or origin of the alert, such as a specific module or function.
 * @param {object} context - Additional contextual data related to the alert.
 * @return {Promise<void>} A promise that resolves once the alert is sent or the function completes error handling.
 * Does not return any specific value.
 */
async function sendAlert(client, type, errorMessage, source, context) {
    if (getEnv('ENABLE_ALERT', 'false').toLowerCase() === 'true') {
        let admin;
        try {
            admin = await client.users.fetch(getAdminUserId());
        } catch (err) {
            logger.warn(`Failed to fetch admin user with ID ${getAdminUserId()}: ${err.message}`);
            return;
        }

        let dmChannel = admin.dmChannel;

        if (!dmChannel) {
            try {
                dmChannel = await admin.createDM();
            } catch (err) {
                logger.warn(`Failed to create DM with admin: ${err.message}`);
                return;
            }
        }
        if (!dmChannel) {
            logger.warn('DM channel could not be created for the admin.');
            return;
        }

        const fields = [
            { name: 'Source', value: source, inline: false },
            { name: 'Timestamp', value: new Date().toISOString(), inline: false },
        ];

        if (context && typeof context === 'object' && Object.keys(context).length !== 0) {
            fields.push({ name: 'Context', value: JSON.stringify(context), inline: false });
        }

        const embed = buildErrorEmbed(
            errorMessage,
            fields,
        );

        try {
            await dmChannel.send({ embeds: [embed] });
        } catch (err) {
            logger.error(`Failed to send DM to admin: ${err.message}`);
        }
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
                ephemeral: true,
            });
        } catch (err) {
            logger.warn(`Failed to follow up on interaction: ${err.message}`);
        }
    } else {
        try {
            await interaction.reply({
                content: getUserFriendlyErrorMessage(errorType, errorMessage),
                ephemeral: true,
            });
        } catch (err) {
            logger.warn(`Failed to reply to interaction: ${err.message}`);
        }
    }
}

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
        logger.warn(`${type}: ${errorMessage} at ${source}`);
    }

    // Log additional context if provided
    if (context && typeof context === 'object' && Object.keys(context).length > 0) {
        logger.warn(`Error context: ${JSON.stringify(context)}`);
    }

    // Respond to interaction if provided and not silent
    if (interaction && !silent) {
        respondToInteraction(interaction, type, errorMessage);
    }

    // Notify admin
    if (interaction && interaction.client) {
        void sendAlert(interaction.client, type, errorMessage, source, context);
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
    return async function (...args) {
        try {
            return await fn(...args);
        } catch (error) {
            handleError(error, source, {
                ...options,
                interaction: args.find(arg => arg && typeof arg === 'object' && 'reply' in arg),
            });
        }
    };
}

module.exports = {
    ErrorType,
    handleError,
    withErrorHandling,
};