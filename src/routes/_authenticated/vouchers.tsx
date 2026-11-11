import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Gift, Ticket, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, EmptyState } from "@/components/passport/AppShell";
import { APP_NAME, useAuthUser, useMyCheckins } from "@/lib/passport";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/vouchers")({
  head: () => ({
    meta: [
      { title: `Recompensas e Vouchers — ${APP_NAME}` },
      { name: "description", content: "Benefícios desbloqueados no Passaporte Digital de Campo Grande." },
      { property: "og:title", content: `Vouchers — ${APP_NAME}` },
      { property: "og:description", content: "Seus vouchers de desconto em Campo Grande - MS." },
    ],
  }),
  component: Vouchers,
});

const STATUS = { available: "Disponível", redeemed: "Resgatado", expired: "Expirado" } as const;

function Vouchers() {
  const { user } = useAuthUser();
  const { data: checkins = [] } = useMyCheckins(user?.id);
  const [open, setOpen] = useState<{ code: string; qr: string; title: string } | null>(null);
  const { data: vouchers = [] } = useQuery({
    queryKey: ["vouchers", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("user_vouchers").select("*, rewards(title,description,discount_percentage)").eq("user_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });
  const { data: rewards = [] } = useQuery({
    queryKey: ["rewards-public"],
    queryFn: async () => (await supabase.from("rewards").select("*").eq("is_active", true).order("required_checkins_count")).data ?? [],
  });
  const locked = rewards.filter((r) => !vouchers.some((v) => v.reward_id === r.id));

  return (
    <AppShell>
      <h1 className="mb-4 text-2xl font-extrabold">Recompensas & Vouchers</h1>
      {vouchers.length === 0 ? (
        <EmptyState icon={Ticket} title="Nenhum voucher ainda" text="Carimbe mais atrativos para desbloquear benefícios exclusivos." action={<Button asChild><Link to="/atrativos">Explorar atrativos</Link></Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {vouchers.map((v) => (
            <div key={v.id} className="flex items-center gap-4 rounded-2xl border bg-card p-4 shadow-sm">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sunset text-primary-foreground"><Gift /></div>
              <div className="min-w-0 flex-1">
                <p className="font-bold">{v.rewards?.title}</p>
                <p className="font-mono text-sm text-muted-foreground">{v.voucher_code}</p>
                <Badge variant={v.status === "available" ? "default" : "secondary"} className="mt-1">{STATUS[v.status]}</Badge>
              </div>
              {v.status === "available" && <Button size="sm" onClick={() => setOpen({ code: v.voucher_code, qr: v.qr_code_data, title: v.rewards?.title ?? "" })}>Abrir</Button>}
            </div>
          ))}
        </div>
      )}
      {locked.length > 0 && (
        <>
          <h2 className="mb-3 mt-8 text-lg font-bold">A desbloquear</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {locked.map((r) => (
              <div key={r.id} className="rounded-2xl border border-dashed bg-card p-4">
                <div className="flex items-center gap-2 font-semibold"><Lock className="h-4 w-4 text-muted-foreground" />{r.title}</div>
                <p className="mt-1 text-sm text-muted-foreground">{r.description}</p>
                <Progress value={Math.min(100, (checkins.length / r.required_checkins_count) * 100)} className="mt-3 h-2" />
                <p className="mt-1 text-xs text-muted-foreground">{Math.min(checkins.length, r.required_checkins_count)} de {r.required_checkins_count} visitas</p>
              </div>
            ))}
          </div>
        </>
      )}
      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-sm text-center">
          <DialogTitle>{open?.title}</DialogTitle>
          <DialogDescription>Apresente este QR Code no estabelecimento parceiro.</DialogDescription>
          <div className="mx-auto rounded-2xl bg-[#FFFFFF] p-4">{open && <QRCodeSVG value={open.qr} size={220} />}</div>
          <p className="font-mono text-lg font-bold tracking-wider">{open?.code}</p>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
