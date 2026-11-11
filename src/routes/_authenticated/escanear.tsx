import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/passport/AppShell";
import { QrScanner } from "@/components/passport/QrScanner";
import { APP_NAME } from "@/lib/passport";

export const Route = createFileRoute("/_authenticated/escanear")({
  head: () => ({
    meta: [
      { title: `Escanear QR Code — ${APP_NAME}` },
      { name: "description", content: "Escaneie o QR Code oficial do atrativo para carimbar seu passaporte." },
      { property: "og:title", content: `Escanear — ${APP_NAME}` },
      { property: "og:description", content: "Leitor de QR Code do Passaporte Digital." },
    ],
  }),
  component: Scan,
});

function Scan() {
  const navigate = useNavigate();
  return (
    <AppShell>
      <div className="mx-auto max-w-md">
        <h1 className="text-2xl font-extrabold">Escanear QR Code</h1>
        <p className="mb-4 text-sm text-muted-foreground">Aponte a câmera para a placa oficial do atrativo.</p>
        <QrScanner
          onResult={(text) => {
            const m = text.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
            if (!m) return toast.error("Este QR Code não é de um atrativo do passaporte.");
            navigate({ to: "/checkin/$token", params: { token: m[0] } });
          }}
        />
      </div>
    </AppShell>
  );
}
