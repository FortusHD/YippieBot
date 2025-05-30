// Imports
const jsonManager = require('../../src/util/json_manager.js');
const logger = require('../../src/logging/logger');
const wichtelModal = require('../../src/modals/wichtelModal');
const { MessageFlags } = require('discord.js');

// Mock
jest.mock('../../src/util/json_manager', () => ({
    participantJoined: jest.fn(),
}));
jest.mock('../../src/logging/logger', () => ({
    info: jest.fn(),
    debug: jest.fn(),
}));

describe('wichtelModal', () => {
    test('should have required properties', () => {
        // Assert
        expect(wichtelModal).toHaveProperty('data');
        expect(wichtelModal).toHaveProperty('execute');
        expect(typeof wichtelModal.data).toBe('object');
        expect(typeof wichtelModal.execute).toBe('function');
        expect(wichtelModal.data.data.custom_id).toBe('steamData');
    });

    describe('wichtelModal.execute', () => {
        let mockInteraction;
        let mockMember;

        // Setup
        beforeEach(() => {
            jest.clearAllMocks();

            mockMember = {
                user: {
                    id: '123456789',
                    username: 'TestUser',
                },
                nickname: null,
            };

            mockInteraction = {
                member: mockMember,
                user: {
                    tag: 'TestUser#1234',
                },
                fields: {
                    getTextInputValue: jest.fn(),
                },
                reply: jest.fn(),
            };

            mockInteraction.fields.getTextInputValue
                .mockImplementation((field) => {
                    switch (field) {
                    case 'steamName':
                        return 'TestSteamName';
                    case 'steamFriendCode':
                        return 'TestFriendCode';
                    default:
                        return null;
                    }
                });
        });

        test('should handle successful submission with nickname', async () => {
            // Arrange
            mockMember.nickname = 'TestNickname';

            // Act
            await wichtelModal.execute(mockInteraction);

            // Assert
            expect(jsonManager.participantJoined).toHaveBeenCalledWith({
                id: '123456789',
                dcName: 'TestNickname',
                steamName: 'TestSteamName',
                steamFriendCode: 'TestFriendCode',
            });
            expect(mockInteraction.reply).toHaveBeenCalledWith({
                content: 'Du bist dem Wichteln beigetreten.',
                flags: MessageFlags.Ephemeral,
            });
            expect(logger.info).toHaveBeenCalledWith(
                'Handling wichtel modal submission by "TestUser#1234".',
            );
            expect(logger.info).toHaveBeenCalledWith(
                'Done handling wichtel modal submission by "TestUser#1234".',
            );
        });

        test('should handle successful submission without nickname', async () => {
            // Act
            await wichtelModal.execute(mockInteraction);

            // Assert
            expect(jsonManager.participantJoined).toHaveBeenCalledWith({
                id: '123456789',
                dcName: 'TestUser',
                steamName: 'TestSteamName',
                steamFriendCode: 'TestFriendCode',
            });
            expect(mockInteraction.reply).toHaveBeenCalledWith({
                content: 'Du bist dem Wichteln beigetreten.',
                flags: MessageFlags.Ephemeral,
            });
        });

        test('should not process submission if member is null', async () => {
            // Arrange
            mockInteraction.member = null;

            // Act
            await wichtelModal.execute(mockInteraction);

            // Assert
            expect(jsonManager.participantJoined).not.toHaveBeenCalled();
            expect(mockInteraction.reply).not.toHaveBeenCalled();
            expect(logger.info).toHaveBeenCalledWith(
                'Handling wichtel modal submission by "TestUser#1234".',
            );
        });
    });

});