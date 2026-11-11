import { useEffect, useRef, useState } from "react";

export function QrScanner({ onResult }: { onResult: (text: string) => void }) {
  const id = useRef(`qr-${Math.random().toString(36).slice(2)}`).current;
  const cb = useRef(onResult);
  cb.current = onResult;
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let scanner: { stop: () => Promise<void>; clear: () => void; isScanning: boolean } | null = null;
    let done = false;
    let cancelled = false;
    import("html5-qrcode").then(({ Html5Qrcode }) => {
      if (cancelled) return;
      const s = new Html5Qrcode(id);
      scanner = s;
      s.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (text) => {
          if (done) return;
          done = true;
          cb.current(text);
        },
        () => {},
      ).catch(() => setErr("Não foi possível acessar a câmera. Verifique a permissão do navegador."));
    });
    return () => {
      cancelled = true;
      if (scanner?.isScanning) scanner.stop().then(() => scanner?.clear()).catch(() => {});
    };
  }, [id]);

  return (
    <div className="space-y-2">
      <div id={id} className="overflow-hidden rounded-2xl bg-muted" />
      {err && <p className="text-sm text-destructive">{err}</p>}
    </div>
  );
}
