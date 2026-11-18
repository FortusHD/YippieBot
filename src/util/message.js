// Helpers for building discord messages

const MAX_MESSAGE_LENGTH = 2000;

/**
 * Makes a value safe for the use inside of an inline code span: backticks and line breaks could end the code span
 * and inject own formatting or mentions into the message.
 *
 * @param {*} value - The value to use in the code span.
 * @return {string} The sanitized value.
 */
function sanitizeCodeSpan(value) {
    return String(value ?? '').replace(/[`\r\n]/g, '').trim();
}

/**
 * Splits a text at line breaks into parts that fit into a discord message.
 * A single line that is longer than the limit is cut.
 *
 * @param {string} text - The text to split.
 * @param {number} [maxLength=2000] - The maximum length of a part.
 * @return {string[]} The parts of the text.
 */
function splitMessage(text, maxLength = MAX_MESSAGE_LENGTH) {
    const parts = [];
    let current = '';

    for (const rawLine of text.split('\n')) {
        const line = rawLine.slice(0, maxLength);

        if (current.length > 0 && current.length + 1 + line.length > maxLength) {
            parts.push(current);
            current = line;
        } else {
            current = current.length > 0 ? `${current}\n${line}` : line;
        }
    }

    if (current.length > 0) {
        parts.push(current);
    }
    return parts;
}

module.exports = { MAX_MESSAGE_LENGTH, sanitizeCodeSpan, splitMessage };
