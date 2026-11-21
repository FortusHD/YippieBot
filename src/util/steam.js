/**
 * Helpers for the Steam data that is entered for the wichteln.
 *
 * A Steam friend code (Steam client: Friends -> Add a Friend) is the 32-bit account id of the user, shown as a plain
 * number (e.g. 52079950). So it consists of digits only and is smaller than 2^32.
 * The Steam profile name (persona name) can have up to 32 characters.
 *
 * @module util/steam
 */

const MAX_FRIEND_CODE_LENGTH = 10; // 4294967295 has 10 digits
const MAX_FRIEND_CODE_VALUE = 2 ** 32 - 1;
const MAX_STEAM_NAME_LENGTH = 32;

/**
 * Checks if a value is a valid Steam friend code.
 *
 * @param {string} code - The (already trimmed) friend code.
 * @return {boolean} True if the code is a number between 1 and 4294967295.
 */
function isValidFriendCode(code) {
    if (typeof code !== 'string' || !/^\d{1,10}$/.test(code)) {
        return false;
    }
    const value = Number(code);
    return value >= 1 && value <= MAX_FRIEND_CODE_VALUE;
}

/**
 * Checks if a value is a usable Steam name (not empty, at most 32 characters).
 *
 * @param {string} name - The (already trimmed) Steam name.
 * @return {boolean} True if the name is valid.
 */
function isValidSteamName(name) {
    return typeof name === 'string' && name.length >= 1 && [...name].length <= MAX_STEAM_NAME_LENGTH;
}

module.exports = {
    MAX_FRIEND_CODE_LENGTH,
    MAX_STEAM_NAME_LENGTH,
    isValidFriendCode,
    isValidSteamName,
};
