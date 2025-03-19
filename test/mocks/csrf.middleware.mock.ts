jest.mock("../../src/middleware/csrf.middleware", () => ({
    createCsrfProtectionMiddleware: jest.fn(() => (req, res, next) => {
        next();
    }),
    csrfErrorHandler: (err, req, res, next) => {
        next(err);
    },
}));
