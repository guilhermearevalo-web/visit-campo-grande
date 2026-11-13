export const GUATA_PHONE = "556791317630";
export const GUATA_MESSAGE = "Olá, Guatá! Estou navegando pelo VISIT CAMPO GRANDE e gostaria de dicas sobre a cidade.";
export const guataLink = (msg = GUATA_MESSAGE) => `https://wa.me/${GUATA_PHONE}?text=${encodeURIComponent(msg)}`;
export const googleMapsLink = (lat: number, lng: number) => `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
export const wazeLink = (lat: number, lng: number) => `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;

export type QuickFilter = "todos" | "rapidos" | "ar-livre" | "gastronomia" | "cultura";
export const QUICK_FILTERS: { id: QuickFilter; label: string; categories?: string[]; slugs?: string[] }[] = [
  { id: "todos", label: "Todos" },
  { id: "rapidos", label: "Passeios rápidos no centro", categories: ["historico"], slugs: ["mercadao", "casa-do-artesao"] },
  { id: "ar-livre", label: "Ao ar livre", categories: ["parque", "natureza"] },
  { id: "gastronomia", label: "Gastronomia típica", categories: ["gastronomia", "feira"] },
  { id: "cultura", label: "História e cultura", categories: ["historico", "museu", "cultural"] },
];
export function applyQuickFilter<T extends { category: string; slug: string }>(list: T[], f: QuickFilter): T[] {
  const def = QUICK_FILTERS.find((q) => q.id === f);
  if (!def || f === "todos") return list;
  return list.filter((a) => def.categories?.includes(a.category) || def.slugs?.some((s) => a.slug.includes(s)));
}
