// Imports
const { sanitizeCodeSpan, splitMessage } = require('../../src/util/message');

describe('message', () => {
    describe('sanitizeCodeSpan', () => {
        test('should remove backticks and line breaks', () => {
            expect(sanitizeCodeSpan('1` @everyone `\r\n2')).toBe('1 @everyone 2');
        });

        test('should handle values that are not strings', () => {
            expect(sanitizeCodeSpan(123)).toBe('123');
            expect(sanitizeCodeSpan(null)).toBe('');
            expect(sanitizeCodeSpan(undefined)).toBe('');
        });
    });

    describe('splitMessage', () => {
        test('should not split a short message', () => {
            expect(splitMessage('a\nb')).toEqual(['a\nb']);
        });

        test('should split at line breaks and respect the limit', () => {
            // Arrange
            const text = ['aaaa', 'bbbb', 'cccc'].join('\n');

            // Act
            const parts = splitMessage(text, 9);

            // Assert
            expect(parts).toEqual(['aaaa\nbbbb', 'cccc']);
        });

        test('should cut a single line that is too long', () => {
            expect(splitMessage('abcdefgh', 5)).toEqual(['abcde']);
        });

        test('should keep every part below 2000 characters by default', () => {
            const text = [...Array(500)].map((_, i) => `<@${i}>, \`Friend-Code: 123456789\``).join('\n');
            const parts = splitMessage(text);
            expect(parts.length).toBeGreaterThan(1);
            parts.forEach(part => expect(part.length).toBeLessThanOrEqual(2000));
            expect(parts.join('\n')).toBe(text);
        });
    });
});
