import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Gift, Plus, Pencil, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState } from "@/components/passport/AppShell";
import { DESTINATION_SLUG } from "@/lib/passport";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/admin/recompensas")({ component: AdminRewards });

type F = { title: string; description: string; required_checkins_count: number; reward_type: string; discount_percentage: number; voucher_prefix: string; stock_limit: number; partner_id: string };
const EMPTY: F = { title: "", description: "", required_checkins_count: 9, reward_type: "discount", discount_percentage: 10, voucher_prefix: "CG", stock_limit: 50, partner_id: "" };

function AdminRewards() {
  const qc = useQueryClient();
  const [edit, setEdit] = useState<{ id?: string; f: F } | null>(null);
  const { data } = useQuery({
    queryKey: ["admin-rewards"],
    queryFn: async () => {
      const [r, v, p] = await Promise.all([
        supabase.from("rewards").select("*").order("required_checkins_count"),
        supabase.from("user_vouchers").select("reward_id,status"),
        supabase.from("commercial_partners").select("id,business_name"),
      ]);
      return { rewards: r.data ?? [], vouchers: v.data ?? [], partners: p.data ?? [] };
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-rewards"] });

  async function save() {
    if (!edit) return;
    const f = edit.f;
    const payload = { ...f, required_checkins_count: Number(f.required_checkins_count), discount_percentage: Number(f.discount_percentage) || null, stock_limit: Number(f.stock_limit) || null, partner_id: f.partner_id || null, voucher_prefix: f.voucher_prefix.toUpperCase() } as never;
    let error;
    if (edit.id) ({ error } = await supabase.from("rewards").update(payload).eq("id", edit.id));
    else {
      const { data: d } = await supabase.from("destinations").select("id").eq("slug", DESTINATION_SLUG).single();
      ({ error } = await supabase.from("rewards").insert({ ...(payload as object), destination_id: d!.id } as never));
    }
    if (error) return toast.error(error.message);
    setEdit(null); refresh(); toast.success("Recompensa salva");
  }
  async function deliver(id: string) {
    const { data: n, error } = await supabase.rpc("deliver_reward_retroactive", { _reward_id: id });
    if (error) return toast.error(error.message);
    toast.success(n ? `${n} voucher(s) entregue(s)` : "Nenhum novo turista elegível");
    refresh();
  }
  async function toggle(id: string, v: boolean) {
    await supabase.from("rewards").update({ is_active: v }).eq("id", id); refresh();
  }
  const set = (k: keyof F, v: string) => setEdit((e) => e && { ...e, f: { ...e.f, [k]: v } });

  const rewards = data?.rewards ?? [];
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-extrabold">Recompensas</h2>
        <Button onClick={() => setEdit({ f: { ...EMPTY } })}><Plus className="h-4 w-4" />Nova recompensa</Button>
      </div>
      {rewards.length === 0 ? <EmptyState icon={Gift} title="Nenhuma recompensa" text="Crie o primeiro benefício para os turistas." /> : (
        <div className="grid gap-4 md:grid-cols-2">
          {rewards.map((r) => {
            const vs = data!.vouchers.filter((v) => v.reward_id === r.id);
            return (
              <div key={r.id} className="rounded-2xl border bg-card p-5 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div><p className="font-bold">{r.title}</p><p className="text-sm text-muted-foreground">{r.description}</p></div>
                  <Switch checked={r.is_active} onCheckedChange={(v) => toggle(r.id, v)} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <Badge variant="secondary">Meta: {r.required_checkins_count} visitas</Badge>
                  <Badge variant="secondary">Prefixo {r.voucher_prefix}</Badge>
                  <Badge variant="secondary">Estoque: {vs.length}/{r.stock_limit ?? "∞"}</Badge>
                  <Badge variant="secondary">Resgatados: {vs.filter((v) => v.status === "redeemed").length}</Badge>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEdit({ id: r.id, f: { title: r.title, description: r.description ?? "", required_checkins_count: r.required_checkins_count, reward_type: r.reward_type, discount_percentage: r.discount_percentage ?? 0, voucher_prefix: r.voucher_prefix, stock_limit: r.stock_limit ?? 0, partner_id: r.partner_id ?? "" } })}><Pencil className="h-4 w-4" />Editar</Button>
                  <Button size="sm" onClick={() => deliver(r.id)}><Send className="h-4 w-4" />Entregar a quem já concluiu</Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-w-lg">
          <DialogTitle>{edit?.id ? "Editar recompensa" : "Nova recompensa"}</DialogTitle>
          <div className="space-y-3">
            <div><Label>Título</Label><Input value={edit?.f.title ?? ""} onChange={(e) => set("title", e.target.value)} /></div>
            <div><Label>Descrição</Label><Textarea value={edit?.f.description ?? ""} onChange={(e) => set("description", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Meta de visitas</Label><Input type="number" value={edit?.f.required_checkins_count ?? 0} onChange={(e) => set("required_checkins_count", e.target.value)} /></div>
              <div><Label>Tipo</Label><select className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={edit?.f.reward_type} onChange={(e) => set("reward_type", e.target.value)}><option value="discount">Desconto</option><option value="gift">Brinde</option><option value="badge">Selo</option><option value="experience">Experiência</option></select></div>
              <div><Label>Desconto (%)</Label><Input type="number" value={edit?.f.discount_percentage ?? 0} onChange={(e) => set("discount_percentage", e.target.value)} /></div>
              <div><Label>Estoque de vouchers</Label><Input type="number" value={edit?.f.stock_limit ?? 0} onChange={(e) => set("stock_limit", e.target.value)} /></div>
              <div><Label>Prefixo do voucher</Label><Input value={edit?.f.voucher_prefix ?? ""} onChange={(e) => set("voucher_prefix", e.target.value)} /></div>
              <div><Label>Parceiro</Label><select className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={edit?.f.partner_id} onChange={(e) => set("partner_id", e.target.value)}><option value="">Todos</option>{data?.partners.map((p) => <option key={p.id} value={p.id}>{p.business_name}</option>)}</select></div>
            </div>
            <Button className="w-full" onClick={save}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
