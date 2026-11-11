import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { MapPin, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { APP_NAME, CATEGORY_LABEL } from "@/lib/passport";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/placa/$id")({
  head: () => ({
    meta: [
      { title: `Placa QR Code — ${APP_NAME}` },
      { name: "description", content: "Placa oficial de QR Code para impressão." },
      { property: "og:title", content: `Placa QR — ${APP_NAME}` },
      { property: "og:description", content: "Placa de check-in do Passaporte Digital." },
    ],
  }),
  component: Plate,
});

function Plate() {
  const { id } = Route.useParams();
  const { data } = useQuery({
    queryKey: ["plate", id],
    queryFn: async () => {
      const [a, s] = await Promise.all([supabase.from("attractions").select("name,category").eq("id", id).single(), supabase.rpc("admin_attraction_secrets")]);
      const sec = s.data?.find((x) => x.id === id);
      return { name: a.data?.name, category: a.data?.category, token: sec?.qr_code_token };
    },
  });
  if (!data?.token) return <div className="p-10 text-center text-muted-foreground">Carregando placa…</div>;
  const url = `${window.location.origin}/checkin/${data.token}`;
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted p-6 print:bg-background print:p-0">
      <Button onClick={() => window.print()} className="print:hidden"><Printer className="h-4 w-4" />Imprimir placa</Button>
      <div className="w-[148mm] overflow-hidden rounded-3xl bg-card text-center shadow-xl print:shadow-none">
        <div className="bg-sunset px-8 py-6 text-primary-foreground">
          <div className="flex items-center justify-center gap-2 text-lg font-extrabold tracking-wide"><MapPin />{APP_NAME}</div>
          <p className="text-xs uppercase tracking-[0.3em] opacity-90">Passaporte Digital Turístico</p>
        </div>
        <div className="px-8 py-8">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">{data.category && CATEGORY_LABEL[data.category]}</p>
          <h1 className="mt-1 text-3xl font-extrabold">{data.name}</h1>
          <div className="mx-auto my-6 w-fit rounded-2xl border-4 border-primary bg-[#FFFFFF] p-4"><QRCodeSVG value={url} size={240} level="M" /></div>
          <p className="text-lg font-bold">Escaneie e carimbe seu passaporte!</p>
        </div>
        <div className="bg-accent py-3 text-sm font-semibold text-accent-foreground">Campo Grande · Mato Grosso do Sul</div>
      </div>
    </div>
  );
}
