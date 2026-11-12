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

import { routeProgress } from "./passport";
describe("thematic routes", () => {
  const ck = (id: string, t: string) => ({ attraction_id: id, created_at: t });
  it("free route: 2 of 3 visited in any order is 67%", () => {
    const r = routeProgress(["a", "b", "c"], [ck("c", "2026-01-01"), ck("a", "2026-01-02")], "free");
    expect(r.done).toBe(2);
    expect(r.pct).toBe(67);
    expect(r.complete).toBe(false);
  });
  it("free route: all visited is complete", () => {
    expect(routeProgress(["a", "b"], [ck("b", "2026-01-01"), ck("a", "2026-01-02")], "free").complete).toBe(true);
  });
  it("sequential route: out-of-order visits do not complete the route", () => {
    const r = routeProgress(["a", "b"], [ck("b", "2026-01-01"), ck("a", "2026-01-02")], "sequential");
    expect(r.done).toBe(1);
    expect(r.complete).toBe(false);
    expect(r.nextId).toBe("b");
  });
  it("sequential route: in-order visits complete the route", () => {
    expect(routeProgress(["a", "b"], [ck("a", "2026-01-01"), ck("b", "2026-01-02")], "sequential").complete).toBe(true);
  });
});
