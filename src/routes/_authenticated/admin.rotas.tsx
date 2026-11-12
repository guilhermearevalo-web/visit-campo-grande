import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2, Route as RouteIcon, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState } from "@/components/passport/AppShell";
import { ImageUpload } from "@/components/passport/ImageUpload";
import { ATTR_COLS, DESTINATION_SLUG } from "@/lib/passport";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/admin/rotas")({ component: AdminRoutes });

type F = { title: string; slug: string; description: string; cover_image_url: string; estimated_duration: string; mode: string; reward_id: string; is_active: boolean; order_sequence: number; checkpoints: string[] };
const EMPTY: F = { title: "", slug: "", description: "", cover_image_url: "", estimated_duration: "", mode: "free", reward_id: "", is_active: true, order_sequence: 0, checkpoints: [] };
const slugify = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function AdminRoutes() {
  const qc = useQueryClient();
  const [edit, setEdit] = useState<{ id?: string; f: F } | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-routes"],
    queryFn: async () => {
      const [r, a, w, d] = await Promise.all([
        supabase.from("thematic_routes").select("*, route_checkpoints(attraction_id,position)").order("order_sequence"),
        supabase.from("attractions").select(ATTR_COLS).order("order_sequence"),
        supabase.from("rewards").select("id,title"),
        supabase.from("destinations").select("id,home_display").eq("slug", DESTINATION_SLUG).single(),
      ]);
      return { routes: r.data ?? [], attractions: a.data ?? [], rewards: w.data ?? [], dest: d.data };
    },
  });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["admin-routes"] }); qc.invalidateQueries({ queryKey: ["routes"] }); qc.invalidateQueries({ queryKey: ["home-display"] }); };
  const set = <K extends keyof F>(k: K, v: F[K]) => setEdit((e) => e && { ...e, f: { ...e.f, [k]: v } });
  const name = (id: string) => data?.attractions.find((a) => a.id === id)?.name ?? "?";

  async function save() {
    if (!edit || !data?.dest) return;
    const f = edit.f;
    if (!f.title.trim()) { toast.error("Informe o título"); return; }
    if (f.checkpoints.length === 0) { toast.error("Adicione ao menos um atrativo"); return; }
    const row = { title: f.title, slug: f.slug || slugify(f.title), description: f.description || null, cover_image_url: f.cover_image_url || null, estimated_duration: f.estimated_duration || null, mode: f.mode, reward_id: f.reward_id || null, is_active: f.is_active, order_sequence: Number(f.order_sequence), destination_id: data.dest.id };
    const res = edit.id ? await supabase.from("thematic_routes").update(row).eq("id", edit.id).select("id").single() : await supabase.from("thematic_routes").insert(row).select("id").single();
    if (res.error) { toast.error(res.error.message); return; }
    const id = res.data.id;
    await supabase.from("route_checkpoints").delete().eq("route_id", id);
    const { error } = await supabase.from("route_checkpoints").insert(f.checkpoints.map((a, i) => ({ route_id: id, attraction_id: a, position: i })));
    if (error) { toast.error(error.message); return; }
    toast.success("Rota salva"); setEdit(null); refresh();
  }

  async function remove(id: string) {
    if (!confirm("Excluir esta rota?")) return;
    const { error } = await supabase.from("thematic_routes").delete().eq("id", id);
    if (error) toast.error(error.message); else refresh();
  }

  async function setDisplay(v: string) {
    const { error } = await supabase.from("destinations").update({ home_display: v }).eq("id", data!.dest!.id);
    if (error) toast.error(error.message); else { toast.success("Exibição da tela inicial atualizada"); refresh(); }
  }

  const move = (i: number, d: number) => setEdit((e) => { if (!e) return e; const c = [...e.f.checkpoints]; const j = i + d; if (j < 0 || j >= c.length) return e; [c[i], c[j]] = [c[j]!, c[i]!]; return { ...e, f: { ...e.f, checkpoints: c } }; });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-extrabold">Rotas Temáticas</h2>
        <Button onClick={() => setEdit({ f: { ...EMPTY } })}><Plus className="h-4 w-4" />Nova rota</Button>
      </div>
      {data?.dest && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border bg-card p-3 text-sm">
          <span className="font-semibold">Tela inicial do turista mostra:</span>
          {[["tabs", "Abas (Rotas e Todos)"], ["routes", "Só rotas"], ["all", "Só todos os pontos"]].map(([v, l]) => (
            <Button key={v} size="sm" variant={data.dest!.home_display === v ? "default" : "outline"} onClick={() => setDisplay(v!)}>{l}</Button>
          ))}
        </div>
      )}
      {!isLoading && data?.routes.length === 0 ? (
        <EmptyState icon={RouteIcon} title="Nenhuma rota temática" text="Crie roteiros como 'Rota Gastronômica' ligando atrativos." action={<Button onClick={() => setEdit({ f: { ...EMPTY } })}>Criar primeira rota</Button>} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {data?.routes.map((r) => (
            <div key={r.id} className="flex gap-3 rounded-2xl border bg-card p-3">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-sunset">{r.cover_image_url && <img src={r.cover_image_url} alt="" className="h-full w-full object-cover" />}</div>
              <div className="min-w-0 flex-1">
                <p className="font-bold">{r.title}</p>
                <p className="text-xs text-muted-foreground">{r.route_checkpoints.length} atrativos · {r.mode === "sequential" ? "Sequencial" : "Livre"} {r.is_active ? "" : "· inativa"}</p>
              </div>
              <div className="flex flex-col gap-1">
                <Button size="icon" variant="ghost" aria-label="Editar rota" onClick={() => setEdit({ id: r.id, f: { title: r.title, slug: r.slug, description: r.description ?? "", cover_image_url: r.cover_image_url ?? "", estimated_duration: r.estimated_duration ?? "", mode: r.mode, reward_id: r.reward_id ?? "", is_active: r.is_active, order_sequence: r.order_sequence, checkpoints: [...r.route_checkpoints].sort((a, b) => a.position - b.position).map((c) => c.attraction_id) } })}><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" aria-label="Excluir rota" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogTitle>{edit?.id ? "Editar rota" : "Nova rota"}</DialogTitle>
          {edit && (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div><Label htmlFor="rt-title">Título</Label><Input id="rt-title" value={edit.f.title} onChange={(e) => set("title", e.target.value)} /></div>
                <div><Label>Duração estimada</Label><Input placeholder="Ex: 3 horas" value={edit.f.estimated_duration} onChange={(e) => set("estimated_duration", e.target.value)} /></div>
                <div><Label>Modo de conclusão</Label>
                  <select className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={edit.f.mode} onChange={(e) => set("mode", e.target.value)}>
                    <option value="free">Livre (qualquer ordem)</option><option value="sequential">Sequencial (na ordem)</option>
                  </select></div>
                <div><Label>Recompensa ao completar 100%</Label>
                  <select className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={edit.f.reward_id} onChange={(e) => set("reward_id", e.target.value)}>
                    <option value="">Nenhuma</option>{data?.rewards.map((w) => <option key={w.id} value={w.id}>{w.title}</option>)}
                  </select></div>
                <div><Label>Ordem</Label><Input type="number" value={edit.f.order_sequence} onChange={(e) => set("order_sequence", Number(e.target.value))} /></div>
                <div className="flex items-end gap-2 pb-2"><Switch checked={edit.f.is_active} onCheckedChange={(v) => set("is_active", v)} /><span className="text-sm">Ativa</span></div>
              </div>
              <div><Label>Descrição</Label><Textarea value={edit.f.description} onChange={(e) => set("description", e.target.value)} /></div>
              <ImageUpload bucket="routes-media" label="Capa da rota" value={edit.f.cover_image_url} onChange={(u) => set("cover_image_url", u)} />
              <div>
                <Label>Atrativos da rota (na ordem)</Label>
                <ol className="mt-1 space-y-1">
                  {edit.f.checkpoints.map((id, i) => (
                    <li key={id} className="flex items-center gap-2 rounded-lg border px-2 py-1 text-sm">
                      <span className="w-5 font-bold">{i + 1}</span><span className="flex-1">{name(id)}</span>
                      <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Subir" onClick={() => move(i, -1)}><ArrowUp className="h-3 w-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Descer" onClick={() => move(i, 1)}><ArrowDown className="h-3 w-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Remover" onClick={() => set("checkpoints", edit.f.checkpoints.filter((x) => x !== id))}><Trash2 className="h-3 w-3" /></Button>
                    </li>
                  ))}
                </ol>
                <select aria-label="Adicionar atrativo" className="mt-2 h-9 w-full rounded-md border bg-background px-2 text-sm" value="" onChange={(e) => e.target.value && set("checkpoints", [...edit.f.checkpoints, e.target.value])}>
                  <option value="">+ Adicionar atrativo</option>
                  {data?.attractions.filter((a) => !edit.f.checkpoints.includes(a.id)).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <Button className="w-full" onClick={save}>Salvar rota</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
