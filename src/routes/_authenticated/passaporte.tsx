import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock, Share2, Stamp } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/passport/AppShell";
import { APP_NAME, CATEGORY_LABEL, progressPercent, useAttractions, useAuthUser, useMyCheckins } from "@/lib/passport";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/passaporte")({
  head: () => ({
    meta: [
      { title: `Meu Passaporte — ${APP_NAME}` },
      { name: "description", content: "Seus carimbos do Passaporte Digital Turístico de Campo Grande." },
      { property: "og:title", content: `Meu Passaporte — ${APP_NAME}` },
      { property: "og:description", content: "Veja os carimbos conquistados em Campo Grande - MS." },
    ],
  }),
  component: Passport,
});

function Passport() {
  const { user } = useAuthUser();
  const { data: attractions = [] } = useAttractions();
  const { data: checkins = [] } = useMyCheckins(user?.id);
  const pct = progressPercent(checkins.length, attractions.length);

  async function share() {
    const text = `Já carimbei ${checkins.length} de ${attractions.length} atrativos no ${APP_NAME}! 🧡`;
    try {
      if (navigator.share) await navigator.share({ title: APP_NAME, text, url: window.location.origin });
      else { await navigator.clipboard.writeText(`${text} ${window.location.origin}`); toast.success("Texto copiado para compartilhar!"); }
    } catch { /* cancelled */ }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl rounded-3xl border-2 border-primary/30 bg-card p-5 shadow-md sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dashed pb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">República Federativa do Turismo</p>
            <h1 className="text-2xl font-extrabold">Passaporte · Campo Grande MS</h1>
          </div>
          <Button variant="outline" onClick={share}><Share2 className="h-4 w-4" />Compartilhar</Button>
        </div>
        <div className="my-5">
          <div className="flex justify-between text-sm font-semibold"><span>{checkins.length} de {attractions.length} carimbos</span><span>{pct}%</span></div>
          <Progress value={pct} className="mt-2 h-2.5" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {attractions.map((a, i) => {
            const c = checkins.find((x) => x.attraction_id === a.id);
            return (
              <Link key={a.id} to="/atrativos/$slug" params={{ slug: a.slug }} className="flex flex-col items-center text-center">
                <div
                  className={`relative aspect-square w-full max-w-[140px] overflow-hidden rounded-full border-[5px] border-double ${c ? "border-primary" : "border-stamp-empty"}`}
                  style={c ? { transform: `rotate(${(i % 3) * 7 - 7}deg)` } : undefined}
                >
                  {a.cover_image_url ? (
                    <img src={a.cover_image_url} alt={a.name} loading="lazy" className={`h-full w-full object-cover transition ${c ? "" : "opacity-40 grayscale"}`} />
                  ) : (
                    <div className={`flex h-full w-full items-center justify-center ${c ? "text-primary" : "text-stamp-empty"}`}><Stamp className="h-8 w-8" /></div>
                  )}
                  <div className={`absolute inset-x-0 bottom-0 px-1 pb-2 pt-4 text-center ${a.cover_image_url ? "bg-gradient-to-t from-foreground/80 to-transparent text-background" : ""}`}>
                    <p className="text-[10px] font-extrabold uppercase leading-tight">{c ? "Visitado" : CATEGORY_LABEL[a.category]}</p>
                    {c && <p className="text-[10px] font-semibold">{new Date(c.created_at).toLocaleDateString("pt-BR")}</p>}
                  </div>
                  {!c && <Lock className="absolute right-1/2 top-1/3 h-5 w-5 translate-x-1/2 text-muted-foreground" />}
                </div>
                <p className={`mt-2 text-xs font-semibold ${c ? "" : "text-muted-foreground"}`}>{a.name}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
