// Imports
const logger = require('../../src/logging/logger');
const { MessageFlags } = require('discord.js');
const { insertOrUpdateParticipant } = require('../../src/database/tables/wichtelParticipants');
const wichtelModal = require('../../src/modals/wichtelModal');

// Mock
jest.mock('../../src/database/tables/wichtelParticipants', () => ({
    insertOrUpdateParticipant: jest.fn(),
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
                        return '123456789';
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
            expect(insertOrUpdateParticipant).toHaveBeenCalledWith({
                id: '123456789',
                dcName: 'TestNickname',
                steamName: 'TestSteamName',
                steamFriendCode: '123456789',
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
            expect(insertOrUpdateParticipant).toHaveBeenCalledWith({
                id: '123456789',
                dcName: 'TestUser',
                steamName: 'TestSteamName',
                steamFriendCode: '123456789',
            });
            expect(mockInteraction.reply).toHaveBeenCalledWith({
                content: 'Du bist dem Wichteln beigetreten.',
                flags: MessageFlags.Ephemeral,
            });
        });

        test.each([
            ['text', 'TestFriendCode'],
            ['a code with a markdown breakout', '1` @everyone `'],
            ['a code that is too large', '4294967296'],
            ['zero', '0'],
            ['an empty code', '   '],
        ])('should reject %s as friend code', async (_name, code) => {
            // Arrange
            mockInteraction.fields.getTextInputValue.mockImplementation(
                field => (field === 'steamFriendCode' ? code : 'TestSteamName'),
            );

            // Act
            await wichtelModal.execute(mockInteraction);

            // Assert
            expect(insertOrUpdateParticipant).not.toHaveBeenCalled();
            expect(mockInteraction.reply).toHaveBeenCalledWith({
                content: expect.stringContaining('Freundes-Code ist ungültig'),
                flags: MessageFlags.Ephemeral,
            });
        });

        test('should reject an empty steam name', async () => {
            // Arrange
            mockInteraction.fields.getTextInputValue.mockImplementation(
                field => (field === 'steamName' ? '  ' : '123456789'),
            );

            // Act
            await wichtelModal.execute(mockInteraction);

            // Assert
            expect(insertOrUpdateParticipant).not.toHaveBeenCalled();
            expect(mockInteraction.reply).toHaveBeenCalledWith({
                content: expect.stringContaining('Steam-Name ist ungültig'),
                flags: MessageFlags.Ephemeral,
            });
        });

        test('should trim the entered values', async () => {
            // Arrange
            mockInteraction.fields.getTextInputValue.mockImplementation(
                field => (field === 'steamName' ? '  Name ' : ' 52079950 '),
            );

            // Act
            await wichtelModal.execute(mockInteraction);

            // Assert
            expect(insertOrUpdateParticipant).toHaveBeenCalledWith(expect.objectContaining({
                steamName: 'Name',
                steamFriendCode: '52079950',
            }));
        });

        test('should not process submission if member is null', async () => {
            // Arrange
            mockInteraction.member = null;

            // Act
            await wichtelModal.execute(mockInteraction);

            // Assert
            expect(insertOrUpdateParticipant).not.toHaveBeenCalled();
            expect(mockInteraction.reply).not.toHaveBeenCalled();
            expect(logger.info).toHaveBeenCalledWith(
                'Handling wichtel modal submission by "TestUser#1234".',
            );
        });
    });

});