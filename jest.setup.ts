// Setup file for Jest
// You can add global mocks here
jest.mock('@clerk/nextjs/server', () => ({
    auth: jest.fn(() => ({
        userId: 'test-user-id',
        sessionClaims: { metadata: { role: 'admin' } },
    })),
}));
