-- =====================================================================
-- LISTAS INTELIGENTES: categorias e marcas (crescem com o uso)
-- Cada empresa tem a sua lista; sem valores repetidos.
-- Correr no SQL Editor do Supabase. Pode correr-se mais do que uma vez.
-- =====================================================================

create table if not exists public.categorias (
  id         uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  nome       text not null,
  criado_em  timestamptz not null default now(),
  unique (empresa_id, nome)
);

create table if not exists public.marcas (
  id         uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  nome       text not null,
  criado_em  timestamptz not null default now(),
  unique (empresa_id, nome)
);

alter table public.categorias enable row level security;
alter table public.marcas     enable row level security;

drop policy if exists "categorias_acesso" on public.categorias;
create policy "categorias_acesso" on public.categorias for all
  using      ( empresa_id = public.empresa_atual() or public.e_super_admin() )
  with check ( empresa_id = public.empresa_atual() or public.e_super_admin() );

drop policy if exists "marcas_acesso" on public.marcas;
create policy "marcas_acesso" on public.marcas for all
  using      ( empresa_id = public.empresa_atual() or public.e_super_admin() )
  with check ( empresa_id = public.empresa_atual() or public.e_super_admin() );
