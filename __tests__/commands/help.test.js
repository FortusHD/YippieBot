// Imports
const help = require('../../src/commands/help');

// Mock
jest.mock('../../src/logging/logger', () => ({
    info: jest.fn(),
    debug: jest.fn(),
}));

jest.mock('fs', () => ({
    readdirSync: jest.fn(),
}));

jest.mock('path', () => ({
    join: jest.fn(),
}));

describe('help', () => {
    test('should have required properties', () => {
        // Assert
        expect(help).toHaveProperty('guild', true);
        expect(help).toHaveProperty('dm', true);
        expect(help).toHaveProperty('data');
        expect(help).toHaveProperty('help');
        expect(help.help).toHaveProperty('usage');
        expect(help.data).toHaveProperty('name', 'help');
        expect(help.data).toHaveProperty('description');
        expect(help.data.options).toHaveLength(1);
        expect(help.data.options[0]).toHaveProperty('name', 'command');
        expect(help.data.options[0]).toHaveProperty('description');
        expect(help.data.options[0]).toHaveProperty('type', 3);
        expect(help.data.options[0]).toHaveProperty('required', false);
    });

    describe('execute', () => {
        // TODO
    });
});