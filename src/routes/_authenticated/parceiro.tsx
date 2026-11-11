import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, XCircle, ScanLine, Loader2, Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, EmptyState } from "@/components/passport/AppShell";
import { QrScanner } from "@/components/passport/QrScanner";
import { APP_NAME, useAuthUser, useRoles } from "@/lib/passport";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/parceiro")({
  head: () => ({
    meta: [
      { title: `Área do Parceiro — ${APP_NAME}` },
      { name: "description", content: "Validação de vouchers para estabelecimentos parceiros." },
      { property: "og:title", content: `Área do Parceiro — ${APP_NAME}` },
      { property: "og:description", content: "Valide vouchers de turistas em segundos." },
    ],
  }),
  component: Partner,
});

type R = { ok: boolean; reason?: string; title?: string; tourist?: string; code?: string };
const REASON: Record<string, string> = { not_found: "Voucher não encontrado", redeemed: "Voucher já foi resgatado", expired: "Voucher expirado" };

function Partner() {
  const { user } = useAuthUser();
  const { data: roles, isLoading } = useRoles(user?.id);
  const [scan, setScan] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<R | null>(null);
  const allowed = roles?.some((r) => r === "partner" || r === "admin" || r === "manager");

  async function redeem(c: string) {
    setScan(false); setBusy(true);
    const { data, error } = await supabase.rpc("redeem_voucher", { _code: c });
    setBusy(false);
    setRes(error ? { ok: false, reason: error.message } : (data as R));
  }

  if (isLoading) return <AppShell><div /></AppShell>;
  if (!allowed) return <AppShell><EmptyState icon={Store} title="Acesso de parceiro necessário" text="Peça à equipe de turismo de Campo Grande para liberar sua conta como parceiro." /></AppShell>;

  return (
    <AppShell>
      <div className="mx-auto max-w-md space-y-4">
        <h1 className="text-2xl font-extrabold">Validar voucher</h1>
        {res && (
          <div className={`rounded-2xl p-5 ${res.ok ? "bg-accent/15 text-accent" : "bg-destructive/10 text-destructive"}`}>
            <div className="flex items-center gap-2 text-lg font-extrabold">{res.ok ? <CheckCircle2 /> : <XCircle />}{res.ok ? "Resgatado com sucesso" : REASON[res.reason ?? ""] ?? res.reason}</div>
            {res.title && <p className="mt-1 font-semibold text-foreground">{res.title}</p>}
            {res.tourist && <p className="text-sm text-foreground">Turista: {res.tourist}</p>}
          </div>
        )}
        {scan ? <QrScanner onResult={redeem} /> : (
          <Button size="lg" className="w-full bg-sunset" onClick={() => { setRes(null); setScan(true); }}><ScanLine className="h-5 w-5" />Escanear QR do voucher</Button>
        )}
        <div className="flex gap-2">
          <Input placeholder="Ou digite o código (ex: MS1234CG-A1B2C3)" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
          <Button variant="outline" disabled={!code || busy} onClick={() => redeem(code)}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Validar"}</Button>
        </div>
      </div>
    </AppShell>
  );
}
