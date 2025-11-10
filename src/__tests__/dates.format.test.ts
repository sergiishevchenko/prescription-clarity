import { formatDate } from "@/lib/dates";

describe("formatDate (uk-UA, UTC)", () => {
  it("formats YYYY-MM-DD deterministically as dd.MM.yyyy", () => {
    expect(formatDate("2025-11-01")).toBe("01.11.2025");
  });

  it("formats ISO strings consistently", () => {
    expect(formatDate("2025-11-01T12:34:56.000Z")).toBe("01.11.2025");
  });
});
