import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { Shield } from "lucide-react";
import { AppShell, EmptyState } from "@/components/passport/AppShell";
import { APP_NAME, useAuthUser, useRoles } from "@/lib/passport";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: `Painel Administrativo — ${APP_NAME}` },
      { name: "description", content: "Gestão do Passaporte Digital Turístico de Campo Grande." },
      { property: "og:title", content: `Painel ADM — ${APP_NAME}` },
      { property: "og:description", content: "Indicadores, atrativos, recompensas e parceiros." },
    ],
  }),
  component: AdminLayout,
});

const TABS = [
  { to: "/admin", label: "Dashboard" },
  { to: "/admin/atrativos", label: "Atrativos" },
  { to: "/admin/rotas", label: "Rotas Temáticas" },
  { to: "/admin/recompensas", label: "Recompensas" },
  { to: "/admin/parceiros", label: "Parceiros & Equipe" },
] as const;

function AdminLayout() {
  const { user } = useAuthUser();
  const { data: roles, isLoading } = useRoles(user?.id);
  if (isLoading || !roles) return <AppShell><div /></AppShell>;
  if (!roles.includes("admin") && !roles.includes("manager"))
    return <AppShell><EmptyState icon={Shield} title="Acesso restrito" text="Esta área é exclusiva da gestão de turismo de Campo Grande." /></AppShell>;
  return (
    <AppShell>
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-2xl border bg-card p-1">
        {TABS.map((t) => (
          <Link key={t.to} to={t.to} activeOptions={{ exact: true }} className="whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground" activeProps={{ className: "bg-primary text-primary-foreground" }}>{t.label}</Link>
        ))}
      </div>
      <Outlet />
    </AppShell>
  );
}
