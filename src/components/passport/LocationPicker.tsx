import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Props = { lat: number; lng: number; radius: number; onChange: (lat: number, lng: number) => void };

export default function LocationPicker({ lat, lng, radius, onChange }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const marker = useRef<L.Marker | null>(null);
  const circle = useRef<L.Circle | null>(null);
  const cb = useRef(onChange);
  cb.current = onChange;
  const [q, setQ] = useState("");
  const [results, setResults] = useState<{ display_name: string; lat: string; lon: string }[]>([]);

  useEffect(() => {
    if (!el.current) return;
    const m = L.map(el.current).setView([lat, lng], 16);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap" }).addTo(m);
    const icon = L.divIcon({ className: "", html: `<div style="width:26px;height:26px;border-radius:9999px;background:var(--primary);border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.35)"></div>`, iconSize: [26, 26], iconAnchor: [13, 13] });
    const mk = L.marker([lat, lng], { draggable: true, icon }).addTo(m);
    const c = L.circle([lat, lng], { radius, color: "var(--primary)", fillOpacity: 0.18 }).addTo(m);
    mk.on("drag", () => c.setLatLng(mk.getLatLng()));
    mk.on("dragend", () => { const p = mk.getLatLng(); cb.current(+p.lat.toFixed(6), +p.lng.toFixed(6)); });
    m.on("click", (e: L.LeafletMouseEvent) => { mk.setLatLng(e.latlng); c.setLatLng(e.latlng); cb.current(+e.latlng.lat.toFixed(6), +e.latlng.lng.toFixed(6)); });
    map.current = m; marker.current = mk; circle.current = c;
    return () => { m.remove(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    marker.current?.setLatLng([lat, lng]);
    circle.current?.setLatLng([lat, lng]);
  }, [lat, lng]);
  useEffect(() => { if (radius > 0) circle.current?.setRadius(radius); }, [radius]);

  async function search() {
    if (!q.trim()) return;
    const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=br&q=${encodeURIComponent(q + ", Campo Grande, MS")}`);
    setResults(r.ok ? await r.json() : []);
  }

  return (
    <div className="space-y-2">
      <div className="relative flex gap-2">
        <Input placeholder="Buscar endereço..." value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); search(); } }} />
        <Button type="button" variant="outline" onClick={search} aria-label="Buscar endereço"><Search className="h-4 w-4" /></Button>
        {results.length > 0 && (
          <ul className="absolute left-0 right-12 top-10 z-[1000] max-h-56 overflow-y-auto rounded-md border bg-popover text-sm shadow-lg">
            {results.map((r) => (
              <li key={r.lat + r.lon}><button type="button" className="w-full px-3 py-2 text-left hover:bg-muted" onClick={() => {
                const la = +(+r.lat).toFixed(6), lo = +(+r.lon).toFixed(6);
                cb.current(la, lo); map.current?.setView([la, lo], 17); setResults([]);
              }}>{r.display_name}</button></li>
            ))}
          </ul>
        )}
      </div>
      <div ref={el} className="h-72 w-full overflow-hidden rounded-xl border" />
      <p className="text-xs text-muted-foreground">Arraste o pino ou clique no mapa. O círculo mostra a área onde o check-in por GPS é aceito.</p>
    </div>
  );
}
