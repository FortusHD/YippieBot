/* eslint no-console: 0*/
// Imports
const date = require('date-and-time');
const fs = require('fs');
const path = require('node:path');
require('dotenv').config();

// Color codes mapping
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    underscore: '\x1b[4m',
    blink: '\x1b[5m',
    reverse: '\x1b[7m',
    hidden: '\x1b[8m',

    fg: {
        black: '\x1b[30m',
        red: '\x1b[31m',
        green: '\x1b[32m',
        yellow: '\x1b[33m',
        blue: '\x1b[34m',
        magenta: '\x1b[35m',
        cyan: '\x1b[36m',
        white: '\x1b[37m',
        gray: '\x1b[90m',
        crimson: '\x1b[38m',
    },
    bg: {
        black: '\x1b[40m',
        red: '\x1b[41m',
        green: '\x1b[42m',
        yellow: '\x1b[43m',
        blue: '\x1b[44m',
        magenta: '\x1b[45m',
        cyan: '\x1b[46m',
        white: '\x1b[47m',
        gray: '\x1b[100m',
        crimson: '\x1b[48m',
    },
};

const logLevelMapping = new Map([
    ['debug', 0],
    ['info', 1],
    ['warn', 2],
    ['error', 3],
]);

const logLevel = logLevelMapping.get(process.env['LOG_LEVEL']?.toLowerCase()) ?? 1;

// Cache for timestamp to avoid creating too many Date objects
let lastTimestamp = '';
let lastTimestampTime = 0;
const TIMESTAMP_CACHE_DURATION = 100; // Cache timestamp for 100 ms

/**
 * Gets the current timestamp string for logging.
 * Uses a cached timestamp if called within TIMESTAMP_CACHE_DURATION ms of the last call.
 *
 * @return {string} The current timestamp in locale string format.
 */
function getTimestamp() {
    const now = Date.now();
    if (now - lastTimestampTime < TIMESTAMP_CACHE_DURATION) {
        return lastTimestamp;
    }

    lastTimestamp = new Date(now).toLocaleString();
    lastTimestampTime = now;
    return lastTimestamp;
}

/**
 * Retrieves the file path for the log file based on the current date.
 *
 * @return {string} The file path for the log file in the format './logs/YYYY-MM-DD.log'.
 */
function getLogPath() {
    const now = new Date();
    return `./logs/${date.format(now, 'YYYY-MM-DD')}.log`;
}

// Buffer for batching log writes
let logBuffer = [];
let logBufferTimer = null;
const LOG_BUFFER_INTERVAL = 1000; // Flush logs every 1 second

/**
 * Flushes the log buffer to the log file.
 *
 * @return {void} This function does not return any result.
 */
function flushLogBuffer() {
    if (logBuffer.length === 0) {
        logBufferTimer = null;
        return;
    }

    const logPath = getLogPath();
    const logContent = logBuffer.join('');
    logBuffer = [];
    logBufferTimer = null;

    fs.appendFile(logPath, logContent, err => {
        if (err) {
            const timestamp = getTimestamp();
            console.error(`${colors.fg.red}[ERROR] [${timestamp}] ${err}${colors.reset}`);
        }
    });
}

/**
 * Appends a log entry to the log buffer and schedules a flush if needed.
 *
 * @param {string} text - The log message to be written into the log file.
 * @return {void} This function does not return any result.
 */
function writeLog(text) {
    logBuffer.push(`${text}\n`);

    // Schedule a flush if not already scheduled
    if (!logBufferTimer) {
        logBufferTimer = setTimeout(flushLogBuffer, LOG_BUFFER_INTERVAL);
    }
}

/**
 * Deletes log files in the './logs' directory that are older than two months.
 *
 * The method checks files with a naming format of 'YYYY-MM-DD.log' to determine their age
 * and deletes any log files that are more than two months older than the current date.
 * Non-log files or files that do not match the naming convention are ignored.
 * Uses asynchronous file operations to reduce CPU usage.
 *
 * @return {Promise<void>} A promise that resolves when the operation is complete.
 */
async function deleteOldLogs() {
    const now = new Date();

    try {
        const files = await fs.promises.readdir('./logs');

        // Process files in batches to avoid overwhelming the file system
        const BATCH_SIZE = 10;
        for (let i = 0; i < files.length; i += BATCH_SIZE) {
            const batch = files.slice(i, i + BATCH_SIZE);

            // Process each batch concurrently
            await Promise.all(batch.map(async (file) => {
                const filePath = path.join('./logs', file);

                const match = file.match(/^(\d{4})-(\d{2})-(\d{2})\.log$/);
                if (!match) {
                    return;
                }

                const [, year, month, day] = match;
                const fileDate = new Date(year, month - 1, day);

                const diffInMonths = (now.getFullYear() - fileDate.getFullYear()) * 12 +
                    (now.getMonth() - fileDate.getMonth());

                if (diffInMonths > 2) {
                    try {
                        await fs.promises.unlink(filePath);
                        console.info(`Deleted old log file: ${filePath}`);
                    } catch (err) {
                        console.error(`Error deleting file ${filePath}:`, err);
                    }
                }
            }));
        }
    } catch (err) {
        console.error(`Error reading logs directory: ${err}`);
    }
}

/**
 * Logs the given text with a specified color and writes it to a log file.
 *
 * @param {string} text - The message or text to log.
 * @param {string} color - The color code or identifier for formatting the log message.
 * @return {void}
 */
function log(text, color) {
    const timestamp = getTimestamp();
    console.log(`${color}[${timestamp}] ${text}${colors.reset}`);
    writeLog(`[${timestamp}] ${text}`);
}

/**
 * Logs a debug message to the console and writes it to a log file if the log level is set to 0 or lower.
 *
 * @param {string} text - The debug message to log.
 * @param {string} [source='unknown'] - The source or origin of the debug message.
 * @return {void} This function does not return a value.
 */
function debug(text, source = 'unknown') {
    if (logLevel <= 0) {
        const timestamp = getTimestamp();
        console.debug(`${colors.fg.gray}[DEBUG] [${timestamp}] [${source}] ${text}${colors.reset}`);
        writeLog(`[DEBUG] [${timestamp}] [${source}] ${text}`);
    }
}

/**
 * Logs informational messages to the console and writes the log to a file.
 *
 * @param {string} text - The informational message to be logged.
 * @return {void}
 */
function info(text) {
    if (logLevel <= 1) {
        const timestamp = getTimestamp();
        console.info(`${colors.fg.green}[INFO] [${timestamp}] ${text}${colors.reset}`);
        writeLog(`[INFO] [${timestamp}] ${text}`);
    }
}

/**
 * Logs a warning message to the console with a timestamp and writes it to a log.
 *
 * @param {string} text - The warning message to be logged.
 * @return {void} This function does not return a value.
 */
function warn(text) {
    if (logLevel <= 2) {
        const timestamp = getTimestamp();
        console.warn(`${colors.fg.yellow}[WARNING] [${timestamp}] ${text}${colors.reset}`);
        writeLog(`[WARNING] [${timestamp}] ${text}`);
    }
}

/**
 * Logs an error message with a timestamp and source, while formatting it for console output.
 * Also writes the error message to a log file.
 *
 * @param {string} text - The error message to be logged.
 * @param {string} source - The originating source of the error.
 * @return {void} Does not return any value.
 */
function error(text, source) {
    const timestamp = getTimestamp();
    console.error(`${colors.fg.red}[ERROR] [${timestamp}] ${text} at ${source}${colors.reset}`);
    writeLog(`[ERROR] [${timestamp}] ${text}`);
}

module.exports = { colors, log, debug, info, warn, error, deleteOldLogs };
