import { describe, it, expect } from "vitest";
import { haversineMeters, progressPercent } from "./passport";

describe("passport rules", () => {
  it("haversine: Parque das Nações to Bioparque is under 500m", () => {
    const d = haversineMeters(-20.4532, -54.5826, -20.456, -54.586);
    expect(d).toBeGreaterThan(400);
    expect(d).toBeLessThan(500);
  });
  it("progress: 5 of 9 stamps is 56%", () => {
    expect(progressPercent(5, 9)).toBe(56);
  });
});
