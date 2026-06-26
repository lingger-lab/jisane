-- 파트너 능동적 참여 시스템: 의뢰 관심 표현 + 거래 메시지

-- A. 파트너 관심 표현 (의뢰 탐색에서 관심 의사 전달)
create table partner_interest (
  id          uuid primary key default gen_random_uuid(),
  request_id  uuid not null references request(id) on delete cascade,
  partner_id  uuid not null references partner(id) on delete cascade,
  note        text,
  created_at  timestamptz not null default now(),
  unique(request_id, partner_id)
);

create index idx_interest_request on partner_interest(request_id);
create index idx_interest_partner on partner_interest(partner_id);

alter table partner_interest enable row level security;

create policy partner_select_interest on partner_interest for select
  using (partner_id in (select id from partner where auth_user_id = auth.uid()));
create policy partner_insert_interest on partner_interest for insert
  with check (partner_id in (select id from partner where auth_user_id = auth.uid()));
create policy partner_delete_interest on partner_interest for delete
  using (partner_id in (select id from partner where auth_user_id = auth.uid()));

-- B. 거래 메시지 (작업 중 파트너 ↔ 매니저 커뮤니케이션)
create table deal_message (
  id          uuid primary key default gen_random_uuid(),
  deal_id     uuid not null references deal(id) on delete cascade,
  sender_type text not null check (sender_type in ('partner', 'admin')),
  sender_id   uuid not null,
  content     text not null,
  created_at  timestamptz not null default now()
);

create index idx_deal_message_deal on deal_message(deal_id);
create index idx_deal_message_created on deal_message(deal_id, created_at);

alter table deal_message enable row level security;

create policy partner_select_deal_messages on deal_message for select
  using (deal_id in (
    select id from deal where partner_id in (
      select id from partner where auth_user_id = auth.uid()
    )
  ));
create policy partner_insert_deal_message on deal_message for insert
  with check (
    sender_type = 'partner' and
    sender_id in (select id from partner where auth_user_id = auth.uid()) and
    deal_id in (select id from deal where partner_id = sender_id)
  );
