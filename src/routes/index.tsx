import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ScanLine, Map, Ticket, BookOpen, ArrowRight, Stamp } from "lucide-react";
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

      <section className="mt-8">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-xl font-extrabold">Roteiro oficial</h2>
          <Link to="/atrativos" className="text-sm font-semibold text-primary">Ver todos</Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {attractions.slice(0, 6).map((a, i) => {
            const ok = checkins.some((c) => c.attraction_id === a.id);
            return (
              <Link key={a.id} to="/atrativos/$slug" params={{ slug: a.slug }} className="flex items-center gap-3 rounded-2xl border bg-card p-3 shadow-sm hover:shadow-md">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-extrabold ${ok ? "bg-accent text-accent-foreground" : "bg-secondary text-primary"}`}>{ok ? "✓" : i + 1}</span>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{a.name}</p>
                  <p className="text-xs text-muted-foreground">{CATEGORY_LABEL[a.category]}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}
