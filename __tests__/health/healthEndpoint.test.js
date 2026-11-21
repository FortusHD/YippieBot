// Imports
const request = require('supertest');
const { start, setLavalinkConnected } = require('../../src/health/healthEndpoint');

// Mock
jest.mock('../../src/logging/logger', () => ({
    info: jest.fn(),
    debug: jest.fn(),
}));

describe('healthEndpoint', () => {
    let server;
    const client = { isReady: jest.fn() };

    // Setup
    beforeEach(() => {
        jest.clearAllMocks();
        client.isReady.mockReturnValue(true);
    });

    beforeAll(() => {
        server = start(client);
    });

    afterAll(() => {
        server.close();
    });

    test('should still return 200 when lavalinkConnected is false', async () => {
        // Arrange
        setLavalinkConnected(false);

        // Act
        const response = await request(server).get('/health');

        // Assert
        expect(response.status).toBe(200);
        expect(response.body.lavalink).toBe(false);
        expect(response.body.discord).toBe(true);
    });

    test('should return 200 when lavalinkConnected is true and the client is ready', async () => {
        // Arrange
        setLavalinkConnected(true);

        // Act
        const response = await request(server).get('/health');

        // Assert
        expect(response.status).toBe(200);
        expect(response.body.lavalink).toBe(true);
        expect(response.body.discord).toBe(true);
    });

    test('should return 503 when the discord client is not ready', async () => {
        // Arrange
        setLavalinkConnected(true);
        client.isReady.mockReturnValue(false);

        // Act
        const response = await request(server).get('/health');

        // Assert
        expect(response.status).toBe(503);
        expect(response.body.discord).toBe(false);
    });
});
