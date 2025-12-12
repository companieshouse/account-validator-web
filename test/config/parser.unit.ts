import { parseFileSize, parseDuration } from '../../src/config/parser';

describe('config/parser', () => {
    describe('parseFileSize', () => {
        test('parses bytes', () => {
            expect(parseFileSize('123B')).toBe(123);
        });

        test('parses kilobytes', () => {
            expect(parseFileSize('1KB')).toBe(1024);
            expect(parseFileSize('1.5KB')).toBe(Math.round(1.5 * 1024));
        });

        test('parses megabytes', () => {
            expect(parseFileSize('2MB')).toBe(2 * 1024 * 1024);
        });

        test('parses gigabytes', () => {
            expect(parseFileSize('3GB')).toBe(3 * Math.pow(1024, 3));
        });

        test('parses terabytes', () => {
            expect(parseFileSize('0.5TB')).toBe(Math.round(0.5 * Math.pow(1024, 4)));
        });

        test('is case-insensitive for units', () => {
            expect(parseFileSize('1kb')).toBe(1024);
            expect(parseFileSize('2mB')).toBe(2 * 1024 * 1024);
        });

        test('throws when missing unit', () => {
            expect(() => parseFileSize('123')).toThrow();
        });

        test('throws when number is invalid', () => {
            expect(() => parseFileSize('abcMB')).toThrow();
        });

        test('throws when unit is unrecognized', () => {
            expect(() => parseFileSize('12XB')).toThrow();
        });

        test('throws on empty input', () => {
            expect(() => parseFileSize('')).toThrow();
        });
    });

    describe('parseDuration', () => {
        test('parses seconds only', () => {
            expect(parseDuration('30s')).toBe(30 * 1000);
        });

        test('parses minutes only', () => {
            expect(parseDuration('2m')).toBe(2 * 60 * 1000);
        });

        test('parses hours only', () => {
            expect(parseDuration('1h')).toBe(60 * 60 * 1000);
        });

        test('parses combined values', () => {
            expect(parseDuration('1h2m3s')).toBe((1 * 60 * 60 + 2 * 60 + 3) * 1000);
            expect(parseDuration('2m 5s')).toBe((2 * 60 + 5) * 1000);
        });

        test('ignores unknown tokens and returns 0 for empty', () => {
            expect(parseDuration('')).toBe(0);
            expect(parseDuration('xyz')).toBe(0);
        });

        test('handles multiple occurrences of same unit', () => {
            expect(parseDuration('1m2m')).toBe(3 * 60 * 1000);
        });

        test('throws if loop runs too many iterations', () => {
            // Build a string with many small tokens to exceed the maxIterations (10)
            const parts = '1s'.repeat(12);
            expect(() => parseDuration(parts)).toThrow(/Maximum iterations reached/);
        });

        test('accepts uppercase units when case-insensitive', () => {
            // Uppercase units should be accepted if parser is case-insensitive.
            expect(parseDuration('1H')).toBe(60 * 60 * 1000);
        });

        test('decimal values cause regex to match integer adjacent to unit', () => {
            expect(() => parseDuration('1.5h')).toThrow(/Decimal values are not supported/);
        });

        test('leading zeros parsed correctly', () => {
            expect(parseDuration('01m')).toBe(1 * 60 * 1000);
        });
    });
});
