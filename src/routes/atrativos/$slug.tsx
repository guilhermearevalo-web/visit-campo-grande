import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock, MapPin, Phone, Instagram, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, EmptyState } from "@/components/passport/AppShell";
import { RouteButtons } from "@/components/passport/RouteButtons";
import { CheckinPanel } from "@/components/passport/CheckinPanel";
import { APP_NAME, ATTR_COLS, CATEGORY_LABEL, useAuthUser, useMyCheckins } from "@/lib/passport";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/atrativos/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug.replace(/-/g, " ")} — ${APP_NAME}` },
      { name: "description", content: "Conheça este atrativo oficial e carimbe seu Passaporte Digital de Campo Grande." },
      { property: "og:title", content: `Atrativo — ${APP_NAME}` },
      { property: "og:description", content: "Visite e registre seu carimbo no passaporte digital." },
    ],
  }),
  component: AttractionPage,
});

function AttractionPage() {
  const { slug } = Route.useParams();
  const { user } = useAuthUser();
  const { data: a, isLoading } = useQuery({
    queryKey: ["attraction", slug],
    queryFn: async () => (await supabase.from("attractions").select(ATTR_COLS).eq("slug", slug).maybeSingle()).data,
  });
  const { data: checkins = [] } = useMyCheckins(user?.id);

  if (isLoading) return <AppShell><div className="h-64 animate-pulse rounded-2xl bg-muted" /></AppShell>;
  if (!a) return <AppShell><EmptyState icon={MapPin} title="Atrativo não encontrado" text="Este local não existe ou foi desativado." action={<Button asChild><Link to="/atrativos">Ver atrativos</Link></Button>} /></AppShell>;

  return (
    <AppShell>
      <Link to="/atrativos" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" />Atrativos</Link>
      <div className="relative mb-6 flex h-56 items-end overflow-hidden rounded-3xl bg-sunset p-6 shadow-elegant">
        {a.cover_image_url && <img src={a.cover_image_url} alt={a.name} className="absolute inset-0 h-full w-full object-cover" />}
        <div className="relative text-primary-foreground">
          <Badge className="bg-background/25 text-primary-foreground">{CATEGORY_LABEL[a.category]}</Badge>
          <h1 className="mt-2 text-3xl font-extrabold">{a.name}</h1>
        </div>
      </div>
      {a.gallery_urls?.length > 0 && (
        <div className="mb-6 flex gap-3 overflow-x-auto">{a.gallery_urls.map((u) => <img key={u} src={u} alt="" className="h-28 w-40 shrink-0 rounded-xl object-cover" />)}</div>
      )}
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <p className="text-lg leading-relaxed">{a.description}</p>
          {a.history && <div><h2 className="mb-1 font-bold">História</h2><p className="text-muted-foreground">{a.history}</p></div>}
          <ul className="space-y-2 text-sm">
            {a.address && <li className="flex gap-2"><MapPin className="h-4 w-4 text-primary" />{a.address}</li>}
            {a.opening_hours && <li className="flex gap-2"><Clock className="h-4 w-4 text-primary" />{a.opening_hours}</li>}
            {a.contact_phone && <li className="flex gap-2"><Phone className="h-4 w-4 text-primary" />{a.contact_phone}</li>}
            {a.instagram && <li className="flex gap-2"><Instagram className="h-4 w-4 text-primary" />{a.instagram}</li>}
            {a.website && <li className="flex gap-2"><Globe className="h-4 w-4 text-primary" /><a href={a.website} target="_blank" rel="noreferrer" className="underline">{a.website}</a></li>}
          </ul>
          <div><h2 className="mb-2 font-bold">Como chegar</h2><RouteButtons lat={Number(a.latitude)} lng={Number(a.longitude)} /></div>
        </div>
        <CheckinPanel attraction={a} loggedIn={!!user} done={checkins.some((c) => c.attraction_id === a.id)} />
      </div>
    </AppShell>
  );
}
