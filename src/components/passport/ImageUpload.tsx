import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

type Bucket = "attractions-media" | "routes-media" | "partner-media";
const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

/** Uploads straight to Lovable Cloud storage and returns a long-lived signed URL. */
export function ImageUpload({ bucket, value, onChange, label = "Foto" }: { bucket: Bucket; value: string; onChange: (url: string) => void; label?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [pct, setPct] = useState<number | null>(null);

  async function upload(file: File) {
    if (!file.type.startsWith("image/")) { toast.error("Escolha um arquivo de imagem."); return; }
    setPct(20);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const t = setInterval(() => setPct((p) => (p != null && p < 85 ? p + 10 : p)), 200);
    const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type, upsert: false });
    clearInterval(t);
    if (error) { setPct(null); toast.error(`Falha no envio: ${error.message}`); return; }
    const { data, error: e2 } = await supabase.storage.from(bucket).createSignedUrl(path, TEN_YEARS);
    setPct(null);
    if (e2 || !data) { toast.error("Não foi possível gerar o link da imagem."); return; }
    onChange(data.signedUrl);
    toast.success("Imagem enviada");
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      {value ? (
        <div className="relative overflow-hidden rounded-xl border">
          <img src={value} alt="" className="h-40 w-full object-cover" />
          <div className="absolute right-2 top-2 flex gap-1">
            <Button size="sm" variant="secondary" type="button" onClick={() => ref.current?.click()}>Trocar</Button>
            <Button size="icon" variant="destructive" type="button" aria-label="Remover imagem" onClick={() => onChange("")}><Trash2 className="h-4 w-4" /></Button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => ref.current?.click()} className="flex h-32 w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed text-sm text-muted-foreground hover:bg-muted">
          {pct != null ? <Loader2 className="h-6 w-6 animate-spin" /> : <ImagePlus className="h-6 w-6" />}
          {pct != null ? "Enviando..." : "Enviar imagem do computador ou celular"}
        </button>
      )}
      {pct != null && <Progress value={pct} className="h-1.5" />}
      <input ref={ref} type="file" accept="image/*" className="hidden" data-testid={`upload-${bucket}`} onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
    </div>
  );
}
