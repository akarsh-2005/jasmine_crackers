-- Jasmine Crackers: run this ONCE in Supabase > SQL Editor. Safe to re-run.
create extension if not exists pgcrypto;
create table if not exists admins(user_id uuid primary key references auth.users(id) on delete cascade, created_at timestamptz default now());
create or replace function is_admin() returns boolean language sql security definer stable set search_path=public as $$ select exists(select 1 from admins where user_id=auth.uid()) $$;
create or replace function touch() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;

create table if not exists categories(id uuid primary key default gen_random_uuid(), name text not null unique, slug text not null unique, display_order int not null default 0, created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists products(id uuid primary key default gen_random_uuid(), name text not null, slug text not null unique, description text, sku text,
 category_id uuid not null references categories(id) on delete restrict, price numeric(10,2) check(price>=0), image_url text,
 status text not null default 'available' check(status in('available','out_of_stock','hidden','archived')), display_order int not null default 0,
 created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists orders(id uuid primary key default gen_random_uuid(), order_code text not null unique, customer_name text not null, phone text not null, email text,
 order_type text not null check(order_type in('pickup','delivery')), address text, city text, state text, pincode text, notes text,
 subtotal numeric(12,2) not null default 0, total numeric(12,2) not null default 0, price_pending int not null default 0,
 status text not null default 'pending' check(status in('pending','confirmed','processing','ready','completed','cancelled')), created_at timestamptz default now(), updated_at timestamptz default now());
-- order_items is a SNAPSHOT: name and price at time of order never change when the product changes
create table if not exists order_items(id uuid primary key default gen_random_uuid(), order_id uuid not null references orders(id) on delete cascade,
 product_id uuid references products(id) on delete set null, product_name text not null, unit_price numeric(10,2), qty int not null check(qty between 1 and 99), line_total numeric(12,2));
create table if not exists settings(key text primary key, value text, updated_at timestamptz default now());
create index if not exists products_order on products(status,display_order);
do $$ declare t text; begin foreach t in array array['categories','products','orders'] loop execute format('drop trigger if exists %I_touch on %I; create trigger %I_touch before update on %I for each row execute function touch()',t,t,t,t); end loop; end $$;

alter table admins enable row level security; alter table categories enable row level security; alter table products enable row level security;
alter table orders enable row level security; alter table order_items enable row level security; alter table settings enable row level security;
drop policy if exists a_self on admins; create policy a_self on admins for select to authenticated using(user_id=auth.uid());
drop policy if exists c_read on categories; create policy c_read on categories for select using(true);
drop policy if exists c_admin on categories; create policy c_admin on categories for all to authenticated using(is_admin()) with check(is_admin());
drop policy if exists p_read on products; create policy p_read on products for select using(status in('available','out_of_stock') or is_admin());
drop policy if exists p_admin on products; create policy p_admin on products for all to authenticated using(is_admin()) with check(is_admin());
drop policy if exists o_admin_r on orders; create policy o_admin_r on orders for select to authenticated using(is_admin());
drop policy if exists o_admin_u on orders; create policy o_admin_u on orders for update to authenticated using(is_admin()) with check(is_admin());
drop policy if exists oi_admin_r on order_items; create policy oi_admin_r on order_items for select to authenticated using(is_admin());
drop policy if exists s_read on settings; create policy s_read on settings for select using(true);
drop policy if exists s_admin on settings; create policy s_admin on settings for all to authenticated using(is_admin()) with check(is_admin());
-- Customers get NO insert/update/delete on any table. They can only call place_order() below.

create or replace function place_order(p_customer jsonb,p_order_type text,p_items jsonb) returns jsonb
language plpgsql security definer set search_path=public as $$
declare v_id uuid:=gen_random_uuid(); v_code text; v_day text:=to_char(now() at time zone 'Asia/Kolkata','YYYYMMDD'); v_sub numeric:=0; v_pend int:=0; it jsonb; pr record; q int; ln numeric; out jsonb:='[]'::jsonb;
begin
 if length(trim(coalesce(p_customer->>'name','')))<2 or coalesce(p_customer->>'mobile','')!~'^[6-9][0-9]{9}$' then raise exception 'invalid customer'; end if;
 if p_order_type not in('pickup','delivery') then raise exception 'invalid type'; end if;
 if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items) not between 1 and 100 then raise exception 'invalid items'; end if;
 perform pg_advisory_xact_lock(7001);
 select 'JC-'||v_day||'-'||lpad((count(*)+1)::text,3,'0') into v_code from orders where order_code like 'JC-'||v_day||'-%';
 insert into orders(id,order_code,customer_name,phone,email,order_type,address,city,state,pincode,notes)
 values(v_id,v_code,left(trim(p_customer->>'name'),120),p_customer->>'mobile',left(p_customer->>'email',160),p_order_type,left(p_customer->>'address',500),left(p_customer->>'city',80),left(p_customer->>'state',80),left(p_customer->>'pincode',10),left(p_customer->>'notes',1000));
 for it in select * from jsonb_array_elements(p_items) loop
  q:=(it->>'qty')::int; if q is null or q<1 or q>99 then raise exception 'invalid qty'; end if;
  select id,name,price into pr from products where id=(it->>'id')::uuid and status='available';   -- TRUSTED price read from the database
  if not found then raise exception 'unavailable'; end if;
  if pr.price is null then v_pend:=v_pend+1; ln:=null; else ln:=pr.price*q; v_sub:=v_sub+ln; end if;
  insert into order_items(order_id,product_id,product_name,unit_price,qty,line_total) values(v_id,pr.id,pr.name,pr.price,q,ln);
  out:=out||jsonb_build_object('name',pr.name,'unit_price',pr.price,'qty',q,'line_total',ln);
 end loop;
 update orders set subtotal=v_sub,total=v_sub,price_pending=v_pend where id=v_id;
 return jsonb_build_object('order_code',v_code,'subtotal',v_sub,'total',v_sub,'price_pending',v_pend,'items',out);
end $$;
revoke all on function place_order(jsonb,text,jsonb) from public; grant execute on function place_order(jsonb,text,jsonb) to anon,authenticated;

insert into storage.buckets(id,name,public) values('product-images','product-images',true) on conflict do nothing;
drop policy if exists img_read on storage.objects; create policy img_read on storage.objects for select using(bucket_id='product-images');
drop policy if exists img_w on storage.objects; create policy img_w on storage.objects for insert to authenticated with check(bucket_id='product-images' and is_admin());
drop policy if exists img_u on storage.objects; create policy img_u on storage.objects for update to authenticated using(bucket_id='product-images' and is_admin());
drop policy if exists img_d on storage.objects; create policy img_d on storage.objects for delete to authenticated using(bucket_id='product-images' and is_admin());

-- Starting categories (same ones already on the site). Edit or delete them in Admin > Categories. No products or prices are seeded.
insert into categories(name,slug,display_order) values('Sparklers','sparklers',1),('Fountains','fountains',2),('Flower Pots','flower-pots',3),('Sky Shots','sky-shots',4),('Gift Boxes','gift-boxes',5),('Family Packs','family-packs',6) on conflict do nothing;

-- AFTER creating the owner's login (Supabase > Authentication > Users > Add user), make them an admin:
--   insert into admins(user_id) select id from auth.users where email='OWNER_EMAIL_HERE';
