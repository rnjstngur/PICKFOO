-- PICKFOO Supabase 기본 테이블 초안. 실제 서비스 배포 전 RLS 정책과 인증/권한을 검토하세요.
create table if not exists public.combos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  brand text not null,
  category text not null,
  price integer not null default 0,
  spicy_level integer not null default 0 check (spicy_level between 0 and 2),
  ingredients jsonb not null default '[]'::jsonb,
  steps jsonb not null default '[]'::jsonb,
  description text,
  created_at timestamptz not null default now()
);
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  combo_id uuid references public.combos(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  nickname text not null,
  rating integer not null check (rating between 1 and 5),
  review_text text not null,
  photo_url text,
  created_at timestamptz not null default now()
);
create table if not exists public.point_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null,
  reason text not null,
  created_at timestamptz not null default now()
);
-- 주의: 테이블 생성만으로 보안이 완성되지 않습니다. 배포 전 RLS를 활성화하고 정책을 검토하세요.
