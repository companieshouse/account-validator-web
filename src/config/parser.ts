
/**
 * Parses a file size string and returns the equivalent number of bytes.
 *
 * @param size The file size string to parse. Must be in the format "X[B|KB|MB|GB|TB]", where X is a positive decimal number and the optional unit (B, KB, MB, GB, or TB) indicates the size in bytes, kilobytes, megabytes, gigabytes, or terabytes, respectively.
 * @returns The equivalent number of bytes.
 * @throws {Error} If the file size string is invalid or cannot be parsed.
 */
export function parseFileSize(size: string): number {
    const units = ["B", "KB", "MB", "GB", "TB"];
    const regex = new RegExp(String.raw`^(\d*\.?\d*)(${units.join("|")})$`, "i");
    const matches = new RegExp(regex).exec(size);
    if (!matches) {
        throw new Error(
            `Error parsing file size "${size}". File size must be a positive decimal number followed by one of the following units: B, KB, MB, GB, TB (e.g. "123MB").`
        );
    }

    const [, value, unit] = matches;
    const unitIndex = units.indexOf(unit.toUpperCase());
    return Math.round(Number(value) * Math.pow(1024, unitIndex));
}

/**
 * Parse a duration string into milliseconds.
 * The string can include hours (h), minutes (m), and seconds (s), like "1h", "2m 5s", "15m", "1h34m".
 * This function will return the total duration in milliseconds.
 *
 * @param duration - The duration string to parse.
 * @returns The duration in milliseconds.
 */
export function parseDuration(duration: string): number {

    const maxIterations = 10; // Bound the loop to stop infinite looping.
    const maxIterationsTimeRegex = new RegExp(String.raw`^\s*(?:\d+\s*[hms]\s*){1,${maxIterations}}$`, "i");

    if (maxIterationsTimeRegex.test(duration) === false) {
        throw new Error(`Error parsing duration string [${duration}]. Invalid format.`);
    }

    const durationRegex = /(\d+)([hms])/gi;
    let match: RegExpExecArray | null;
    let milliseconds = 0;

    let iterations = 0;


    while ((match = durationRegex.exec(duration)) !== null) {
        if (++iterations > maxIterations) {
            throw new Error(`Error parsing duration string [${duration}]. Maximum iterations reached.`);
        }

        const value = Number(match[1]);
        const unit = match[2].toLowerCase();

        switch (unit) {
                case "h":
                    milliseconds += value * 60 * 60 * 1000;
                    break;
                case "m":
                    milliseconds += value * 60 * 1000;
                    break;
                case "s":
                    milliseconds += value * 1000;
                    break;
        }
    }

    return milliseconds;
}
