import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Navigation, KeyRound, Stamp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { playStamp } from "@/lib/passport";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

type Result = { ok: boolean; already?: boolean; attraction?: string; new_vouchers?: number; distance?: number; radius?: number; invalid_code?: boolean };

export function StampDialog({ name, open, onOpenChange, vouchers }: { name: string; open: boolean; onOpenChange: (o: boolean) => void; vouchers?: number | undefined }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm text-center">
        <div className="mx-auto my-4 flex h-36 w-36 animate-stamp items-center justify-center rounded-full border-[6px] border-double border-primary text-primary">
          <div>
            <Stamp className="mx-auto h-10 w-10" />
            <div className="mt-1 text-xs font-extrabold uppercase tracking-widest">Carimbado</div>
          </div>
        </div>
        <DialogTitle>{name}</DialogTitle>
        <DialogDescription>Visita registrada no seu passaporte!</DialogDescription>
        {!!vouchers && <p className="rounded-xl bg-accent/15 p-3 text-sm font-semibold text-accent">🎉 Você desbloqueou {vouchers} nova(s) recompensa(s)!</p>}
        <Button asChild><Link to="/passaporte">Ver meu passaporte</Link></Button>
      </DialogContent>
    </Dialog>
  );
}

export function CheckinPanel({ attraction, loggedIn, done }: { attraction: { id: string; name: string; validation_mode: string; slug: string }; loggedIn: boolean; done: boolean }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState<"gps" | "code" | null>(null);
  const [code, setCode] = useState("");
  const [stamp, setStamp] = useState<{ open: boolean; v?: number | undefined }>({ open: false });

  function handle(r: Result) {
    if (r.ok) {
      if (r.already) toast.info("Este atrativo já está carimbado no seu passaporte.");
      else {
        playStamp();
        setStamp({ open: true, v: r.new_vouchers });
      }
      qc.invalidateQueries();
    } else if (r.invalid_code) toast.error("Código inválido. Confira com o atendente do local.");
    else if (r.distance != null) toast.error(`Você está a ${r.distance}m. Aproxime-se (raio de ${r.radius}m).`);
  }

  function gps() {
    if (!navigator.geolocation) { toast.error("GPS indisponível neste dispositivo."); return; }
    setBusy("gps");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { data, error } = await supabase.rpc("checkin_geofence", { _attraction_id: attraction.id, _lat: pos.coords.latitude, _lng: pos.coords.longitude });
        setBusy(null);
        if (error) { toast.error(error.message); return; }
        handle(data as Result);
      },
      () => {
        setBusy(null);
        toast.error("Não conseguimos sua localização. Use o código do local.");
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  async function submitCode() {
    setBusy("code");
    const { data, error } = await supabase.rpc("checkin_code", { _attraction_id: attraction.id, _code: code });
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    handle(data as Result);
  }

  if (!loggedIn)
    return (
      <div className="rounded-2xl bg-secondary p-5">
        <p className="font-semibold">Entre para carimbar seu passaporte</p>
        <p className="mt-1 text-sm text-muted-foreground">Crie sua conta gratuita e registre esta visita.</p>
        <Button asChild className="mt-3"><Link to="/auth" search={{ redirect: `/atrativos/${attraction.slug}` }}>Entrar ou criar conta</Link></Button>
      </div>
    );

  if (done)
    return <div className="rounded-2xl bg-accent/15 p-5 font-semibold text-accent">✓ Atrativo já carimbado no seu passaporte</div>;

  return (
    <div className="space-y-3 rounded-2xl border bg-card p-5 shadow-sm">
      <h3 className="font-bold">Registrar visita</h3>
      {attraction.validation_mode !== "code" && (
        <Button onClick={gps} disabled={!!busy} className="w-full bg-sunset shadow-elegant" size="lg">
          {busy === "gps" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />} Validar pelo GPS
        </Button>
      )}
      <div className="flex gap-2">
        <Input placeholder="Código de 6 dígitos" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className="uppercase tracking-widest" />
        <Button variant="outline" onClick={submitCode} disabled={code.length !== 6 || !!busy}>
          {busy === "code" ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />} Validar
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">GPS falhou? Peça o código de contingência no local ou escaneie o QR Code da placa.</p>
      <StampDialog name={attraction.name} open={stamp.open} vouchers={stamp.v} onOpenChange={(o) => setStamp({ open: o })} />
    </div>
  );
}
