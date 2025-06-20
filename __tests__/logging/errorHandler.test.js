// Imports
const logger = require('../../src/logging/logger.js');
const { getEnv, getAdminUserId } = require('../../src/util/config');
const { buildErrorEmbed } = require('../../src/util/embedBuilder');
const { ErrorType, handleError, withErrorHandling } = require('../../src/logging/errorHandler');

// Mock
jest.mock('../../src/logging/logger.js', () => ({
    error: jest.fn(),
    warn: jest.fn(),
    log: jest.fn(),
    colors: {
        fg: {
            crimson: '\x1b[38m',
            yellow: '\x1b[33m',
        },
    },
}));

jest.mock('../../src/util/config', () => ({
    getEnv: jest.fn(),
    getAdminUserId: jest.fn(),
}));

jest.mock('../../src/util/embedBuilder', () => ({
    buildErrorEmbed: jest.fn(),
}));

describe('errorHandler', () => {
    let mockInteraction;

    // Setup
    beforeEach(() => {
        jest.clearAllMocks();

        mockInteraction = {
            reply: jest.fn().mockResolvedValue(undefined),
            followUp: jest.fn().mockResolvedValue(undefined),
            replied: false,
            deferred: false,
        };
    });

    describe('handleError', () => {
        const source = 'TestComponent';

        test('should handle Error objects', () => {
            // Arrange
            const error = new Error('Test error');

            // Act
            handleError(error, source);

            // Assert
            expect(logger.error).toHaveBeenCalledWith(
                expect.stringContaining('UNKNOWN_ERROR: Test error'),
                source,
            );
        });

        test('should handle string errors', () => {
            // Act
            handleError('Test error string', source);

            // Assert
            expect(logger.error).toHaveBeenCalledWith(
                expect.stringContaining('UNKNOWN_ERROR: Test error string'),
                source,
            );
        });

        test('should log stack trace for internal errors', () => {
            // Arrange
            const error = new Error('Internal error');
            error.stack = 'Stack trace';

            // Act
            handleError(error, source, { type: ErrorType.INTERNAL_ERROR });

            // Assert
            expect(logger.error).toHaveBeenCalledWith(
                expect.stringContaining('INTERNAL_ERROR'),
                source,
            );
            expect(logger.log).toHaveBeenCalledWith(
                'Stack trace',
                logger.colors.fg.crimson,
            );
        });

        test('should log stack trace with yellow color for Discord API and Config errors', () => {
            // Arrange
            const error = new Error('API Connection Failed');
            error.stack = 'Discord API Error Stack Trace';
            const source = 'TestComponent';

            [ErrorType.DISCORD_API_ERROR, ErrorType.CONFIG_ERROR].forEach(errorType => {
                // Act
                handleError(error, source, { type: errorType });

                // Assert
                expect(logger.warn).toHaveBeenCalledWith(
                    `${errorType}: API Connection Failed at ${source}`,
                );
                expect(logger.log).toHaveBeenCalledWith(
                    'Discord API Error Stack Trace',
                    logger.colors.fg.yellow,
                );
            });
        });

        test('should log context if provided', () => {
            // Arrange
            const context = { userId: '123', action: 'test' };

            // Act
            handleError('Test error', source, { context });

            // Assert
            expect(logger.warn).toHaveBeenCalledWith(
                expect.stringContaining('Error context:'),
            );
        });

        test('should respond to interaction if provided', async () => {
            // Act
            await handleError('Test error', source, { interaction: mockInteraction });

            // Assert
            expect(mockInteraction.reply).toHaveBeenCalled();
        });

        test('should not respond to interaction if silent is true', async () => {
            // Act
            await handleError('Test error', source, {
                interaction: mockInteraction,
                silent: true,
            });

            // Assert
            expect(mockInteraction.reply).not.toHaveBeenCalled();
        });

        test('should use followUp for replied interactions', async () => {
            // Arrange
            mockInteraction.replied = true;

            // Act
            await handleError('Test error', source, { interaction: mockInteraction });

            // Assert
            expect(mockInteraction.followUp).toHaveBeenCalled();
            expect(mockInteraction.reply).not.toHaveBeenCalled();
        });
    });

    describe('withErrorHandling', () => {
        const source = 'TestComponent';

        test('should return result for successful async function', async () => {
            // Arrange
            const successFn = async () => 'success';
            const wrappedFn = withErrorHandling(successFn, source);

            // Act
            const result = await wrappedFn();

            // Assert
            expect(result).toBe('success');
            expect(logger.error).not.toHaveBeenCalled();
            expect(logger.warn).not.toHaveBeenCalled();
        });

        test('should handle errors in async function', async () => {
            // Arrange
            const errorFn = async () => {
                throw new Error('Async error');
            };
            const wrappedFn = withErrorHandling(errorFn, source);

            // Act
            await wrappedFn();

            // Assert
            expect(logger.error).toHaveBeenCalled();
        });

        test('should pass interaction to error handler', async () => {
            // Arrange
            const errorFn = async () => {
                throw new Error('Interaction error');
            };
            const wrappedFn = withErrorHandling(errorFn, source);

            // Act
            await wrappedFn(mockInteraction);

            // Assert
            expect(mockInteraction.reply).toHaveBeenCalled();
        });
    });

    describe('User-friendly error messages', () => {
        test('should return appropriate message for INVALID_INPUT', async () => {
            // Act
            await handleError('Invalid data', 'TestComponent', {
                type: ErrorType.INVALID_INPUT,
                interaction: mockInteraction,
            });

            // Assert
            expect(mockInteraction.reply).toHaveBeenCalledWith(
                expect.objectContaining({
                    content: expect.stringContaining('Ungültige Eingabe'),
                }),
            );
        });

        test('should return appropriate message for PERMISSION_DENIED', async () => {
            // Act
            await handleError('No access', 'TestComponent', {
                type: ErrorType.PERMISSION_DENIED,
                interaction: mockInteraction,
            });

            // Assert
            expect(mockInteraction.reply).toHaveBeenCalledWith(
                expect.objectContaining({
                    content: expect.stringContaining('Keine Berechtigung'),
                }),
            );
        });

        test('should handle Discord API errors appropriately', async () => {
            // Act
            await handleError('API Error', 'TestComponent', {
                type: ErrorType.DISCORD_API_ERROR,
                interaction: mockInteraction,
            });

            // Assert
            expect(mockInteraction.reply).toHaveBeenCalledWith(
                expect.objectContaining({
                    content: expect.stringContaining('Discord-API-Fehler'),
                }),
            );
        });

        test('should return appropriate message for RESOURCE_NOT_FOUND', async () => {
            // Act
            await handleError('Missing resource', 'TestComponent', {
                type: ErrorType.RESOURCE_NOT_FOUND,
                interaction: mockInteraction,
            });

            // Assert
            expect(mockInteraction.reply).toHaveBeenCalledWith(
                expect.objectContaining({
                    content: expect.stringContaining('Ressource nicht gefunden: Missing resource'),
                }),
            );
        });

        test('should return appropriate message for RESOURCE_UNAVAILABLE', async () => {
            // Act
            await handleError('Resource temporarily down', 'TestComponent', {
                type: ErrorType.RESOURCE_UNAVAILABLE,
                interaction: mockInteraction,
            });

            // Assert
            expect(mockInteraction.reply).toHaveBeenCalledWith(
                expect.objectContaining({
                    content: expect.stringContaining('Ressource nicht verfügbar: Resource temporarily down'),
                }),
            );
        });

        test('should return appropriate message for UNKNOWN_COMMAND', async () => {
            // Act
            await handleError('Unknown command error', 'TestComponent', {
                type: ErrorType.UNKNOWN_COMMAND,
                interaction: mockInteraction,
            });

            // Assert
            expect(mockInteraction.reply).toHaveBeenCalledWith(
                expect.objectContaining({
                    content: 'Dieser Befehl ist nicht bekannt. Bitte frage bei einem Administrator nach.',
                }),
            );
        });

        test('should return appropriate message for UNKNOWN_BUTTON', async () => {
            // Act
            await handleError('Unknown button error', 'TestComponent', {
                type: ErrorType.UNKNOWN_BUTTON,
                interaction: mockInteraction,
            });

            // Assert
            expect(mockInteraction.reply).toHaveBeenCalledWith(
                expect.objectContaining({
                    content: 'Dieser Knopf ist nicht bekannt. Bitte frage bei einem Administrator nach.',
                }),
            );
        });

        test('should return appropriate message for UNKNOWN_MODAL', async () => {
            // Act
            await handleError('Unknown modal error', 'TestComponent', {
                type: ErrorType.UNKNOWN_MODAL,
                interaction: mockInteraction,
            });

            // Assert
            expect(mockInteraction.reply).toHaveBeenCalledWith(
                expect.objectContaining({
                    content: 'Dieses Modal ist nicht bekannt. Bitte frage bei einem Administrator nach.',
                }),
            );
        });

        test('should return appropriate message for PLAY_ERROR', async () => {
            // Act
            await handleError('Play error occurred', 'TestComponent', {
                type: ErrorType.PLAY_ERROR,
                interaction: mockInteraction,
            });

            // Assert
            expect(mockInteraction.reply).toHaveBeenCalledWith(
                expect.objectContaining({
                    content: 'Die Cookies des Bots könnten abgelaufen sein. Ein Admin wurde darüber informiert.',
                }),
            );
        });

        const standardErrorTypes = [
            [ErrorType.INTERNAL_ERROR],
            [ErrorType.CONFIG_ERROR],
            [ErrorType.FILE_NOT_CREATED],
            [ErrorType.FILE_NOT_READ],
            [ErrorType.FILE_NULL],
            [ErrorType.FILE_OPERATION_FAILED],
            [ErrorType.UNKNOWN_ERROR],
        ];

        test.each(standardErrorTypes)('should return generic message for %s', async (errorType) => {
            // Act
            await handleError('Unknown error', 'TestComponent', {
                type: errorType,
                interaction: mockInteraction,
            });

            // Assert
            expect(mockInteraction.reply).toHaveBeenCalledWith(
                expect.objectContaining({
                    content: expect.stringContaining('interner Fehler'),
                }),
            );
        });

        test('should return generic message for unknown error types', async () => {
            // Act
            await handleError('Unknown error', 'TestComponent', {
                type: 'NON_EXISTENT_TYPE',
                interaction: mockInteraction,
            });

            // Assert
            expect(mockInteraction.reply).toHaveBeenCalledWith(
                expect.objectContaining({
                    content: expect.stringContaining('interner Fehler'),
                }),
            );
        });
    });

    describe('Error handling failures', () => {
        test('should handle failed interaction replies', async () => {
            // Arrange
            mockInteraction.reply.mockRejectedValue(new Error('Reply failed'));

            // Act
            await handleError('Test error', 'TestComponent', {
                interaction: mockInteraction,
            });

            // Assert
            expect(logger.warn).toHaveBeenCalledWith(
                expect.stringContaining('Failed to reply to interaction'),
            );
        });

        test('should handle failed interaction followUps', async () => {
            // Arrange
            mockInteraction.replied = true;
            mockInteraction.followUp.mockRejectedValue(new Error('FollowUp failed'));

            // Act
            await handleError('Test error', 'TestComponent', {
                interaction: mockInteraction,
            });

            // Assert
            expect(logger.warn).toHaveBeenCalledWith(
                expect.stringContaining('Failed to follow up on interaction'),
            );
        });
    });

    describe('sendAlert', () => {
        let mockAdminChannel;
        let mockAdmin;
        let mockClient;

        // Setup
        beforeEach(() => {
            jest.clearAllMocks();
            jest.resetAllMocks();

            mockAdminChannel = {
                send: jest.fn(),
            };

            mockAdmin = {
                dmChannel: mockAdminChannel,
                createDM: jest.fn().mockResolvedValue(mockAdminChannel),
            };

            mockClient = {
                users: {
                    fetch: jest.fn().mockResolvedValue(mockAdmin),
                },
            };

            mockInteraction = {
                ...mockInteraction,
                client: mockClient,
            };

            buildErrorEmbed.mockReturnValue({ title: 'Test error' });
            getEnv.mockReturnValue('true');
        });

        test('should send alert to admin dm channel', async () => {
            // Act
            await handleError('Test error', 'TestComponent', {
                type: ErrorType.RESOURCE_UNAVAILABLE,
                interaction: mockInteraction,
                context: { userId: '123456789' },
            });

            // Assert
            expect(getEnv).toHaveBeenCalledWith('ENABLE_ALERT', 'false');
            expect(mockClient.users.fetch).toHaveBeenCalled();
            expect(buildErrorEmbed).toHaveBeenCalledWith(
                'Test error',
                [
                    { name: 'Source', value: 'TestComponent', inline: false },
                    { name: 'Timestamp', value: expect.any(String), inline: false },
                    { name: 'Context', value: '{"userId":"123456789"}', inline: false },
                ],
            );
            expect(mockAdminChannel.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    embeds: [expect.any(Object)],
                }),
            );
            expect(mockAdmin.createDM).not.toHaveBeenCalled();
        });

        const invalidContexts = [null, undefined, {}, 'context', 123];

        test.each(invalidContexts)('should not append context if context is invalid', async (context) => {
            // Act
            await handleError('Test error', 'TestComponent', {
                type: ErrorType.RESOURCE_UNAVAILABLE,
                interaction: mockInteraction,
                context: context,
            });

            // Assert
            expect(getEnv).toHaveBeenCalledWith('ENABLE_ALERT', 'false');
            expect(mockClient.users.fetch).toHaveBeenCalled();
            expect(buildErrorEmbed).toHaveBeenCalledWith(
                'Test error',
                [
                    { name: 'Source', value: 'TestComponent', inline: false },
                    { name: 'Timestamp', value: expect.any(String), inline: false },
                ],
            );
            expect(mockAdminChannel.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    embeds: [expect.any(Object)],
                }),
            );
            expect(mockAdmin.createDM).not.toHaveBeenCalled();
        });

        test('should create dm channel if it does not exists', async () => {
            // Arrange
            mockAdmin.dmChannel = null;

            // Act
            await handleError('Test error', 'TestComponent', {
                type: ErrorType.RESOURCE_UNAVAILABLE,
                interaction: mockInteraction,
                context: {},
            });
            await Promise.resolve();

            // Assert
            expect(getEnv).toHaveBeenCalledWith('ENABLE_ALERT', 'false');
            expect(mockClient.users.fetch).toHaveBeenCalled();
            expect(mockAdmin.createDM).toHaveBeenCalled();
            expect(buildErrorEmbed).toHaveBeenCalledWith(
                'Test error',
                [
                    { name: 'Source', value: 'TestComponent', inline: false },
                    { name: 'Timestamp', value: expect.any(String), inline: false },
                ],
            );
            expect(mockAdminChannel.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    embeds: [expect.any(Object)],
                }),
            );
        });

        test('should not send alert if ENABLE_ALERT is false', async () => {
            // Arrange
            getEnv.mockReturnValue('false');

            // Act
            await handleError('Test error', 'TestComponent', {
                type: ErrorType.RESOURCE_UNAVAILABLE,
                interaction: mockInteraction,
                context: {},
            });

            // Assert
            expect(getEnv).toHaveBeenCalledWith('ENABLE_ALERT', 'false');
            expect(mockClient.users.fetch).not.toHaveBeenCalled();
            expect(buildErrorEmbed).not.toHaveBeenCalled();
            expect(mockAdminChannel.send).not.toHaveBeenCalled();
            expect(mockAdmin.createDM).not.toHaveBeenCalled();
        });

        test('should handle error while fetching admin', async () => {
            // Arrange
            mockClient.users.fetch.mockImplementation(() => {
                throw new Error('Failed to fetch admin');
            });
            getAdminUserId.mockReturnValue('123');

            // Act
            await handleError('Test error', 'TestComponent', {
                type: ErrorType.RESOURCE_UNAVAILABLE,
                interaction: mockInteraction,
                context: {},
            });

            // Assert
            expect(getEnv).toHaveBeenCalledWith('ENABLE_ALERT', 'false');
            expect(mockClient.users.fetch).toHaveBeenCalled();
            expect(logger.warn).toHaveBeenCalledWith('Failed to fetch admin user with ID 123: Failed to fetch admin');
            expect(buildErrorEmbed).not.toHaveBeenCalled();
            expect(mockAdminChannel.send).not.toHaveBeenCalled();
            expect(mockAdmin.createDM).not.toHaveBeenCalled();
        });

        test('should handle error while creating dm channel', async () => {
            // Arrange
            mockAdmin.dmChannel = null;
            mockAdmin.createDM.mockImplementation(() => {
                throw new Error('Failed to create dm channel');
            });

            // Act
            await handleError('Test error', 'TestComponent', {
                type: ErrorType.RESOURCE_UNAVAILABLE,
                interaction: mockInteraction,
                context: {},
            });

            // Assert
            expect(getEnv).toHaveBeenCalledWith('ENABLE_ALERT', 'false');
            expect(mockClient.users.fetch).toHaveBeenCalled();
            expect(mockAdmin.createDM).toHaveBeenCalled();
            expect(logger.warn).toHaveBeenCalledWith('Failed to create DM with admin: Failed to create dm channel');
            expect(buildErrorEmbed).not.toHaveBeenCalled();
            expect(mockAdminChannel.send).not.toHaveBeenCalled();
        });

        test('should handle invalid created dm channel', async () => {
            // Arrange
            mockAdmin.dmChannel = null;
            mockAdmin.createDM.mockResolvedValue(null);

            // Act
            await handleError('Test error', 'TestComponent', {
                type: ErrorType.RESOURCE_UNAVAILABLE,
                interaction: mockInteraction,
                context: {},
            });
            await Promise.resolve();

            // Assert
            expect(getEnv).toHaveBeenCalledWith('ENABLE_ALERT', 'false');
            expect(mockClient.users.fetch).toHaveBeenCalled();
            expect(mockAdmin.createDM).toHaveBeenCalled();
            expect(logger.warn).toHaveBeenCalledWith('DM channel could not be created for the admin.');
            expect(buildErrorEmbed).not.toHaveBeenCalled();
            expect(mockAdminChannel.send).not.toHaveBeenCalled();
        });

        test('should handle error while sending alert', async () => {
            // Arrange
            mockAdminChannel.send.mockImplementation(() => {
                throw new Error('Failed to send alert');
            });

            // Act
            await handleError('Test error', 'TestComponent', {
                type: ErrorType.RESOURCE_UNAVAILABLE,
                interaction: mockInteraction,
                context: {},
            });

            // Assert
            expect(getEnv).toHaveBeenCalledWith('ENABLE_ALERT', 'false');
            expect(mockClient.users.fetch).toHaveBeenCalled();
            expect(buildErrorEmbed).toHaveBeenCalledWith(
                'Test error',
                [
                    { name: 'Source', value: 'TestComponent', inline: false },
                    { name: 'Timestamp', value: expect.any(String), inline: false },
                ],
            );
            expect(mockAdminChannel.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    embeds: [expect.any(Object)],
                }),
            );
            expect(logger.error).toHaveBeenCalledWith('Failed to send DM to admin: Failed to send alert');
            expect(mockAdmin.createDM).not.toHaveBeenCalled();
        });
    });
});