import { createFileRoute, Link, useNavigate, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense, useCallback, useMemo, useState } from "react";
import { z } from "zod";
import { MapPin, List, Map as MapIcon, Check } from "lucide-react";
import { AppShell, EmptyState } from "@/components/passport/AppShell";
import { APP_NAME, CATEGORY_LABEL, useAttractions, useAuthUser, useMyCheckins, type Category } from "@/lib/passport";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const AttractionsMap = lazy(() => import("@/components/passport/AttractionsMap"));

export const Route = createFileRoute("/atrativos/")({
  validateSearch: z.object({ view: z.enum(["lista", "mapa"]).optional() }),
  head: () => ({
    meta: [
      { title: `Atrativos de Campo Grande — ${APP_NAME}` },
      { name: "description", content: "Catálogo e mapa dos atrativos oficiais do Passaporte Digital de Campo Grande - MS." },
      { property: "og:title", content: `Atrativos — ${APP_NAME}` },
      { property: "og:description", content: "Parques, museus, feiras e gastronomia da Cidade Morena." },
    ],
  }),
  component: AttractionsPage,
});

function AttractionsPage() {
  const { view = "lista" } = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuthUser();
  const { data = [], isLoading } = useAttractions();
  const { data: checkins = [] } = useMyCheckins(user?.id);
  const [cat, setCat] = useState<Category | "all">("all");
  const cats = useMemo(() => Array.from(new Set(data.map((a) => a.category))), [data]);
  const list = data.filter((a) => cat === "all" || a.category === cat);
  const doneIds = new Set(checkins.map((c) => c.attraction_id));
  const points = useMemo(() => data.map((a) => ({ ...a, latitude: Number(a.latitude), longitude: Number(a.longitude), done: doneIds.has(a.id) })), [data, checkins]); // eslint-disable-line react-hooks/exhaustive-deps
  const onSelect = useCallback((slug: string) => navigate({ to: "/atrativos/$slug", params: { slug } }), [navigate]);

  return (
    <AppShell>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">Atrativos</h1>
        <div className="flex rounded-xl border p-1">
          <Button size="sm" variant={view === "lista" ? "default" : "ghost"} onClick={() => navigate({ to: "/atrativos", search: { view: "lista" } })}><List className="h-4 w-4" />Lista</Button>
          <Button size="sm" variant={view === "mapa" ? "default" : "ghost"} onClick={() => navigate({ to: "/atrativos", search: { view: "mapa" } })}><MapIcon className="h-4 w-4" />Mapa</Button>
        </div>
      </div>

      {view === "mapa" ? (
        <ClientOnly fallback={<div className="h-[60vh] rounded-2xl bg-muted" />}>
          <Suspense fallback={<div className="h-[60vh] rounded-2xl bg-muted" />}>
            <AttractionsMap points={points} onSelect={onSelect} />
          </Suspense>
        </ClientOnly>
      ) : (
        <>
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
            <Button size="sm" variant={cat === "all" ? "default" : "outline"} className="rounded-full" onClick={() => setCat("all")}>Todos</Button>
            {cats.map((c) => (
              <Button key={c} size="sm" variant={cat === c ? "default" : "outline"} className="rounded-full" onClick={() => setCat(c)}>{CATEGORY_LABEL[c]}</Button>
            ))}
          </div>
          {!isLoading && list.length === 0 ? (
            <EmptyState icon={MapPin} title="Nenhum atrativo por aqui" text="Ainda não há atrativos ativos nesta categoria." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((a) => (
                <Link key={a.id} to="/atrativos/$slug" params={{ slug: a.slug }} className="group overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:shadow-md">
                  <div className="relative flex h-36 items-end bg-sunset p-4">
                    {a.cover_image_url && <img src={a.cover_image_url} alt={a.name} className="absolute inset-0 h-full w-full object-cover" />}
                    <span className="relative text-5xl font-extrabold text-primary-foreground/40">{String(a.order_sequence).padStart(2, "0")}</span>
                    {doneIds.has(a.id) && <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-accent px-2 py-1 text-xs font-bold text-accent-foreground"><Check className="h-3 w-3" />Carimbado</span>}
                  </div>
                  <div className="p-4">
                    <Badge variant="secondary">{CATEGORY_LABEL[a.category]}</Badge>
                    <h3 className="mt-2 font-bold group-hover:text-primary">{a.name}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{a.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}
