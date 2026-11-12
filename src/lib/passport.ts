import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export const APP_NAME = "VISIT CAMPO GRANDE";
export const DESTINATION_SLUG = "campo-grande";

export type Category = Database["public"]["Enums"]["attraction_category"];
export type AppRole = Database["public"]["Enums"]["app_role"];

/** Public columns only — partner_code / qr_code_token are not readable by clients. */
export const ATTR_COLS =
  "id,destination_id,name,slug,category,description,history,cover_image_url,gallery_urls,address,latitude,longitude,geofence_radius_meters,validation_mode,points_reward,requires_photo,opening_hours,contact_phone,instagram,website,is_passport_active,order_sequence,created_at";

export const CATEGORY_LABEL: Record<Category, string> = {
  parque: "Parque",
  cultural: "Cultural",
  gastronomia: "Gastronomia",
  historico: "Histórico",
  feira: "Feira",
  museu: "Museu",
  natureza: "Natureza",
  outro: "Outro",
};

export function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function progressPercent(done: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((done / total) * 100);
}

export function useAuthUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setLoading(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  return { user, loading };
}

export function useRoles(userId?: string) {
  return useQuery({
    queryKey: ["roles", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId!);
      if (error) throw error;
      return (data ?? []).map((r) => r.role as AppRole);
    },
  });
}

export function useAttractions() {
  return useQuery({
    queryKey: ["attractions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attractions")
        .select(ATTR_COLS)
        .eq("is_passport_active", true)
        .order("order_sequence");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useMyCheckins(userId?: string) {
  return useQuery({
    queryKey: ["checkins", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("passport_checkins")
        .select("attraction_id,validation_type,created_at")
        .eq("user_id", userId!);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function playStamp() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const len = ctx.sampleRate * 0.25;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 6);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 900;
    src.connect(f).connect(ctx.destination);
    src.start();
    if (navigator.vibrate) navigator.vibrate(80);
  } catch {
    /* audio unavailable */
  }
}

export function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]!);
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = "\uFEFF" + [headers.join(";"), ...rows.map((r) => headers.map((h) => esc(r[h])).join(";"))].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export type RouteMode = "free" | "sequential";

/**
 * Route progress. Free: any order. Sequential: a checkpoint only counts when
 * every earlier checkpoint was visited before it.
 */
export function routeProgress(
  checkpointIds: string[],
  checkins: { attraction_id: string; created_at: string }[],
  mode: RouteMode,
) {
  const at = new Map(checkins.map((c) => [c.attraction_id, new Date(c.created_at).getTime()]));
  let done = 0;
  if (mode === "free") done = checkpointIds.filter((id) => at.has(id)).length;
  else {
    let prev = -Infinity;
    for (const id of checkpointIds) {
      const t = at.get(id);
      if (t == null || t < prev) break;
      prev = t;
      done++;
    }
  }
  const total = checkpointIds.length;
  return { done, total, pct: progressPercent(done, total), complete: total > 0 && done === total, nextId: checkpointIds[done] };
}

export function useRoutes() {
  return useQuery({
    queryKey: ["routes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("thematic_routes")
        .select("*, route_checkpoints(attraction_id,position), rewards(title)")
        .eq("is_active", true)
        .order("order_sequence");
      if (error) throw error;
      return (data ?? []).map((r) => ({
        ...r,
        checkpointIds: [...(r.route_checkpoints ?? [])].sort((a, b) => a.position - b.position).map((c) => c.attraction_id),
      }));
    },
  });
}
