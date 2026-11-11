import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, QrCode } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, EmptyState } from "@/components/passport/AppShell";
import { StampDialog } from "@/components/passport/CheckinPanel";
import { APP_NAME, playStamp } from "@/lib/passport";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/checkin/$token")({
  ssr: false,
  head: () => ({
    meta: [
      { title: `Carimbar visita — ${APP_NAME}` },
      { name: "description", content: "Registre sua visita escaneando o QR Code oficial do atrativo." },
      { property: "og:title", content: `Carimbar visita — ${APP_NAME}` },
      { property: "og:description", content: "QR Code oficial do Passaporte Digital de Campo Grande." },
    ],
  }),
  component: QrCheckin,
});

function QrCheckin() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const [state, setState] = useState<"loading" | "invalid" | "done">("loading");
  const [res, setRes] = useState<{ attraction?: string; new_vouchers?: number; already?: boolean }>({});
  const [open, setOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        const { data: slug } = await supabase.rpc("attraction_by_qr", { _token: token });
        if (!slug) { setState("invalid"); return; }
        sessionStorage.setItem("post-auth", `/checkin/${token}`);
        return navigate({ to: "/atrativos/$slug", params: { slug } });
      }
      const { data, error } = await supabase.rpc("checkin_qr", { _token: token });
      if (error) { setState("invalid"); return; }
      const r = data as typeof res;
      setRes(r);
      setState("done");
      if (!r.already) { playStamp(); setOpen(true); }
    })();
  }, [token, navigate]);

  return (
    <AppShell>
      {state === "loading" && <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
      {state === "invalid" && <EmptyState icon={QrCode} title="QR Code inválido" text="Este código não corresponde a nenhum atrativo ativo." action={<Button asChild><Link to="/atrativos">Ver atrativos</Link></Button>} />}
      {state === "done" && (
        <EmptyState icon={QrCode} title={res.attraction ?? "Visita registrada"} text={res.already ? "Este atrativo já estava carimbado no seu passaporte." : "Carimbo registrado com sucesso!"} action={<Button asChild><Link to="/passaporte">Ver passaporte</Link></Button>} />
      )}
      <StampDialog name={res.attraction ?? ""} open={open} onOpenChange={setOpen} vouchers={res.new_vouchers} />
    </AppShell>
  );
}
