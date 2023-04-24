import chai from "chai";
import sinon from "sinon";
import { ArrayBufferRequestClient } from "../../src/http/arraybuffer.request.client";


const expect = chai.expect;

describe("request-client", () => {
    const client = new ArrayBufferRequestClient();

    beforeEach(() => {
        sinon.reset();
        sinon.restore();
    });

    afterEach(done => {
        sinon.reset();
        sinon.restore();
        done();
    });

    it("returns an error response when HTTP GET request fails", async () => {
        const body = { error: "company not found" };
        const statusCode = 404;
        const rejectedValue = {
            status: statusCode,
            body
        };
        const mockRequest = sinon.stub(client, "rawGetArrayBuffer" as any).rejects(rejectedValue).returns(rejectedValue);
        const resp = await client.rawGetArrayBuffer("/foo");
        expect(mockRequest.calledOnce).to.true;
        expect(resp.body).to.deep.equal(body);
        expect(resp.status).to.equal(statusCode);
    });

    it("returns the correct body for successful GET calls", async () => {
        const body = Buffer.from("", 'binary');
        const statusCode = 200;

        const resolvedValue = {
            status: statusCode,
            body,
        };

        const mockRequest = sinon.stub(client, "rawGetArrayBuffer" as any).resolves(resolvedValue);
        const resp = await client.rawGetArrayBuffer("/foo");

        expect(mockRequest.calledOnce).to.true;
        expect(resp.error).to.be.undefined;
        expect(resp.body).to.deep.equal(body);
        expect(resp.status).to.equal(statusCode);
    });

});
