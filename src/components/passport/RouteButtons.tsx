import { Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { googleMapsLink, wazeLink } from "@/lib/navigation";

export function RouteButtons({ lat, lng, size = "default" }: { lat: number; lng: number; size?: "default" | "sm" }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild size={size} variant="outline"><a href={googleMapsLink(lat, lng)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}><Navigation className="h-4 w-4" />Google Maps</a></Button>
      <Button asChild size={size} variant="outline"><a href={wazeLink(lat, lng)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}><Navigation className="h-4 w-4" />Waze</a></Button>
    </div>
  );
}
