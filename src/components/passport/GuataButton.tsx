import { MessageCircle } from "lucide-react";
import { guataLink } from "@/lib/navigation";

export function GuataButton() {
  return (
    <a href={guataLink()} target="_blank" rel="noreferrer" aria-label="Falar com o Guatá no WhatsApp"
      className="fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-full bg-accent px-4 py-3 text-sm font-bold text-accent-foreground shadow-elegant transition hover:scale-105 md:bottom-6">
      <MessageCircle className="h-5 w-5" /><span>Guatá</span>
    </a>
  );
}
