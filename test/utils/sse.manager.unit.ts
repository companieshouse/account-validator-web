import { SSEManager, SSECloseError, SSEWriteError } from '../../src/utils/sse.manager';
import { UI_UPDATE_TIMEOUT_MS } from "../../src/config";

describe('SSEManager', () => {
    let mockSocket: any, mockRes: any;

    beforeEach(() => {
        mockSocket = {
            setTimeout: jest.fn(),
            setNoDelay: jest.fn(),
            setKeepAlive: jest.fn(),
        };

        mockRes = {
            setHeader: jest.fn(),
            write: jest.fn(),
            end: jest.fn(),
        };
    });

    it('should initialize correctly', () => {
        const manager = new SSEManager(mockRes);
        manager.initialize(mockSocket);

        expect(mockSocket.setTimeout).toHaveBeenCalledWith(UI_UPDATE_TIMEOUT_MS);
        expect(mockSocket.setNoDelay).toHaveBeenCalledWith(true);
        expect(mockSocket.setKeepAlive).toHaveBeenCalledWith(true);

        expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream');
        expect(mockRes.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache');
        expect(mockRes.setHeader).toHaveBeenCalledWith('Connection', 'keep-alive');
    });

    it('should send data correctly', () => {
        const manager = new SSEManager(mockRes);
        const testData = { message: 'test' };

        manager.send(testData);

        expect(mockRes.write).toHaveBeenCalledWith(`data: ${JSON.stringify(testData)}\n\n`);
    });

    it('should throw SSEWriteError on send failure', () => {
        const manager = new SSEManager(mockRes);
        const testData = { message: 'test' };
        const testErrorMessage = 'Write failed';

        mockRes.write.mockImplementationOnce(() => {
            throw new Error(testErrorMessage);
        });

        expect(() => manager.send(testData)).toThrow(SSEWriteError);

        mockRes.write.mockImplementationOnce(() => {
            throw new Error(testErrorMessage);
        });

        expect(() => manager.send(testData)).toThrowError(`Failed to write data to SSE: ${testErrorMessage}`);
    });

    it('should close connection correctly', () => {
        const manager = new SSEManager(mockRes);

        manager.close();

        expect(mockRes.end).toHaveBeenCalled();
    });

    it('should throw SSECloseError on close failure', () => {
        const manager = new SSEManager(mockRes);
        const testErrorMessage = 'Close failed';

        mockRes.end.mockImplementationOnce(() => {
            throw new Error(testErrorMessage);
        });

        expect(() => manager.close()).toThrow(SSECloseError);

        mockRes.end.mockImplementationOnce(() => {
            throw new Error(testErrorMessage);
        });

        expect(() => manager.close()).toThrowError(`Failed to close SSE connection: ${testErrorMessage}`);
    });
});
