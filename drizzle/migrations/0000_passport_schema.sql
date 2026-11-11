
create type public.app_role as enum ('tourist','partner','manager','admin');
create type public.attraction_category as enum ('parque','cultural','gastronomia','historico','feira','museu','natureza','outro');
create type public.validation_mode as enum ('geofence','code','both');
create type public.validation_type as enum ('geofence','qrcode','partner_code','manual_admin');
create type public.partner_status as enum ('pending','active','suspended');
create type public.reward_type as enum ('discount','gift','badge','experience');
create type public.voucher_status as enum ('available','redeemed','expired');

-- destinations
create table public.destinations (
  id uuid primary key default gen_random_uuid(),
  name text not null, slug text not null unique, state text not null,
  logo_url text, banner_url text, primary_color text, active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.destinations to anon, authenticated;
grant insert, update, delete on public.destinations to authenticated;
grant all on public.destinations to service_role;
alter table public.destinations enable row level security;

-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text, email text, avatar_url text, city_origin text, state_origin text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

-- roles
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select, insert, delete on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;
create or replace function public.is_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role in ('admin','manager'))
$$;

create policy "dest public read" on public.destinations for select using (true);
create policy "dest staff write" on public.destinations for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create policy "profile own read" on public.profiles for select to authenticated using (auth.uid() = id or public.is_staff(auth.uid()));
create policy "profile own insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "profile own update" on public.profiles for update to authenticated using (auth.uid() = id);

create policy "roles own read" on public.user_roles for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));
create policy "roles admin insert" on public.user_roles for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "roles admin delete" on public.user_roles for delete to authenticated using (public.has_role(auth.uid(),'admin'));

-- attractions
create table public.attractions (
  id uuid primary key default gen_random_uuid(),
  destination_id uuid not null references public.destinations(id) on delete cascade,
  name text not null, slug text not null,
  category public.attraction_category not null default 'outro',
  description text, history text, cover_image_url text, gallery_urls text[] not null default '{}',
  address text, latitude numeric not null, longitude numeric not null,
  geofence_radius_meters int not null default 150,
  validation_mode public.validation_mode not null default 'geofence',
  partner_code text not null default upper(substr(md5(random()::text),1,6)),
  qr_code_token uuid not null unique default gen_random_uuid(),
  points_reward int not null default 10, requires_photo boolean not null default false,
  opening_hours text, contact_phone text, instagram text, website text,
  is_passport_active boolean not null default true, order_sequence int not null default 0,
  created_at timestamptz not null default now(),
  unique (destination_id, slug)
);
grant select (id,destination_id,name,slug,category,description,history,cover_image_url,gallery_urls,address,latitude,longitude,geofence_radius_meters,validation_mode,points_reward,requires_photo,opening_hours,contact_phone,instagram,website,is_passport_active,order_sequence,created_at) on public.attractions to anon, authenticated;
grant insert, update, delete on public.attractions to authenticated;
grant all on public.attractions to service_role;
alter table public.attractions enable row level security;
create policy "attr public read" on public.attractions for select using (is_passport_active or public.is_staff(auth.uid()));
create policy "attr staff insert" on public.attractions for insert to authenticated with check (public.is_staff(auth.uid()));
create policy "attr staff update" on public.attractions for update to authenticated using (public.is_staff(auth.uid()));
create policy "attr staff delete" on public.attractions for delete to authenticated using (public.is_staff(auth.uid()));

-- checkins
create table public.passport_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  attraction_id uuid not null references public.attractions(id) on delete cascade,
  destination_id uuid not null references public.destinations(id) on delete cascade,
  validation_type public.validation_type not null,
  created_at timestamptz not null default now(),
  unique (user_id, attraction_id)
);
grant select on public.passport_checkins to authenticated;
grant all on public.passport_checkins to service_role;
alter table public.passport_checkins enable row level security;
create policy "checkin own read" on public.passport_checkins for select to authenticated using (auth.uid() = user_id or public.is_staff(auth.uid()));

-- partners
create table public.commercial_partners (
  id uuid primary key default gen_random_uuid(),
  destination_id uuid not null references public.destinations(id) on delete cascade,
  owner_id uuid references public.profiles(id) on delete set null,
  business_name text not null, trade_name text, category text, logo_url text,
  address text, phone text, email text,
  status public.partner_status not null default 'pending',
  created_at timestamptz not null default now()
);
grant select on public.commercial_partners to anon, authenticated;
grant insert, update, delete on public.commercial_partners to authenticated;
grant all on public.commercial_partners to service_role;
alter table public.commercial_partners enable row level security;
create policy "partner read" on public.commercial_partners for select using (status = 'active' or owner_id = auth.uid() or public.is_staff(auth.uid()));
create policy "partner staff write" on public.commercial_partners for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- rewards
create table public.rewards (
  id uuid primary key default gen_random_uuid(),
  destination_id uuid not null references public.destinations(id) on delete cascade,
  partner_id uuid references public.commercial_partners(id) on delete set null,
  title text not null, description text,
  required_checkins_count int not null default 1,
  reward_type public.reward_type not null default 'discount',
  discount_percentage int, voucher_prefix text not null default 'CG',
  stock_limit int, is_active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.rewards to anon, authenticated;
grant insert, update, delete on public.rewards to authenticated;
grant all on public.rewards to service_role;
alter table public.rewards enable row level security;
create policy "reward read" on public.rewards for select using (is_active or public.is_staff(auth.uid()));
create policy "reward staff write" on public.rewards for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- vouchers
create table public.user_vouchers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  reward_id uuid not null references public.rewards(id) on delete cascade,
  voucher_code text not null unique, qr_code_data text not null,
  status public.voucher_status not null default 'available',
  redeemed_at timestamptz, redeemed_by_partner_id uuid references public.commercial_partners(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (user_id, reward_id)
);
grant select on public.user_vouchers to authenticated;
grant all on public.user_vouchers to service_role;
alter table public.user_vouchers enable row level security;
create policy "voucher own read" on public.user_vouchers for select to authenticated using (auth.uid() = user_id or public.is_staff(auth.uid()));

-- new user trigger: first user becomes admin
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email,'@',1)), new.email, new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'tourist') on conflict do nothing;
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin') on conflict do nothing;
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- voucher granting
create or replace function public._grant_vouchers(_user uuid, _dest uuid)
returns int language plpgsql security definer set search_path = public as $$
declare r record; cnt int; issued int; n int := 0; code text;
begin
  select count(*) into cnt from passport_checkins where user_id = _user and destination_id = _dest;
  for r in select * from rewards where destination_id = _dest and is_active and required_checkins_count <= cnt loop
    if exists (select 1 from user_vouchers where user_id = _user and reward_id = r.id) then continue; end if;
    select count(*) into issued from user_vouchers where reward_id = r.id;
    if r.stock_limit is not null and issued >= r.stock_limit then continue; end if;
    code := r.voucher_prefix || '-' || upper(substr(md5(random()::text || clock_timestamp()::text),1,6));
    insert into user_vouchers (user_id, reward_id, voucher_code, qr_code_data) values (_user, r.id, code, 'VOUCHER:' || code);
    n := n + 1;
  end loop;
  return n;
end $$;
revoke execute on function public._grant_vouchers(uuid,uuid) from public, anon, authenticated;

create or replace function public._do_checkin(_attr public.attractions, _type public.validation_type)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v int;
begin
  if auth.uid() is null then raise exception 'Faça login para registrar a visita'; end if;
  if exists (select 1 from passport_checkins where user_id = auth.uid() and attraction_id = _attr.id) then
    return jsonb_build_object('ok', true, 'already', true, 'attraction', _attr.name);
  end if;
  insert into passport_checkins (user_id, attraction_id, destination_id, validation_type) values (auth.uid(), _attr.id, _attr.destination_id, _type);
  v := public._grant_vouchers(auth.uid(), _attr.destination_id);
  return jsonb_build_object('ok', true, 'already', false, 'attraction', _attr.name, 'new_vouchers', v);
end $$;
revoke execute on function public._do_checkin(public.attractions, public.validation_type) from public, anon, authenticated;

create or replace function public.checkin_geofence(_attraction_id uuid, _lat double precision, _lng double precision)
returns jsonb language plpgsql security definer set search_path = public as $$
declare a attractions; d double precision;
begin
  select * into a from attractions where id = _attraction_id and is_passport_active;
  if a.id is null then raise exception 'Atrativo não encontrado'; end if;
  if a.validation_mode = 'code' then raise exception 'Este atrativo só aceita QR Code ou código'; end if;
  d := 2 * 6371000 * asin(sqrt(power(sin(radians(a.latitude::float8 - _lat)/2),2) + cos(radians(_lat)) * cos(radians(a.latitude::float8)) * power(sin(radians(a.longitude::float8 - _lng)/2),2)));
  if d > a.geofence_radius_meters then
    return jsonb_build_object('ok', false, 'distance', round(d), 'radius', a.geofence_radius_meters);
  end if;
  return public._do_checkin(a, 'geofence') || jsonb_build_object('distance', round(d));
end $$;

create or replace function public.checkin_qr(_token uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare a attractions;
begin
  select * into a from attractions where qr_code_token = _token and is_passport_active;
  if a.id is null then raise exception 'QR Code inválido'; end if;
  return public._do_checkin(a, 'qrcode');
end $$;

create or replace function public.checkin_code(_attraction_id uuid, _code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare a attractions;
begin
  select * into a from attractions where id = _attraction_id and is_passport_active;
  if a.id is null then raise exception 'Atrativo não encontrado'; end if;
  if upper(trim(_code)) <> upper(a.partner_code) then return jsonb_build_object('ok', false, 'invalid_code', true); end if;
  return public._do_checkin(a, 'partner_code');
end $$;

create or replace function public.attraction_by_qr(_token uuid)
returns text language sql stable security definer set search_path = public as $$
  select slug from attractions where qr_code_token = _token and is_passport_active
$$;

create or replace function public.admin_attraction_secrets()
returns table (id uuid, partner_code text, qr_code_token uuid) language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_staff(auth.uid()) then raise exception 'Acesso negado'; end if;
  return query select a.id, a.partner_code, a.qr_code_token from attractions a;
end $$;

create or replace function public.redeem_voucher(_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v user_vouchers; r rewards; p uuid; nm text;
begin
  if not (public.has_role(auth.uid(),'partner') or public.is_staff(auth.uid())) then raise exception 'Apenas parceiros podem validar vouchers'; end if;
  _code := upper(trim(regexp_replace(_code, '^VOUCHER:', '', 'i')));
  select * into v from user_vouchers where voucher_code = _code for update;
  if v.id is null then return jsonb_build_object('ok', false, 'reason', 'not_found'); end if;
  select * into r from rewards where id = v.reward_id;
  select full_name into nm from profiles where id = v.user_id;
  if v.status <> 'available' then return jsonb_build_object('ok', false, 'reason', v.status, 'redeemed_at', v.redeemed_at, 'title', r.title); end if;
  select id into p from commercial_partners where owner_id = auth.uid() limit 1;
  update user_vouchers set status = 'redeemed', redeemed_at = now(), redeemed_by_partner_id = p where id = v.id;
  return jsonb_build_object('ok', true, 'title', r.title, 'tourist', nm, 'code', v.voucher_code);
end $$;

create or replace function public.deliver_reward_retroactive(_reward_id uuid)
returns int language plpgsql security definer set search_path = public as $$
declare r rewards; u record; before int; after int;
begin
  if not public.is_staff(auth.uid()) then raise exception 'Acesso negado'; end if;
  select * into r from rewards where id = _reward_id;
  select count(*) into before from user_vouchers where reward_id = _reward_id;
  for u in select user_id from passport_checkins where destination_id = r.destination_id group by user_id having count(*) >= r.required_checkins_count loop
    perform public._grant_vouchers(u.user_id, r.destination_id);
  end loop;
  select count(*) into after from user_vouchers where reward_id = _reward_id;
  return after - before;
end $$;

create or replace function public.admin_manual_checkin(_user uuid, _attraction_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare a attractions;
begin
  if not public.is_staff(auth.uid()) then raise exception 'Acesso negado'; end if;
  select * into a from attractions where id = _attraction_id;
  insert into passport_checkins (user_id, attraction_id, destination_id, validation_type) values (_user, a.id, a.destination_id, 'manual_admin') on conflict do nothing;
  perform public._grant_vouchers(_user, a.destination_id);
  return jsonb_build_object('ok', true);
end $$;

-- seed
with d as (
  insert into public.destinations (name, slug, state, primary_color) values ('Campo Grande','campo-grande','MS','#E05326') returning id
), a as (
  insert into public.attractions (destination_id, name, slug, category, order_sequence, latitude, longitude, geofence_radius_meters, validation_mode, partner_code, description, address)
  select d.id, x.* from d, (values
    ('Parque das Nações Indígenas','parque-das-nacoes-indigenas','parque'::public.attraction_category,1,-20.4532,-54.5826,80,'geofence'::public.validation_mode,'PNI001','Principal parque urbano da cidade, perfeito para caminhar entre áreas arborizadas, relaxar à beira do lago e observar de perto capivaras e aves no seu habitat natural.','Av. Afonso Pena, Campo Grande - MS'),
    ('Museu das Culturas Dom Bosco','museu-das-culturas-dom-bosco','museu',2,-20.4545,-54.5802,500,'geofence','MCDB02','Localizado no Parque das Nações Indígenas, oferece uma imersão na cultura indígena e na biodiversidade do Centro-Oeste, com artefatos, fósseis e espécies do Pantanal.','Parque das Nações Indígenas, Campo Grande - MS'),
    ('Bioparque Pantanal','bioparque-pantanal','cultural',3,-20.4560,-54.5860,92,'geofence','BIOP03','O maior aquário de água doce do mundo. Arquitetura icônica e tanques gigantes com peixes e ecossistemas pantaneiros.','Av. Afonso Pena, 6001, Campo Grande - MS'),
    ('Mercadão Municipal Antônio Valente','mercadao-municipal','gastronomia',4,-20.4632,-54.6152,500,'both','BGYP77','Espaço gastronômico tradicional para almoçar pratos típicos como o famoso sobá, pastéis, caldos e comprar erva-mate de tereré e doces artesanais.','R. 7 de Setembro, Centro, Campo Grande - MS'),
    ('Morada dos Baís','morada-dos-bais','historico',5,-20.4618,-54.6189,500,'geofence','MBAI05','Patrimônio histórico do centro de Campo Grande com arquitetura marcante e memória ligada à pioneira artista plástica Lídia Baís.','Av. Noroeste, Centro, Campo Grande - MS'),
    ('Casa do Artesão','casa-do-artesao','cultural',6,-20.4628,-54.6141,500,'both','IKLGOL','Espaço dedicado ao artesanato sul-mato-grossense, com peças originais em madeira, cerâmica kadiwéu e lembranças culturais da viagem.','Av. Calógeras, Centro, Campo Grande - MS'),
    ('Praça Ary Coelho','praca-ary-coelho','historico',7,-20.4625,-54.6128,500,'geofence','PAC007','O coração do centro comercial e histórico de Campo Grande, com arborização exuberante, chafariz e grande circulação cotidiana de moradores.','Av. Afonso Pena, Centro, Campo Grande - MS'),
    ('Mirante da Orla Morena','mirante-orla-morena','parque',8,-20.4550,-54.6300,600,'geofence','MOM008','Espaço arborizado ideal para caminhadas no fim da tarde, contemplação do pôr do sol e observação de aviões pousando no aeroporto.','Orla Morena, Campo Grande - MS'),
    ('Feira Central de Campo Grande (Feirona)','feira-central','feira',9,-20.4578,-54.6183,500,'both','EWJEXG','O ponto noturno mais tradicional da cidade, famoso pelo sobá campo-grandense (patrimônio imaterial registrado), espetinhos com mandioca e cultura nipônica.','R. 14 de Julho, Centro, Campo Grande - MS')
  ) as x(name, slug, category, order_sequence, latitude, longitude, geofence_radius_meters, validation_mode, partner_code, description, address)
  returning 1
)
insert into public.rewards (destination_id, title, description, required_checkins_count, reward_type, discount_percentage, voucher_prefix, stock_limit)
select d.id, '10% de Desconto na Cidade Morena', 'Recompensa especial desbloqueada ao concluir o Passaporte Digital de Campo Grande.', 8, 'discount', 10, 'MS1234CG', 50 from d;
