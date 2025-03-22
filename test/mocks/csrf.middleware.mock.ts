jest.mock("../../src/middleware/csrf.middleware", () => ({
    createCsrfProtectionMiddleware: jest.fn(() => (_req: any, _res: any, next: () => void) => {
        next();
    }),
    csrfErrorHandler: (err: any, _req: any, _res: any, next: (error?: any ) => void) => {
        next(err);
    },
}));
