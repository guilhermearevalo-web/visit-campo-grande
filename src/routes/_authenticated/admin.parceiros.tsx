import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Store, Plus, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState } from "@/components/passport/AppShell";
import { DESTINATION_SLUG, type AppRole } from "@/lib/passport";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/admin/parceiros")({ component: AdminPartners });

const ROLE_LABEL: Record<AppRole, string> = { tourist: "Turista", partner: "Parceiro", manager: "Gestor", admin: "Admin" };

function AdminPartners() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ business_name: "", trade_name: "", category: "", address: "", phone: "", email: "", owner_email: "" });
  const [roleEmail, setRoleEmail] = useState("");
  const [role, setRole] = useState<AppRole>("partner");
  const { data } = useQuery({
    queryKey: ["admin-partners"],
    queryFn: async () => {
      const [p, r, pr] = await Promise.all([
        supabase.from("commercial_partners").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("id,user_id,role").neq("role", "tourist"),
        supabase.from("profiles").select("id,full_name,email"),
      ]);
      return { partners: p.data ?? [], roles: r.data ?? [], profiles: pr.data ?? [] };
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-partners"] });
  const byEmail = (e: string) => data?.profiles.find((p) => p.email?.toLowerCase() === e.trim().toLowerCase());

  async function savePartner() {
    const { data: d } = await supabase.from("destinations").select("id").eq("slug", DESTINATION_SLUG).single();
    const owner = f.owner_email ? byEmail(f.owner_email) : undefined;
    if (f.owner_email && !owner) { toast.error("Nenhuma conta com esse e-mail. Peça para o responsável criar uma conta primeiro."); return; }
    const { owner_email: _o, ...rest } = f;
    const { error } = await supabase.from("commercial_partners").insert({ ...rest, destination_id: d!.id, owner_id: owner?.id ?? null, status: "active" });
    if (error) { toast.error(error.message); return; }
    if (owner) await supabase.from("user_roles").insert({ user_id: owner.id, role: "partner" });
    setOpen(false); refresh(); toast.success("Parceiro cadastrado");
  }
  async function setStatus(id: string, status: "active" | "suspended") {
    await supabase.from("commercial_partners").update({ status }).eq("id", id); refresh();
  }
  async function grant() {
    const p = byEmail(roleEmail);
    if (!p) { toast.error("Nenhuma conta com esse e-mail."); return; }
    const { error } = await supabase.from("user_roles").insert({ user_id: p.id, role });
    if (error) { toast.error(error.code === "23505" ? "Essa pessoa já tem esse papel." : error.message); return; }
    setRoleEmail(""); refresh(); toast.success("Acesso liberado");
  }
  async function revoke(id: string) { await supabase.from("user_roles").delete().eq("id", id); refresh(); }

  const name = (uid: string) => { const p = data?.profiles.find((x) => x.id === uid); return p?.full_name || p?.email || uid; };

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-extrabold">Parceiros comerciais</h2>
          <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" />Novo parceiro</Button>
        </div>
        {!data?.partners.length ? <EmptyState icon={Store} title="Nenhum parceiro" text="Cadastre o primeiro estabelecimento participante." action={<Button onClick={() => setOpen(true)}>Cadastrar parceiro</Button>} /> : (
          <div className="grid gap-3 md:grid-cols-2">
            {data.partners.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-2xl border bg-card p-4">
                <div><p className="font-bold">{p.business_name}</p><p className="text-sm text-muted-foreground">{[p.category, p.phone].filter(Boolean).join(" · ")}</p>{p.owner_id && <p className="text-xs text-muted-foreground">Responsável: {name(p.owner_id)}</p>}</div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant={p.status === "active" ? "default" : "secondary"}>{p.status}</Badge>
                  <Button size="sm" variant="ghost" onClick={() => setStatus(p.id, p.status === "active" ? "suspended" : "active")}>{p.status === "active" ? "Suspender" : "Ativar"}</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      <section>
        <h2 className="mb-3 text-xl font-extrabold">Equipe e acessos</h2>
        <div className="mb-4 flex flex-wrap gap-2 rounded-2xl border bg-card p-4">
          <Input className="max-w-xs" placeholder="E-mail da conta" value={roleEmail} onChange={(e) => setRoleEmail(e.target.value)} />
          <select className="h-9 rounded-md border bg-background px-2 text-sm" value={role} onChange={(e) => setRole(e.target.value as AppRole)}><option value="partner">Parceiro (validador)</option><option value="manager">Gestor</option><option value="admin">Admin</option></select>
          <Button onClick={grant}><UserPlus className="h-4 w-4" />Liberar acesso</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {data?.roles.map((r) => (
            <span key={r.id} className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-sm">{name(r.user_id)} <Badge variant="secondary">{ROLE_LABEL[r.role]}</Badge><button aria-label="Remover" onClick={() => revoke(r.id)}><X className="h-3 w-3" /></button></span>
          ))}
        </div>
      </section>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogTitle>Novo parceiro</DialogTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            {([["business_name", "Razão social"], ["trade_name", "Nome fantasia"], ["category", "Categoria"], ["phone", "Telefone"], ["email", "E-mail"], ["address", "Endereço"], ["owner_email", "E-mail da conta do responsável (opcional)"]] as const).map(([k, l]) => (
              <div key={k} className={k === "owner_email" ? "sm:col-span-2" : ""}><Label>{l}</Label><Input value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></div>
            ))}
          </div>
          <Button disabled={!f.business_name} onClick={savePartner}>Salvar</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
