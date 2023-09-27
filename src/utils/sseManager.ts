import { Response } from "express";

export class SSEManager {
    private response: Response;

    constructor(res: Response) {
        this.response = res;
        this.init();
    }

    private init() {
        this.response.setHeader('Content-Type', 'text/event-stream');
        this.response.setHeader('Cache-Control', 'no-cache');
        this.response.setHeader('Connection', 'keep-alive');
    }

    send(data: any) {
        this.response.write(`data: ${JSON.stringify(data)}\n\n`);
    }

    close() {
        this.response.end();
    }
}
