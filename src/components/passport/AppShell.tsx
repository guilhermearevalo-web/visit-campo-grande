import { Link, useNavigate } from "@tanstack/react-router";
import { Home, MapPin, BookOpen, Ticket, ScanLine, Shield, Store, LogOut, LogIn } from "lucide-react";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { APP_NAME, useAuthUser, useRoles } from "@/lib/passport";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/", label: "Início", icon: Home },
  { to: "/atrativos", label: "Atrativos", icon: MapPin },
  { to: "/escanear", label: "Escanear", icon: ScanLine },
  { to: "/passaporte", label: "Passaporte", icon: BookOpen },
  { to: "/vouchers", label: "Vouchers", icon: Ticket },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAuthUser();
  const { data: roles = [] } = useRoles(user?.id);
  const navigate = useNavigate();
  const isStaff = roles.includes("admin") || roles.includes("manager");
  const isPartner = roles.includes("partner") || isStaff;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
          <Link to="/" className="flex items-center gap-2 font-extrabold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sunset text-primary-foreground">
              <MapPin className="h-4 w-4" />
            </span>
            <span className="text-sm sm:text-base">{APP_NAME}</span>
          </Link>
          <nav className="ml-6 hidden gap-1 md:flex">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted" activeProps={{ className: "bg-secondary text-secondary-foreground font-semibold" }} activeOptions={{ exact: n.to === "/" }}>
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1">
            {isPartner && (
              <Button asChild variant="ghost" size="sm"><Link to="/parceiro"><Store className="h-4 w-4" /><span className="hidden sm:inline">Parceiro</span></Link></Button>
            )}
            {isStaff && (
              <Button asChild variant="ghost" size="sm"><Link to="/admin"><Shield className="h-4 w-4" /><span className="hidden sm:inline">Admin</span></Link></Button>
            )}
            {user ? (
              <Button variant="ghost" size="icon" aria-label="Sair" onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/" }); }}>
                <LogOut className="h-4 w-4" />
              </Button>
            ) : (
              <Button asChild size="sm"><Link to="/auth"><LogIn className="h-4 w-4" />Entrar</Link></Button>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-background/95 backdrop-blur md:hidden">
        {NAV.map((n) => (
          <Link key={n.to} to={n.to} className="flex flex-col items-center gap-0.5 py-2 text-[11px] text-muted-foreground" activeProps={{ className: "text-primary font-semibold" }} activeOptions={{ exact: n.to === "/" }}>
            <n.icon className="h-5 w-5" />
            {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, text, action }: { icon: typeof Home; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed bg-card px-6 py-12 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-primary"><Icon className="h-6 w-6" /></div>
      <h3 className="font-bold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{text}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
