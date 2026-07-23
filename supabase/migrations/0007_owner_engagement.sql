-- 0007: 오너(기업) 능동적 참여 — deal_message 확장 + client RLS

-- deal_message sender_type CHECK 확장: 'client' 추가
alter table deal_message drop constraint if exists deal_message_sender_type_check;
alter table deal_message add constraint deal_message_sender_type_check
  check (sender_type in ('partner', 'admin', 'client'));

-- client가 자기 deal의 메시지를 읽을 수 있는 RLS 정책
create policy client_deal_messages on deal_message for select
  using (deal_id in (
    select d.id from deal d
    join request r on d.request_id = r.id
    join client c on r.client_id = c.id
    where c.auth_user_id = auth.uid()
  ));

-- client가 자기 deal에 메시지를 보낼 수 있는 RLS 정책
create policy client_send_message on deal_message for insert
  with check (
    sender_type = 'client' and
    deal_id in (
      select d.id from deal d
      join request r on d.request_id = r.id
      join client c on r.client_id = c.id
      where c.auth_user_id = auth.uid()
    )
  );
