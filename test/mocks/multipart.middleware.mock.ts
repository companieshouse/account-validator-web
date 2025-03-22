jest.mock("../../src/middleware/csrf.middleware", () => ({
    multipartMiddleware: jest.fn(() => (_req: any, _res: any, next: () => void) => {
        next();
    }),
}));
