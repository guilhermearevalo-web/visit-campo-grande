import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

type P = { id: string; name: string; slug: string; latitude: number; longitude: number; done?: boolean };

export default function AttractionsMap({ points, onSelect }: { points: P[]; onSelect: (slug: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const map = L.map(ref.current).setView([-20.459, -54.603], 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap" }).addTo(map);
    points.forEach((p, i) => {
      const icon = L.divIcon({
        className: "",
        html: `<div style="width:30px;height:30px;border-radius:9999px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;color:white;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3);background:${p.done ? "var(--accent)" : "var(--primary)"}">${i + 1}</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });
      L.marker([Number(p.latitude), Number(p.longitude)], { icon })
        .addTo(map)
        .bindTooltip(p.name)
        .on("click", () => onSelect(p.slug));
    });
    return () => {
      map.remove();
    };
  }, [points, onSelect]);
  return <div ref={ref} className="h-[60vh] w-full overflow-hidden rounded-2xl border" />;
}
