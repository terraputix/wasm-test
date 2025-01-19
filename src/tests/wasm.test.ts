import { describe, it, expect } from "vitest";
import { initWasm } from "../index";

describe("initWasm", () => {
  it("should not throw when initialized", () => {
    expect(async () => {
      await initWasm();
    }).not.toThrow();
  });
});
