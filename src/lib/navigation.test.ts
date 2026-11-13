import { describe, it, expect } from "vitest";
import { guataLink, wazeLink, googleMapsLink, applyQuickFilter } from "./navigation";
describe("navigation", () => {
  it("Guatá usa o número oficial", () => expect(guataLink()).toContain("wa.me/556791317630"));
  it("Waze navega direto", () => expect(wazeLink(-20.4, -54.5)).toBe("https://waze.com/ul?ll=-20.4,-54.5&navigate=yes"));
  it("Google Maps abre rota", () => expect(googleMapsLink(-20.4, -54.5)).toContain("destination=-20.4,-54.5"));
  it("gastronomia inclui feira", () => expect(applyQuickFilter([{ category: "feira", slug: "x" }, { category: "parque", slug: "y" }], "gastronomia")).toHaveLength(1));
});
