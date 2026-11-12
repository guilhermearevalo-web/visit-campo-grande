ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS home_display text NOT NULL DEFAULT 'tabs';
ALTER TABLE public.rewards ADD COLUMN IF NOT EXISTS route_only boolean NOT NULL DEFAULT false;
ALTER TABLE public.commercial_partners ADD COLUMN IF NOT EXISTS whatsapp text;
ALTER TABLE public.commercial_partners ADD COLUMN IF NOT EXISTS facade_url text;

CREATE TABLE public.thematic_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id uuid NOT NULL REFERENCES public.destinations(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  cover_image_url text,
  estimated_duration text,
  mode text NOT NULL DEFAULT 'free',
  reward_id uuid REFERENCES public.rewards(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  order_sequence integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.thematic_routes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.thematic_routes TO authenticated;
GRANT ALL ON public.thematic_routes TO service_role;
ALTER TABLE public.thematic_routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "route read" ON public.thematic_routes FOR SELECT USING (is_active OR public.is_staff(auth.uid()));
CREATE POLICY "route staff write" ON public.thematic_routes FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.route_checkpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id uuid NOT NULL REFERENCES public.thematic_routes(id) ON DELETE CASCADE,
  attraction_id uuid NOT NULL REFERENCES public.attractions(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  UNIQUE (route_id, attraction_id)
);
GRANT SELECT ON public.route_checkpoints TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.route_checkpoints TO authenticated;
GRANT ALL ON public.route_checkpoints TO service_role;
ALTER TABLE public.route_checkpoints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "checkpoint read" ON public.route_checkpoints FOR SELECT USING (true);
CREATE POLICY "checkpoint staff write" ON public.route_checkpoints FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE OR REPLACE FUNCTION public._grant_vouchers(_user uuid, _dest uuid)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
declare r record; cnt int; issued int; n int := 0; code text;
begin
  select count(*) into cnt from passport_checkins where user_id = _user and destination_id = _dest;
  for r in select * from rewards where destination_id = _dest and is_active and not route_only and required_checkins_count <= cnt loop
    if exists (select 1 from user_vouchers where user_id = _user and reward_id = r.id) then continue; end if;
    select count(*) into issued from user_vouchers where reward_id = r.id;
    if r.stock_limit is not null and issued >= r.stock_limit then continue; end if;
    code := r.voucher_prefix || '-' || upper(substr(md5(random()::text || clock_timestamp()::text),1,6));
    insert into user_vouchers (user_id, reward_id, voucher_code, qr_code_data) values (_user, r.id, code, 'VOUCHER:' || code);
    n := n + 1;
  end loop;
  return n;
end $$;
REVOKE EXECUTE ON FUNCTION public._grant_vouchers(uuid,uuid) FROM public, anon, authenticated;

-- Route completed? free: all checkpoints visited; sequential: visited in checkpoint order.
CREATE OR REPLACE FUNCTION public._route_completed(_user uuid, _route uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
declare rt thematic_routes; total int; visited int; prev timestamptz := '-infinity'; c record;
begin
  select * into rt from thematic_routes where id = _route;
  select count(*) into total from route_checkpoints where route_id = _route;
  if total = 0 then return false; end if;
  select count(*) into visited from route_checkpoints rc join passport_checkins pc on pc.attraction_id = rc.attraction_id and pc.user_id = _user where rc.route_id = _route;
  if visited < total then return false; end if;
  if rt.mode = 'sequential' then
    for c in select pc.created_at from route_checkpoints rc join passport_checkins pc on pc.attraction_id = rc.attraction_id and pc.user_id = _user where rc.route_id = _route order by rc.position loop
      if c.created_at < prev then return false; end if;
      prev := c.created_at;
    end loop;
  end if;
  return true;
end $$;
REVOKE EXECUTE ON FUNCTION public._route_completed(uuid,uuid) FROM public, anon, authenticated;

CREATE OR REPLACE FUNCTION public._grant_route_vouchers(_user uuid, _attraction uuid)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
declare rt record; r rewards; issued int; n int := 0; code text;
begin
  for rt in select t.* from thematic_routes t join route_checkpoints rc on rc.route_id = t.id where rc.attraction_id = _attraction and t.is_active and t.reward_id is not null loop
    if not public._route_completed(_user, rt.id) then continue; end if;
    select * into r from rewards where id = rt.reward_id and is_active;
    if r.id is null then continue; end if;
    if exists (select 1 from user_vouchers where user_id = _user and reward_id = r.id) then continue; end if;
    select count(*) into issued from user_vouchers where reward_id = r.id;
    if r.stock_limit is not null and issued >= r.stock_limit then continue; end if;
    code := r.voucher_prefix || '-' || upper(substr(md5(random()::text || clock_timestamp()::text),1,6));
    insert into user_vouchers (user_id, reward_id, voucher_code, qr_code_data) values (_user, r.id, code, 'VOUCHER:' || code);
    n := n + 1;
  end loop;
  return n;
end $$;
REVOKE EXECUTE ON FUNCTION public._grant_route_vouchers(uuid,uuid) FROM public, anon, authenticated;

CREATE OR REPLACE FUNCTION public._do_checkin(_attr public.attractions, _type public.validation_type)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
declare v int;
begin
  if auth.uid() is null then raise exception 'Faça login para registrar a visita'; end if;
  if exists (select 1 from passport_checkins where user_id = auth.uid() and attraction_id = _attr.id) then
    return jsonb_build_object('ok', true, 'already', true, 'attraction', _attr.name);
  end if;
  insert into passport_checkins (user_id, attraction_id, destination_id, validation_type) values (auth.uid(), _attr.id, _attr.destination_id, _type);
  v := public._grant_vouchers(auth.uid(), _attr.destination_id) + public._grant_route_vouchers(auth.uid(), _attr.id);
  return jsonb_build_object('ok', true, 'already', false, 'attraction', _attr.name, 'new_vouchers', v);
end $$;
REVOKE EXECUTE ON FUNCTION public._do_checkin(public.attractions, public.validation_type) FROM public, anon, authenticated;

CREATE OR REPLACE FUNCTION public.partner_redemption_history()
RETURNS TABLE(voucher_code text, redeemed_at timestamptz, tourist text, reward_title text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  select v.voucher_code, v.redeemed_at, p.full_name, r.title
  from user_vouchers v join rewards r on r.id = v.reward_id left join profiles p on p.id = v.user_id
  where v.status = 'redeemed' and (
    public.is_staff(auth.uid())
    or v.redeemed_by_partner_id in (select id from commercial_partners where owner_id = auth.uid()))
  order by v.redeemed_at desc limit 200
$$;
REVOKE EXECUTE ON FUNCTION public.partner_redemption_history() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.partner_redemption_history() TO authenticated;

CREATE POLICY "media public read" ON storage.objects FOR SELECT USING (bucket_id IN ('attractions-media','routes-media','partner-media'));
CREATE POLICY "media staff insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id IN ('attractions-media','routes-media','partner-media') AND public.is_staff(auth.uid()));
CREATE POLICY "media staff update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id IN ('attractions-media','routes-media','partner-media') AND public.is_staff(auth.uid()));
CREATE POLICY "media staff delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id IN ('attractions-media','routes-media','partner-media') AND public.is_staff(auth.uid()));
