-- AI-이음 공용 DB (Supabase · Postgres)
-- Supabase 대시보드 → SQL Editor에 통째로 붙여 넣고 Run.
-- 사용자 사이트와 관리자 사이트가 서로 다른 도메인이라, 둘이 같은 데이터를 보려면 이 DB가 필요하다.

-- 설정 (템플릿·사용 중지 목록·지역 설정) — 관리자 페이지가 쓴다
create table if not exists app_config (
  key        text primary key,          -- 'templates' | 'templates_off' | 'regions'
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

-- 콘텐츠 (확인 대상)
create table if not exists content_plans (
  id         text primary key,
  region     text not null,
  status     text not null check (status in ('gate1_wait','making','gate2_wait','gate3_wait','published','rejected')),
  data       jsonb not null,            -- 화면이 쓰는 전체 값 (제목·형식·장면·요청자 등)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists content_plans_region on content_plans(region);

-- 결정 기록 — 추가만 가능, 수정·삭제 금지
create table if not exists review_logs (
  id      text primary key,
  plan_id text not null references content_plans(id),
  at      timestamptz not null,
  data    jsonb not null                -- 누가·단계·결정·반려 사유·점검표·장면 선택
);
create index if not exists review_logs_plan on review_logs(plan_id);

-- 대화 근거 ("왜 이 주제였는지")
create table if not exists chat_threads (
  id   text primary key,
  data jsonb not null
);

-- 결정 기록은 누구도(관리자 키 포함) 고치거나 지울 수 없다
create or replace function aiieum_forbid_log_change() returns trigger language plpgsql as $$
begin
  raise exception '결정 기록은 수정·삭제할 수 없어요 (고칠 때는 새 기록을 추가하세요)';
end $$;
drop trigger if exists review_logs_immutable on review_logs;
create trigger review_logs_immutable before update or delete on review_logs
  for each row execute function aiieum_forbid_log_change();

-- 상태는 정해진 순서로만 바뀐다 — 화면만 막는 게 아니라 DB에서도 1차를 건너뛸 수 없다
create or replace function aiieum_check_transition() returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  if old.status <> new.status and not (
       (old.status = 'gate1_wait' and new.status in ('making','rejected')) or
       (old.status = 'making'     and new.status = 'gate2_wait') or
       (old.status = 'gate2_wait' and new.status in ('gate3_wait','rejected')) or
       (old.status = 'gate3_wait' and new.status in ('published','rejected'))) then
    raise exception '허용되지 않는 상태 변경: % → %', old.status, new.status;
  end if;
  return new;
end $$;
drop trigger if exists content_plans_transition on content_plans;
create trigger content_plans_transition before update on content_plans
  for each row execute function aiieum_check_transition();

-- 콘텐츠도 지우지 않는다 (반려된 것은 rejected로 남고, 다시 요청은 새 id)
create or replace function aiieum_forbid_plan_delete() returns trigger language plpgsql as $$
begin raise exception '콘텐츠는 지울 수 없어요'; end $$;
drop trigger if exists content_plans_no_delete on content_plans;
create trigger content_plans_no_delete before delete on content_plans
  for each row execute function aiieum_forbid_plan_delete();

-- 행 수준 보안 (RLS)
-- ⚠ 시연·팀 미리보기용 정책: 로그인 없이 공개 anon 키로 읽고 쓴다.
--   anon 키는 페이지에 그대로 들어가므로, 주소를 아는 사람은 템플릿·지역 설정도 바꿀 수 있다.
--   실제 지자체 운영 전에는 Supabase Auth(담당자·관리자 로그인)를 붙이고
--   ① 담당자는 자기 지역 content_plans만 ② app_config 쓰기는 관리자만 으로 바꿀 것.
alter table app_config    enable row level security;
alter table content_plans enable row level security;
alter table review_logs   enable row level security;
alter table chat_threads  enable row level security;

drop policy if exists demo_read   on app_config;     create policy demo_read   on app_config    for select using (true);
drop policy if exists demo_insert on app_config;     create policy demo_insert on app_config    for insert with check (true);
drop policy if exists demo_update on app_config;     create policy demo_update on app_config    for update using (true);
drop policy if exists demo_delete on app_config;     create policy demo_delete on app_config    for delete using (true);  -- '기본값으로 되돌리기'
drop policy if exists demo_read   on content_plans;  create policy demo_read   on content_plans for select using (true);
drop policy if exists demo_insert on content_plans;  create policy demo_insert on content_plans for insert with check (true);
drop policy if exists demo_update on content_plans;  create policy demo_update on content_plans for update using (true);
drop policy if exists demo_read   on review_logs;    create policy demo_read   on review_logs   for select using (true);
drop policy if exists demo_insert on review_logs;    create policy demo_insert on review_logs   for insert with check (true);
drop policy if exists demo_read   on chat_threads;   create policy demo_read   on chat_threads  for select using (true);
drop policy if exists demo_insert on chat_threads;   create policy demo_insert on chat_threads  for insert with check (true);
drop policy if exists demo_update on chat_threads;   create policy demo_update on chat_threads  for update using (true);
