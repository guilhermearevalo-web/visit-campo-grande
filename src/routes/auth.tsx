import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { MapPin, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { APP_NAME } from "@/lib/passport";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const safe = (p?: string) => (p && p.startsWith("/") && !p.startsWith("//") ? p : "/");

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({ redirect: z.string().optional() }),
  head: () => ({
    meta: [
      { title: `Entrar — ${APP_NAME}` },
      { name: "description", content: "Entre ou crie sua conta no Passaporte Digital de Campo Grande." },
      { property: "og:title", content: `Entrar — ${APP_NAME}` },
      { property: "og:description", content: "Acesse seu Passaporte Digital Turístico de Campo Grande - MS." },
    ],
  }),
  component: AuthPage,
});

function GoogleIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
  );
}

function AuthPage() {
  const { redirect } = Route.useSearch();
  const target = safe(redirect);
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ name: "", email: "", password: "" });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { if (data.user) navigate({ to: target }); });
    const { data } = supabase.auth.onAuthStateChange((e, s) => { if (e === "SIGNED_IN" && s) navigate({ to: target }); });
    return () => data.subscription.unsubscribe();
  }, [navigate, target]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: f.email, password: f.password });
    setBusy(false);
    if (error) toast.error("E-mail ou senha incorretos.");
  }
  async function signUp(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    const { error } = await supabase.auth.signUp({ email: f.email, password: f.password, options: { emailRedirectTo: window.location.origin + target, data: { full_name: f.name } } });
    setBusy(false);
    if (error) toast.error(error.message); else toast.success("Conta criada! Confirme pelo link enviado ao seu e-mail.");
  }
  async function google() {
    if (target !== "/") sessionStorage.setItem("post-auth", target);
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) toast.error("Não foi possível entrar com Google.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-sunset p-4">
      <div className="w-full max-w-md rounded-3xl bg-card p-7 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-sunset text-primary-foreground"><MapPin /></div>
          <h1 className="text-xl font-extrabold">{APP_NAME}</h1>
          <p className="text-sm text-muted-foreground">Passaporte Digital Turístico de Campo Grande - MS</p>
        </div>
        <Button type="button" variant="outline" className="w-full gap-2.5 border-[#747775] bg-[#FFFFFF] text-[#1F1F1F] hover:bg-[#F2F2F2]" onClick={google}>
          <GoogleIcon /> Continuar com Google
        </Button>
        <div className="my-4 text-center text-xs text-muted-foreground">ou com e-mail</div>
        <Tabs defaultValue="in">
          <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="in">Entrar</TabsTrigger><TabsTrigger value="up">Criar conta</TabsTrigger></TabsList>
          <TabsContent value="in">
            <form onSubmit={signIn} className="space-y-3 pt-2">
              <div><Label>E-mail</Label><Input type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
              <div><Label>Senha</Label><Input type="password" required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></div>
              <Button className="w-full" disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Entrar</Button>
            </form>
          </TabsContent>
          <TabsContent value="up">
            <form onSubmit={signUp} className="space-y-3 pt-2">
              <div><Label>Nome completo</Label><Input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
              <div><Label>E-mail</Label><Input type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
              <div><Label>Senha</Label><Input type="password" minLength={6} required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></div>
              <Button className="w-full" disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Criar conta</Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
