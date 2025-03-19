jest.mock("../../src/middleware/csrf.middleware", () => ({
    multipartMiddleware: jest.fn(() => (req, res, next) => {
        next();
    }),
}));
