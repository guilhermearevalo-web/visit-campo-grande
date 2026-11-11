import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, Users, Stamp, MapPin, Ticket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { downloadCsv } from "@/lib/passport";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/")({ component: Dashboard });

const PERIODS = { hoje: 1, "7 dias": 7, "30 dias": 30, mês: 31, ano: 365 } as const;
const TYPE_LABEL: Record<string, string> = { geofence: "GPS", qrcode: "QR Code", partner_code: "Código", manual_admin: "Manual" };
const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"];

function Dashboard() {
  const [period, setPeriod] = useState<keyof typeof PERIODS>("30 dias");
  const { data } = useQuery({
    queryKey: ["admin-dash"],
    queryFn: async () => {
      const [c, p, a, v] = await Promise.all([
        supabase.from("passport_checkins").select("id,user_id,attraction_id,validation_type,created_at").order("created_at"),
        supabase.from("profiles").select("id,full_name,email,city_origin,state_origin,created_at"),
        supabase.from("attractions").select("id,name"),
        supabase.from("user_vouchers").select("id,status,voucher_code,created_at,redeemed_at,user_id"),
      ]);
      return { checkins: c.data ?? [], profiles: p.data ?? [], attractions: a.data ?? [], vouchers: v.data ?? [] };
    },
  });
  const d = data ?? { checkins: [], profiles: [], attractions: [], vouchers: [] };

  const since = useMemo(() => {
    const s = new Date(); s.setHours(0, 0, 0, 0); s.setDate(s.getDate() - (PERIODS[period] - 1)); return s;
  }, [period]);
  const filtered = d.checkins.filter((c) => new Date(c.created_at) >= since);

  const timeline = useMemo(() => {
    const byYear = PERIODS[period] > 31;
    const map = new Map<string, number>();
    filtered.forEach((c) => {
      const dt = new Date(c.created_at);
      const k = byYear ? dt.toLocaleDateString("pt-BR", { month: "short" }) : dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      map.set(k, (map.get(k) ?? 0) + 1);
    });
    return Array.from(map, ([k, v]) => ({ k, v }));
  }, [filtered, period]);
  const ranking = d.attractions.map((a) => ({ name: a.name, v: filtered.filter((c) => c.attraction_id === a.id).length })).sort((x, y) => y.v - x.v);
  const types = Object.keys(TYPE_LABEL).map((t) => ({ name: TYPE_LABEL[t], value: filtered.filter((c) => c.validation_type === t).length })).filter((t) => t.value > 0);

  function exportAll() {
    const aName = new Map(d.attractions.map((a) => [a.id, a.name]));
    const prof = new Map(d.profiles.map((p) => [p.id, p]));
    downloadCsv("checkins-campo-grande.csv", d.checkins.map((c) => ({ data: new Date(c.created_at).toLocaleString("pt-BR"), turista: prof.get(c.user_id)?.full_name, email: prof.get(c.user_id)?.email, cidade_origem: prof.get(c.user_id)?.city_origin, uf_origem: prof.get(c.user_id)?.state_origin, atrativo: aName.get(c.attraction_id), validacao: TYPE_LABEL[c.validation_type] })));
    downloadCsv("turistas-campo-grande.csv", d.profiles.map((p) => ({ nome: p.full_name, email: p.email, cidade: p.city_origin, uf: p.state_origin, cadastro: new Date(p.created_at).toLocaleString("pt-BR"), carimbos: d.checkins.filter((c) => c.user_id === p.id).length })));
    downloadCsv("vouchers-campo-grande.csv", d.vouchers.map((v) => ({ codigo: v.voucher_code, status: v.status, emitido: new Date(v.created_at).toLocaleString("pt-BR"), resgatado: v.redeemed_at ? new Date(v.redeemed_at).toLocaleString("pt-BR") : "" })));
  }

  const stats = [
    { label: "Turistas registrados", v: d.profiles.length, icon: Users },
    { label: "Check-ins totais", v: d.checkins.length, icon: Stamp },
    { label: "Atrativos", v: d.attractions.length, icon: MapPin },
    { label: "Vouchers resgatados", v: `${d.vouchers.filter((v) => v.status === "redeemed").length}/${d.vouchers.length}`, icon: Ticket },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1">
          {(Object.keys(PERIODS) as (keyof typeof PERIODS)[]).map((p) => (
            <Button key={p} size="sm" variant={p === period ? "default" : "outline"} className="rounded-full capitalize" onClick={() => setPeriod(p)}>{p}</Button>
          ))}
        </div>
        <Button variant="outline" onClick={exportAll}><Download className="h-4 w-4" />Exportar CSV (Excel)</Button>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border bg-card p-4 shadow-sm">
            <s.icon className="h-5 w-5 text-primary" />
            <p className="mt-2 text-2xl font-extrabold">{s.v}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border bg-card p-4 shadow-sm lg:col-span-2">
          <h3 className="mb-3 font-bold">Visitas no período ({filtered.length})</h3>
          {timeline.length === 0 ? <p className="py-16 text-center text-sm text-muted-foreground">Nenhuma visita registrada neste período.</p> : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={timeline}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="k" fontSize={11} /><YAxis allowDecimals={false} fontSize={11} /><Tooltip /><Bar dataKey="v" name="Visitas" fill="var(--chart-1)" radius={[6, 6, 0, 0]} /></BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <h3 className="mb-3 font-bold">Tipo de validação</h3>
          {types.length === 0 ? <p className="py-16 text-center text-sm text-muted-foreground">Sem dados ainda.</p> : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart><Pie data={types} dataKey="value" innerRadius={45} outerRadius={75}>{types.map((_, i) => <Cell key={i} fill={COLORS[i % 4]} />)}</Pie><Tooltip /></PieChart>
              </ResponsiveContainer>
              <ul className="space-y-1 text-sm">{types.map((t, i) => <li key={t.name} className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: COLORS[i % 4] }} />{t.name}: <b>{t.value}</b></li>)}</ul>
            </>
          )}
        </div>
      </div>
      <div className="rounded-2xl border bg-card p-4 shadow-sm">
        <h3 className="mb-3 font-bold">Ranking de popularidade</h3>
        <ol className="space-y-2">
          {ranking.map((r, i) => (
            <li key={r.name} className="flex items-center gap-3 text-sm">
              <span className="w-6 font-extrabold text-primary">{i + 1}º</span>
              <span className="flex-1">{r.name}</span>
              <div className="h-2 w-32 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${ranking[0]?.v ? (r.v / ranking[0].v) * 100 : 0}%` }} /></div>
              <b className="w-8 text-right">{r.v}</b>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
