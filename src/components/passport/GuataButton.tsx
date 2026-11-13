import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { guataLink } from "@/lib/navigation";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.42.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35M12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.32l-.34-.2-3.57.94.95-3.48-.22-.36a9.4 9.4 0 0 1-1.44-5.01c0-5.2 4.23-9.43 9.44-9.43a9.38 9.38 0 0 1 9.43 9.44c0 5.2-4.24 9.42-9.44 9.42m8.03-17.46A11.28 11.28 0 0 0 12.05.72C5.8.72.7 5.8.7 12.06c0 2 .52 3.95 1.52 5.67L.6 23.28l5.68-1.49a11.3 11.3 0 0 0 5.42 1.38h.01c6.25 0 11.34-5.09 11.35-11.34 0-3.03-1.18-5.88-3.32-8.02" />
    </svg>
  );
}

export function GuataButton() {
  const [stage, setStage] = useState<"hidden" | "typing" | "message">("hidden");
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("guata-bubble-closed")) { setClosed(true); return; }
    const t1 = setTimeout(() => setStage("typing"), 1500);
    const t2 = setTimeout(() => setStage("message"), 3800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const close = () => { setClosed(true); sessionStorage.setItem("guata-bubble-closed", "1"); };

  return (
    <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-2 md:bottom-6">
      {!closed && stage !== "hidden" && (
        <div className="relative max-w-[240px] animate-in fade-in slide-in-from-bottom-2 rounded-2xl rounded-br-sm border bg-card p-3 pr-7 text-sm shadow-elegant">
          <button onClick={close} aria-label="Fechar mensagem" className="absolute right-1.5 top-1.5 rounded-full p-0.5 text-muted-foreground hover:bg-muted"><X className="h-3.5 w-3.5" /></button>
          <p className="text-xs font-bold text-whatsapp">Guatá · Turismo CG</p>
          {stage === "typing" ? (
            <div className="mt-1.5 flex items-center gap-1" aria-label="Guatá está digitando">
              {[0, 150, 300].map((d) => <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: `${d}ms` }} />)}
            </div>
          ) : (
            <a href={guataLink()} target="_blank" rel="noreferrer" className="mt-1 block text-foreground">Oi! Quer uma dica de onde ir em Campo Grande agora? Fale comigo no WhatsApp 🌿</a>
          )}
        </div>
      )}
      <a href={guataLink()} target="_blank" rel="noreferrer" aria-label="Falar com o Guatá no WhatsApp"
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-whatsapp text-whatsapp-foreground shadow-elegant transition hover:scale-105">
        <span className="absolute inset-0 animate-ping rounded-full bg-whatsapp opacity-30" />
        <WhatsAppIcon className="relative h-7 w-7" />
      </a>
    </div>
  );
}
