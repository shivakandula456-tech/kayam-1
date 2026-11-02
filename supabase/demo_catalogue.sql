-- KAYAM SPICES — initial demonstration variants
-- Run after supabase/schema.sql.
-- IMPORTANT: These weights and prices are temporary sample values, not approved retail prices.
-- Replace/confirm each variant in Admin > Products before accepting customer orders.
-- Each variant is flagged is_demo=true. The create_order RPC rejects these until Admin confirms them.

alter table public.product_variants
  add column if not exists is_demo boolean not null default false;

with demo_prices(product_slug, weight_value, price, display_order) as (
  values
    ('chilli-powder', 100::numeric, 80::numeric, 1),
    ('chilli-powder', 250::numeric, 175::numeric, 2),
    ('chilli-powder', 500::numeric, 330::numeric, 3),
    ('turmeric-powder', 100::numeric, 65::numeric, 1),
    ('turmeric-powder', 250::numeric, 150::numeric, 2),
    ('turmeric-powder', 500::numeric, 280::numeric, 3),
    ('goda-masala', 100::numeric, 110::numeric, 1),
    ('goda-masala', 250::numeric, 255::numeric, 2),
    ('goda-masala', 500::numeric, 490::numeric, 3),
    ('sambar-premix', 100::numeric, 90::numeric, 1),
    ('sambar-premix', 250::numeric, 210::numeric, 2),
    ('sambar-premix', 500::numeric, 400::numeric, 3),
    ('rasam-premix', 100::numeric, 85::numeric, 1),
    ('rasam-premix', 250::numeric, 195::numeric, 2),
    ('rasam-premix', 500::numeric, 375::numeric, 3),
    ('chicken-masala', 100::numeric, 100::numeric, 1),
    ('chicken-masala', 250::numeric, 230::numeric, 2),
    ('chicken-masala', 500::numeric, 445::numeric, 3),
    ('meat-masala', 100::numeric, 110::numeric, 1),
    ('meat-masala', 250::numeric, 255::numeric, 2),
    ('meat-masala', 500::numeric, 490::numeric, 3),
    ('biryani-masala', 100::numeric, 120::numeric, 1),
    ('biryani-masala', 250::numeric, 275::numeric, 2),
    ('biryani-masala', 500::numeric, 530::numeric, 3),
    ('garlic-podi', 100::numeric, 95::numeric, 1),
    ('garlic-podi', 250::numeric, 220::numeric, 2),
    ('garlic-podi', 500::numeric, 420::numeric, 3),
    ('gunpowder-podi', 100::numeric, 90::numeric, 1),
    ('gunpowder-podi', 250::numeric, 205::numeric, 2),
    ('gunpowder-podi', 500::numeric, 395::numeric, 3),
    ('groundnut-chutney-powder', 100::numeric, 80::numeric, 1),
    ('groundnut-chutney-powder', 250::numeric, 185::numeric, 2),
    ('groundnut-chutney-powder', 500::numeric, 350::numeric, 3)
)
insert into public.product_variants (
  product_id, weight_value, weight_unit, price, sale_price,
  track_stock, stock_quantity, is_active, is_demo, display_order
)
select
  p.id, d.weight_value, 'g', d.price, null,
  false, 0, true, true, d.display_order
from demo_prices d
join public.products p on p.slug = d.product_slug
on conflict (product_id, weight_value, weight_unit) do nothing;

-- Enforce the demonstration-price lock even when an older create_order RPC
-- is already installed and has not yet been replaced by the updated schema.
create or replace function public.reject_demo_variant_order_items()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $
begin
  if new.variant_id is not null and exists (
    select 1
    from public.product_variants v
    where v.id = new.variant_id
      and v.is_demo is true
  ) then
    raise exception 'DEMO_PRICE: This pack size still has a demonstration price. Confirm or replace it in Admin > Products before accepting live orders.';
  end if;
  return new;
end;
$;

drop trigger if exists order_items_reject_demo_price on public.order_items;
create trigger order_items_reject_demo_price
before insert or update of variant_id on public.order_items
for each row execute function public.reject_demo_variant_order_items();
