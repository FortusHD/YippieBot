// Imports
const { isValidFriendCode, isValidSteamName } = require('../../src/util/steam');

describe('steam', () => {
    describe('isValidFriendCode', () => {
        test.each(['1', '52079950', '123456789', '4294967295'])('should accept %s', (code) => {
            expect(isValidFriendCode(code)).toBe(true);
        });

        test.each([
            '', '0', '4294967296', '12345678901', '-5', '1.5', ' 123', 'abc', '12 34', '1`@everyone`', '٣٤٥',
        ])('should reject "%s"', (code) => {
            expect(isValidFriendCode(code)).toBe(false);
        });

        test('should reject values that are not strings', () => {
            expect(isValidFriendCode(null)).toBe(false);
            expect(isValidFriendCode(undefined)).toBe(false);
            expect(isValidFriendCode(123456)).toBe(false);
        });
    });

    describe('isValidSteamName', () => {
        test('should accept names with 1 to 32 characters', () => {
            expect(isValidSteamName('a')).toBe(true);
            expect(isValidSteamName('a'.repeat(32))).toBe(true);
        });

        test('should reject empty and too long names', () => {
            expect(isValidSteamName('')).toBe(false);
            expect(isValidSteamName('a'.repeat(33))).toBe(false);
            expect(isValidSteamName(null)).toBe(false);
        });
    });
});
