/**
 * Tests for the data utility module
 *
 * @group util
 * @group data
 * @group prisoners
 */

// Imports
const data = require('../../src/util/data');

describe('prisonerManagement', () => {
    // Setup
    beforeEach(() => {
        const currentPrisoners = [...Array(1000)].map((_, i) => i);
        currentPrisoners.forEach(id => data.removePrisoner(id));
    });

    describe('addPrisoner', () => {
        test('should add a prisoner successfully', () => {
            // Act
            data.addPrisoner(1);

            // Assert
            expect(data.isPrisoner(1)).toBe(true);
        });

        test('should allow adding multiple prisoners', () => {
            // Act
            data.addPrisoner(1);
            data.addPrisoner(2);

            // Assert
            expect(data.isPrisoner(1)).toBe(true);
            expect(data.isPrisoner(2)).toBe(true);
        });
    });

    describe('removePrisoner', () => {
        test('should remove an existing prisoner', () => {
            // Act
            data.addPrisoner(1);
            data.removePrisoner(1);

            // Assert
            expect(data.isPrisoner(1)).toBe(false);
        });

        test('should not affect other prisoners when removing one', () => {
            // Act
            data.addPrisoner(1);
            data.addPrisoner(2);
            data.removePrisoner(1);

            // Assert
            expect(data.isPrisoner(1)).toBe(false);
            expect(data.isPrisoner(2)).toBe(true);
        });

        test('should handle removing non-existent prisoner', () => {
            // Act
            data.removePrisoner(999);

            // Assert
            expect(data.isPrisoner(999)).toBe(false);
        });
    });

    describe('isPrisoners', () => {
        test('should return true for existing prisoner', () => {
            // Act
            data.addPrisoner(1);

            // Assert
            expect(data.isPrisoner(1)).toBe(true);
        });

        test('should return false for non-existent prisoner', () => {
            // Assert
            expect(data.isPrisoner(999)).toBe(false);
        });

        test('should return false after prisoner is removed', () => {
            // Act
            data.addPrisoner(1);
            data.removePrisoner(1);

            // Assert
            expect(data.isPrisoner(1)).toBe(false);
        });
    });
});
