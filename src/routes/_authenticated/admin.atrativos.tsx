import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { lazy, Suspense, useState } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { ImageUpload } from "@/components/passport/ImageUpload";

const LocationPicker = lazy(() => import("@/components/passport/LocationPicker"));
const RADII = [50, 100, 150, 300, 500];
import { Plus, Pencil, Printer, MapPin } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState } from "@/components/passport/AppShell";
import { ATTR_COLS, CATEGORY_LABEL, DESTINATION_SLUG, type Category } from "@/lib/passport";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/admin/atrativos")({ component: AdminAttractions });

const EMPTY = { name: "", slug: "", category: "parque", description: "", history: "", address: "", latitude: -20.4628, longitude: -54.6141, geofence_radius_meters: 150, validation_mode: "both", partner_code: "", opening_hours: "", contact_phone: "", instagram: "", website: "", cover_image_url: "", order_sequence: 10, points_reward: 10 };
type Form = { [K in keyof typeof EMPTY]: (typeof EMPTY)[K] extends number ? number | string : string };
const slugify = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function AdminAttractions() {
  const qc = useQueryClient();
  const [edit, setEdit] = useState<{ id?: string; f: Form } | null>(null);
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-attractions"],
    queryFn: async () => {
      const [a, s] = await Promise.all([supabase.from("attractions").select(ATTR_COLS).order("order_sequence"), supabase.rpc("admin_attraction_secrets")]);
      const sec = new Map((s.data ?? []).map((x) => [x.id, x]));
      return (a.data ?? []).map((x) => ({ ...x, partner_code: sec.get(x.id)?.partner_code ?? "", qr_code_token: sec.get(x.id)?.qr_code_token ?? "" }));
    },
  });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["admin-attractions"] }); qc.invalidateQueries({ queryKey: ["attractions"] }); };

  async function toggle(id: string, v: boolean) {
    const { error } = await supabase.from("attractions").update({ is_passport_active: v }).eq("id", id);
    if (error) toast.error(error.message); else refresh();
  }

  async function save() {
    if (!edit) return;
    const f = edit.f;
    const payload = {
      ...f,
      slug: (f.slug as string) || slugify(f.name as string),
      latitude: Number(f.latitude), longitude: Number(f.longitude),
      geofence_radius_meters: Number(f.geofence_radius_meters), order_sequence: Number(f.order_sequence), points_reward: Number(f.points_reward),
      partner_code: String(f.partner_code).toUpperCase() || undefined,
    } as never;
    let error;
    if (edit.id) ({ error } = await supabase.from("attractions").update(payload).eq("id", edit.id));
    else {
      const { data: dest } = await supabase.from("destinations").select("id").eq("slug", DESTINATION_SLUG).single();
      ({ error } = await supabase.from("attractions").insert({ ...(payload as object), destination_id: dest!.id } as never));
    }
    if (error) { toast.error(error.message); return; }
    toast.success("Atrativo salvo");
    setEdit(null); refresh();
  }

  const set = (k: keyof Form, v: string | number) => setEdit((e) => e && { ...e, f: { ...e.f, [k]: v } });
  const field = (k: keyof Form, label: string, type = "text") => (
    <div><Label>{label}</Label><Input type={type} step="any" value={String(edit?.f[k] ?? "")} onChange={(e) => set(k, e.target.value)} /></div>
  );

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-extrabold">Atrativos</h2>
        <Button onClick={() => setEdit({ f: { ...EMPTY } })}><Plus className="h-4 w-4" />Novo atrativo</Button>
      </div>
      {!isLoading && data.length === 0 ? (
        <EmptyState icon={MapPin} title="Nenhum atrativo" text="Cadastre o primeiro atrativo do passaporte." action={<Button onClick={() => setEdit({ f: { ...EMPTY } })}>Cadastre o primeiro atrativo</Button>} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left text-xs uppercase text-muted-foreground"><tr><th className="p-3">#</th><th className="p-3">Nome</th><th className="p-3">Categoria</th><th className="p-3">Raio</th><th className="p-3">Modo</th><th className="p-3">Código</th><th className="p-3">Ativo</th><th className="p-3" /></tr></thead>
            <tbody>
              {data.map((a) => (
                <tr key={a.id} className="border-t">
                  <td className="p-3">{a.order_sequence}</td>
                  <td className="p-3 font-semibold">{a.name}</td>
                  <td className="p-3">{CATEGORY_LABEL[a.category]}</td>
                  <td className="p-3">{a.geofence_radius_meters}m</td>
                  <td className="p-3">{a.validation_mode}</td>
                  <td className="p-3 font-mono">{a.partner_code}</td>
                  <td className="p-3"><Switch checked={a.is_passport_active} onCheckedChange={(v) => toggle(a.id, v)} /></td>
                  <td className="flex gap-1 p-3">
                    <Button size="icon" variant="ghost" aria-label="Editar" onClick={() => { const rest = a; setEdit({ id: a.id, f: { ...EMPTY, ...(Object.fromEntries(Object.entries(rest).filter(([k]) => k in EMPTY).map(([k, v]) => [k, v ?? ""])) as Partial<Form>) } }); }}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" asChild aria-label="Placa QR"><Link to="/placa/$id" params={{ id: a.id }} target="_blank"><Printer className="h-4 w-4" /></Link></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogTitle>{edit?.id ? "Editar atrativo" : "Novo atrativo"}</DialogTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            {field("name", "Nome")}
            {field("slug", "Slug (URL)")}
            <div><Label>Categoria</Label>
              <select className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={String(edit?.f.category)} onChange={(e) => set("category", e.target.value)}>
                {(Object.keys(CATEGORY_LABEL) as Category[]).map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
              </select></div>
            <div><Label>Modo de validação</Label>
              <select className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={String(edit?.f.validation_mode)} onChange={(e) => set("validation_mode", e.target.value)}>
                <option value="geofence">GPS</option><option value="code">Código / QR</option><option value="both">Ambos</option>
              </select></div>
            <div className="sm:col-span-2 space-y-2">
              <Label>Localização e área de check-in</Label>
              <ClientOnly fallback={<div className="h-72 rounded-xl bg-muted" />}>
                <Suspense fallback={<div className="h-72 rounded-xl bg-muted" />}>
                  {edit && <LocationPicker lat={Number(edit.f.latitude)} lng={Number(edit.f.longitude)} radius={Number(edit.f.geofence_radius_meters)} onChange={(la, lo) => setEdit((e) => e && { ...e, f: { ...e.f, latitude: la, longitude: lo } })} />}
                </Suspense>
              </ClientOnly>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm">Raio:</span>
                {RADII.map((r) => <Button key={r} type="button" size="sm" variant={Number(edit?.f.geofence_radius_meters) === r ? "default" : "outline"} onClick={() => set("geofence_radius_meters", r)}>{r}m</Button>)}
              </div>
            </div>
            {field("latitude", "Latitude", "number")}
            {field("longitude", "Longitude", "number")}
            {field("geofence_radius_meters", "Raio personalizado (metros)", "number")}
            {field("partner_code", "Código de contingência (6)")}
            {field("order_sequence", "Ordem", "number")}
            {field("points_reward", "Pontos", "number")}
            {field("address", "Endereço")}
            {field("opening_hours", "Horários")}
            {field("contact_phone", "Telefone")}
            {field("instagram", "Instagram")}
            {field("website", "Site")}
            <div className="sm:col-span-2"><ImageUpload bucket="attractions-media" label="Foto de capa" value={String(edit?.f.cover_image_url ?? "")} onChange={(u) => set("cover_image_url", u)} /></div>
          </div>
          <div><Label>Descrição</Label><Textarea value={String(edit?.f.description ?? "")} onChange={(e) => set("description", e.target.value)} /></div>
          <div><Label>História</Label><Textarea value={String(edit?.f.history ?? "")} onChange={(e) => set("history", e.target.value)} /></div>
          <Button onClick={save}>Salvar</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
