import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ScanLine, Map, Ticket, BookOpen, ArrowRight, Stamp, MessageCircle, Route as RouteIcon } from "lucide-react";
import { QUICK_FILTERS, applyQuickFilter, guataLink, type QuickFilter } from "@/lib/navigation";
import { RouteButtons } from "@/components/passport/RouteButtons";
import { AppShell } from "@/components/passport/AppShell";
import { APP_NAME, CATEGORY_LABEL, progressPercent, useAttractions, useAuthUser, useMyCheckins } from "@/lib/passport";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${APP_NAME} — Passaporte Digital Turístico de Campo Grande - MS` },
      { name: "description", content: "Explore a Cidade Morena, carimbe seu passaporte digital nos 9 atrativos oficiais e ganhe 10% de desconto." },
      { property: "og:title", content: `${APP_NAME} — Passaporte Digital` },
      { property: "og:description", content: "Explore Campo Grande, carimbe seu passaporte e ganhe recompensas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const { user } = useAuthUser();
  const navigate = useNavigate();
  const { data: attractions = [] } = useAttractions();
  const { data: checkins = [] } = useMyCheckins(user?.id);
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("profiles").select("full_name").eq("id", user!.id).maybeSingle()).data,
  });

  const [filter, setFilter] = useState<QuickFilter>("todos");
  const { data: routes = [] } = useQuery({
    queryKey: ["routes"],
    queryFn: async () => (await supabase.from("thematic_routes").select("id,title,description,estimated_duration,cover_image_url,route_checkpoints(attraction_id)").eq("is_active", true).order("order_sequence")).data ?? [],
  });

  useEffect(() => {
    if (!user) return;
    const p = sessionStorage.getItem("post-auth");
    if (p && p.startsWith("/") && !p.startsWith("//")) { sessionStorage.removeItem("post-auth"); navigate({ to: p }); }
  }, [user, navigate]);

  const done = checkins.length;
  const total = attractions.length;
  const pct = progressPercent(done, total);
  const first = (profile?.full_name ?? user?.email ?? "").split(" ")[0];

  return (
    <AppShell>
      <section className="relative overflow-hidden rounded-3xl bg-sunset p-6 text-primary-foreground shadow-elegant sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-widest opacity-90">Cidade Morena · MS</p>
        <h1 className="mt-2 text-3xl font-extrabold leading-tight sm:text-5xl">
          {user ? `Olá, ${first}!` : APP_NAME}
        </h1>
        <p className="mt-2 max-w-xl opacity-95">
          {user ? "Continue sua jornada pelos atrativos oficiais de Campo Grande." : "Seu Passaporte Digital Turístico: visite, carimbe e ganhe recompensas exclusivas na cidade."}
        </p>
        {user ? (
          <div className="mt-6 max-w-md rounded-2xl bg-background/15 p-4 backdrop-blur">
            <div className="flex justify-between text-sm font-semibold"><span>{done} de {total} atrativos carimbados</span><span>{pct}%</span></div>
            <Progress value={pct} className="mt-2 h-2.5 bg-background/30 [&>div]:bg-primary-foreground" />
          </div>
        ) : (
          <Button asChild size="lg" variant="secondary" className="mt-6"><Link to="/auth">Começar meu passaporte <ArrowRight className="h-4 w-4" /></Link></Button>
        )}
        <Stamp className="pointer-events-none absolute -right-6 -bottom-6 h-44 w-44 rotate-12 opacity-15" />
      </section>

      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { to: "/escanear", label: "Escanear QR Code", icon: ScanLine },
          { to: "/atrativos", label: "Ver Mapa", icon: Map, search: { view: "mapa" } },
          { to: "/passaporte", label: "Meu Passaporte", icon: BookOpen },
          { to: "/vouchers", label: "Meus Vouchers", icon: Ticket },
        ].map((a) => (
          <Link key={a.label} to={a.to} search={a.search as never} className="flex flex-col items-start gap-3 rounded-2xl border bg-card p-4 shadow-sm transition hover:shadow-md">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary"><a.icon className="h-5 w-5" /></span>
            <span className="text-sm font-bold">{a.label}</span>
          </Link>
        ))}
      </section>

      <a href={guataLink()} target="_blank" rel="noreferrer" className="mt-6 flex items-center gap-4 rounded-2xl border border-accent/30 bg-accent/10 p-4 shadow-sm hover:shadow-md">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground"><MessageCircle className="h-6 w-6" /></span>
        <div className="min-w-0 flex-1">
          <p className="font-bold">Dúvidas sobre a cidade? Fale com o Guatá</p>
          <p className="text-sm text-muted-foreground">Atendimento oficial de turismo de Campo Grande no WhatsApp.</p>
        </div>
        <ArrowRight className="h-5 w-5 text-accent" />
      </a>

      <section className="mt-8">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-xl font-extrabold">O que você quer fazer agora?</h2>
          <Link to="/atrativos" className="text-sm font-semibold text-primary">Ver todos</Link>
        </div>
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {QUICK_FILTERS.map((f) => (
            <button key={f.id} onClick={() => setFilter(f.id)} className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${filter === f.id ? "border-primary bg-primary text-primary-foreground" : "bg-card text-foreground hover:bg-muted"}`}>{f.label}</button>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {applyQuickFilter(attractions, filter).map((a) => {
            const ok = checkins.some((c) => c.attraction_id === a.id);
            return (
              <div key={a.id} className="min-w-0 overflow-hidden rounded-2xl border bg-card p-3 shadow-sm hover:shadow-md">
                <Link to="/atrativos/$slug" params={{ slug: a.slug }} className="flex items-center gap-3">
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-extrabold ${ok ? "bg-accent text-accent-foreground" : "bg-secondary text-primary"}`}>{ok ? "✓" : a.order_sequence}</span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{a.name}</p>
                    <p className="text-xs text-muted-foreground">{CATEGORY_LABEL[a.category]}</p>
                  </div>
                </Link>
                <div className="mt-3"><RouteButtons size="sm" lat={Number(a.latitude)} lng={Number(a.longitude)} /></div>
              </div>
            );
          })}
        </div>
      </section>

      {routes.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-xl font-extrabold">Rotas temáticas</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {routes.map((r) => {
              const ids = (r.route_checkpoints ?? []).map((c) => c.attraction_id);
              const doneR = ids.filter((id) => checkins.some((c) => c.attraction_id === id)).length;
              const p = progressPercent(doneR, ids.length);
              return (
                <div key={r.id} className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                  {r.cover_image_url ? <img src={r.cover_image_url} alt={r.title} className="h-28 w-full object-cover" /> : <div className="flex h-28 items-center justify-center bg-sunset text-primary-foreground"><RouteIcon className="h-8 w-8" /></div>}
                  <div className="p-4">
                    <p className="font-bold">{r.title}</p>
                    {r.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{r.description}</p>}
                    <p className="mt-2 text-xs text-muted-foreground">{ids.length} pontos{r.estimated_duration ? ` · ${r.estimated_duration}` : ""}</p>
                    {user && <><div className="mt-2 flex justify-between text-xs font-semibold"><span>{doneR}/{ids.length}</span><span>{p}%</span></div><Progress value={p} className="mt-1 h-2" /></>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </AppShell>
  );
}
