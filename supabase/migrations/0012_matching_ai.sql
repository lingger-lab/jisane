-- AI 매칭 후보 테이블
create table matching_candidate (
  id              uuid primary key default gen_random_uuid(),
  request_id      uuid not null references request(id) on delete cascade,
  partner_id      uuid not null references partner(id),
  rank            smallint not null,
  score           numeric(6,2) not null default 0,
  score_detail    jsonb,
  status          text not null default 'pending',
  auto_assign_at  timestamptz,
  created_at      timestamptz not null default now()
);

create index idx_mc_request on matching_candidate(request_id);
create index idx_mc_status  on matching_candidate(status);

-- RLS
alter table matching_candidate enable row level security;
create policy mc_select_all on matching_candidate for select using (true);

-- review 테이블에 다축 평가 컬럼 추가
alter table review add column process_rating  smallint check (process_rating between 1 and 5);
alter table review add column result_rating   smallint check (result_rating between 1 and 5);
alter table review add column response_rating smallint check (response_rating between 1 and 5);

-- AI 평가 제안 테이블
create table review_ai_suggestion (
  id              uuid primary key default gen_random_uuid(),
  deal_id         uuid not null references deal(id) on delete cascade,
  process_rating  smallint not null check (process_rating between 1 and 5),
  result_rating   smallint not null check (result_rating between 1 and 5),
  response_rating smallint not null check (response_rating between 1 and 5),
  overall_rating  smallint not null check (overall_rating between 1 and 5),
  reasoning       text,
  status          text not null default 'pending',
  created_at      timestamptz not null default now()
);

create index idx_ras_deal on review_ai_suggestion(deal_id);

-- RLS
alter table review_ai_suggestion enable row level security;
create policy ras_select_all on review_ai_suggestion for select using (true);
