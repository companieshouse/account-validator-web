jest.mock("ioredis");

import request from "supertest";
import app from "../../src/app";

describe("Basic URL Tests", () => {

  it("should find the accessibility statement page", async () => {
    const response = await request(app)
      .get("/confirmation-statement/accessibility-statement");

    expect(response.text).toContain("Accessibility statement for the File a confirmation statement service");
  });

});
