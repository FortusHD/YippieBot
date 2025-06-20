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

    // Setup
    beforeEach(() => {
        jest.clearAllMocks();
    });

    beforeAll(() => {
        server = start();
    });

    afterAll(() => {
        server.close();
    });

    test('should return false when lavalinkConnected is false', async () => {
        // Arrange
        setLavalinkConnected(false);

        // Act
        const response = await request(server).get('/health');

        // Assert
        expect(response.status).toBe(200);
        expect(response.text).toContain('"lavalink":false');
    });

    test('should return true when lavalinkConnected is true', async () => {
        // Arrange
        setLavalinkConnected(true);

        // Act
        const response = await request(server).get('/health');

        // Assert
        expect(response.status).toBe(200);
        expect(response.text).toContain('"lavalink":true');
    });
});