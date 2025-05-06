// Imports
const logger = require('../../src/logging/logger');
const config = require('../../src/util/config');
const { ErrorType, handleError } = require('../../src/logging/errorHandler');
const quickDeport = require('../../src/commands/quickDeport');
// Mock
jest.mock('../../src/logging/logger', () => ({
    info: jest.fn(),
}));

jest.mock('../../src/util/config', () => ({
    getAfkChannelId: jest.fn(),
}));

jest.mock('../../src/logging/errorHandler', () => ({
    ...jest.requireActual('../../src/logging/errorHandler'),
    handleError: jest.fn(),
}));

describe('quickDeport', () => {
    test('should have required properties', () => {
        expect(quickDeport).toHaveProperty('guild', true);
        expect(quickDeport).toHaveProperty('dm', false);
        expect(quickDeport).toHaveProperty('data');
        expect(quickDeport.data).toHaveProperty('name', 'quick-deport');
        expect(quickDeport.data).toHaveProperty('description');
        expect(quickDeport.data.options).toHaveLength(1);
        expect(quickDeport.data.options[0]).toHaveProperty('name', 'user');
        expect(quickDeport.data.options[0]).toHaveProperty('description');
        expect(quickDeport.data.options[0]).toHaveProperty('type', 6);
        expect(quickDeport.data.options[0]).toHaveProperty('required', true);
    });

    describe('execute', () => {
        let mockUser;
        let mockMember;
        let mockChannel;
        let mockGuild;
        let mockInteraction;

        // Setup
        beforeEach(() => {
            jest.clearAllMocks();

            mockUser = {
                id: '456',
                tag: 'prisonerTag',
            };

            mockMember = {
                user: mockUser,
                voice: {
                    channel: {},
                    setChannel: jest.fn(),
                },
            };

            mockChannel = {
                id: '1234',
            };

            mockGuild = {
                channels: {
                    cache: {
                        find: jest.fn(predicate => {
                            if (predicate(mockChannel)) {
                                return mockChannel;
                            }
                            return null;
                        }),
                    },
                },
                members: {
                    cache: {
                        get: jest.fn().mockReturnValue(mockMember),
                    },
                },
            };

            mockInteraction = {
                user: {
                    tag: 'userTag',
                },
                options: {
                    getUser: jest.fn().mockReturnValue(mockUser),
                },
                guild: mockGuild,
                reply: jest.fn(),
            };
        });
    });
});