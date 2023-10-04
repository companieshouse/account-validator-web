import { UI_UPDATE_TIMEOUT_MS } from "../config";

interface Socket {
    setTimeout(ms: number): void;
    setNoDelay(isNoDelay: boolean): void;
    setKeepAlive(isKeepAlive: boolean): void;
}

interface Response {
    setHeader(name: string, value: string): void;
    write(chunk: string): boolean;
    end(): void;
}

export class SSEWriteError extends Error {
    public originalError: Error;

    constructor(message: string, originalError: Error) {
        super(message);
        this.name = 'SSEWriteError';
        this.originalError = originalError;
    }
}

export class SSECloseError extends Error {
    public originalError: Error;

    constructor(message: string, originalError: Error) {
        super(message);
        this.name = 'SSECloseError';
        this.originalError = originalError;
    }
}

export class SSEManager {
    private response: Response;

    constructor(res: Response) {
        this.response = res;
    }

    public initialize(socket: Socket): void {
        socket.setTimeout(UI_UPDATE_TIMEOUT_MS);
        socket.setNoDelay(true);
        socket.setKeepAlive(true);

        this.response.setHeader('Content-Type', 'text/event-stream');
        this.response.setHeader('Cache-Control', 'no-cache');
        this.response.setHeader('Connection', 'keep-alive');
    }

    public send(data: object): void {
        try {
            this.response.write(`data: ${JSON.stringify(data)}\n\n`);
        } catch (error) {
            throw new SSEWriteError(`Failed to write data to SSE: ${error.message ?? error}`, error);
        }
    }

    public close(): void {
        try {
            if (this.response) {this.response.end();}
        } catch (error) {
            throw new SSECloseError(`Failed to close SSE connection: ${error.message ?? error}`, error);
        }
    }
}
