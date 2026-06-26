-- 전문서비스 주문 테이블 (기업전문서비스 + 전문서비스교육)
-- 기존 request/matching/deal 흐름과 분리된 고정가격 직접구매 모델

create type service_category as enum ('ax_consulting', 'biz_consulting', 'education');
create type order_status as enum ('pending', 'paid', 'processing', 'completed', 'cancelled');

create table service_order (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid references client(id) on delete cascade,
  partner_id      uuid references partner(id) on delete cascade,
  category        service_category not null,
  package_slug    text not null,
  package_name    text not null,
  price           int not null,
  status          order_status not null default 'pending',
  detail          text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint chk_one_orderer check (
    (client_id is not null and partner_id is null) or
    (client_id is null and partner_id is not null)
  )
);

create trigger trg_service_order_updated before update on service_order
  for each row execute function set_updated_at();

create index idx_service_order_client on service_order(client_id);
create index idx_service_order_partner on service_order(partner_id);
create index idx_service_order_status on service_order(status);

alter table service_order enable row level security;

create policy client_select on service_order for select
  using (client_id in (select id from client where auth_user_id = auth.uid()));
create policy client_insert on service_order for insert
  with check (client_id in (select id from client where auth_user_id = auth.uid()));

create policy partner_select on service_order for select
  using (partner_id in (select id from partner where auth_user_id = auth.uid()));
create policy partner_insert on service_order for insert
  with check (partner_id in (select id from partner where auth_user_id = auth.uid()));
