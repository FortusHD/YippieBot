/* eslint no-console: 0*/
// Imports
const date = require('date-and-time');
const fs = require('fs');

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

/**
 * Retrieves the file path for the log file based on the current date.
 *
 * @return {string} The file path for the log file in the format './logs/YYYY-MM-DD.log'.
 */
function getLogPath() {
    const now = new Date();
    return `./logs/${date.format(now, 'YYYY-MM-DD')}.log`;
}

/**
 * Appends a log entry to the log file.
 *
 * @param {string} text - The log message to be written into the log file.
 * @return {void} This function does not return any result.
 */
function writeLog(text) {
    fs.appendFile(getLogPath(), `${text}\n`, err => {
        if (err) {
            console.error(`${colors.fg.red}[ERROR] [${new Date().toLocaleString()}] ${err}${colors.reset}`);
        }
    });
}

/**
 * Logs the given text with a specified color and writes it to a log file.
 *
 * @param {string} text - The message or text to log.
 * @param {string} color - The color code or identifier for formatting the log message.
 * @return {void}
 */
function log(text, color) {
    console.log(`${color}[${new Date().toLocaleString()}] ${text}${colors.reset}`);
    writeLog(`[${new Date().toLocaleString()}] ${text}`);
}

/**
 * Logs informational messages to the console and writes the log to a file.
 *
 * @param {string} text - The informational message to be logged.
 * @return {void}
 */
function info(text) {
    console.info(`${colors.fg.green}[INFO] [${new Date().toLocaleString()}] ${text}${colors.reset}`);
    writeLog(`[INFO] [${new Date().toLocaleString()}] ${text}`);
}

/**
 * Logs a warning message to the console with a timestamp and writes it to a log.
 *
 * @param {string} text - The warning message to be logged.
 * @return {void} This function does not return a value.
 */
function warn(text) {
    console.warn(`${colors.fg.yellow}[WARNING] [${new Date().toLocaleString()}] ${text}${colors.reset}`);
    writeLog(`[WARNING] [${new Date().toLocaleString()}] ${text}`);
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
    console.error(`${colors.fg.red}[ERROR] [${new Date().toLocaleString()}] ${text} at ${source}${colors.reset}`);
    writeLog(`[ERROR] [${new Date().toLocaleString()}] ${text}`);
}

module.exports = { colors, log, info, warn, error };