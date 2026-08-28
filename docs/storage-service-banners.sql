-- 지식서비스 배너 Storage 버킷 설정 (Supabase SQL Editor에서 1회 실행)
-- 서버(service role)가 signed upload URL을 발급하고 클라가 그 URL로 PUT하므로,
-- storage.objects INSERT 정책은 불필요하다(signed URL이 사전 승인). public SELECT만 연다.

-- 1) 버킷 (public read, 2MB, webp만)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('service-banners', 'service-banners', true, 2097152, array['image/webp'])
on conflict (id) do nothing;

-- 2) 공개 읽기 정책 (누구나 배너 이미지 열람)
do $$ begin
  create policy "service-banners public read"
    on storage.objects for select
    using (bucket_id = 'service-banners');
exception when duplicate_object then null; end $$;
