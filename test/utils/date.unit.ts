jest.mock("../../src/utils/logger");

import { isInFuture, toReadableFormat, toReadableFormatMonthYear } from "../../src/utils/date";
import { createAndLogError } from "../../src/utils/logger";
import { Settings as luxonSettings } from "luxon";

const mockCreateAndLogError = createAndLogError as jest.Mock;
mockCreateAndLogError.mockReturnValue(new Error());

const today = "2020-04-25";

describe("Date tests", () => {

  beforeEach(() => {
    jest.clearAllMocks();
    luxonSettings.now = () => new Date(today).valueOf();
  });

  describe("toReadableFormat tests", () => {
    it("Should return a human readable date from hyphanated-date string", () => {
      const dateString = "2019-03-01";
      const date = toReadableFormat(dateString);

      expect(date).toEqual("1 March 2019");
    });

    it("Should return a human readable date from local string", () => {
      const dateString = "March 18, 2019";
      const date = toReadableFormat(dateString);

      expect(date).toEqual("18 March 2019");
    });

    it("Should return empty string if date is undefined", () => {
      const input = undefined as unknown as string;
      const date = toReadableFormat(input);

      expect(date).toEqual("");
    });

    it("Should return empty string if date is null", () => {
      const input = null as unknown as string;
      const date = toReadableFormat(input);

      expect(date).toEqual("");
    });

    it("Should return empty string if date is empty string", () => {
      const input = "";
      const date = toReadableFormat(input);

      expect(date).toEqual("");
    });

    it("Should log and throw an error", () => {
      const badDate = "12345/44/44";

      try {
        toReadableFormat(badDate);
        fail();
      } catch (e) {
        expect(mockCreateAndLogError).toHaveBeenCalledWith(expect.stringContaining(badDate));
      }
    });
  });

  describe("isInFuture tests", () => {
    it("Should return true for future date", () => {
      expect(isInFuture("2020-06-20")).toBeTruthy();
    });

    it("Should return false for today's date", () => {
      expect(isInFuture(today)).toBeFalsy();
    });

    it("Should return false for today's date with added hours", () => {
      expect(isInFuture("2020-04-25T14:00")).toBeFalsy();
    });

    it("Should return false for past date", () => {
      expect(isInFuture("2020-03-24")).toBeFalsy();
    });

    it("Should return false for undefined", () => {
      expect(isInFuture(undefined as unknown as string)).toBeFalsy();
    });

    it("Should return false for empty string", () => {
      expect(isInFuture("")).toBeFalsy();
    });

    it("Should return false for non date string", () => {
      expect(isInFuture("house")).toBeFalsy();
    });
  });

  describe("toReadableFormatMonthYear tests", () => {
    it("Should return readdable string", () => {
      expect(toReadableFormatMonthYear(1, 1965)).toBe("January 1965");
      expect(toReadableFormatMonthYear(12, 2006)).toBe("December 2006");
    });

    it("Should log and throw an error for invalid month", () => {
      const badMonth = 0;

      try {
        toReadableFormatMonthYear(badMonth, 1975);
        fail();
      } catch (e) {
        expect(mockCreateAndLogError).toHaveBeenCalledWith(expect.stringContaining(badMonth.toString()));
      }
    });
  });
});
