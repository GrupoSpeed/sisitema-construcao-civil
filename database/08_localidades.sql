-- =====================================================================
-- LISTA INTELIGENTE: localidades (cresce com o uso)
-- Usada no Perfil da Empresa (e reutilizável noutros ecrãs).
-- Cada empresa tem a sua lista; sem valores repetidos.
-- Correr no SQL Editor do Supabase. Pode correr-se mais do que uma vez.
-- =====================================================================

create table if not exists public.localidades (
  id         uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  nome       text not null,
  criado_em  timestamptz not null default now(),
  unique (empresa_id, nome)
);

alter table public.localidades enable row level security;

drop policy if exists "localidades_acesso" on public.localidades;
create policy "localidades_acesso" on public.localidades for all
  using      ( empresa_id = public.empresa_atual() or public.e_super_admin() )
  with check ( empresa_id = public.empresa_atual() or public.e_super_admin() );
