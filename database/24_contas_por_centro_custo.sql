-- =====================================================================
-- LIGAÇÃO (muitos-para-muitos) entre CENTROS DE CUSTO e CONTAS BANCÁRIAS
-- Uma conta pode pertencer a vários centros de custo; um centro pode ter
-- todas ou só algumas contas. Gerido em Configurações (por centro de custo).
-- Correr no SQL Editor do Supabase. Pode correr-se mais do que uma vez.
-- =====================================================================

create table if not exists public.centro_conta (
  id              uuid primary key default gen_random_uuid(),
  empresa_id      uuid not null references public.empresas(id) on delete cascade,
  centro_custo_id uuid not null references public.centros_custo(id) on delete cascade,
  conta_id        uuid not null references public.contas_bancarias(id) on delete cascade,
  criado_em       timestamptz not null default now(),
  unique (centro_custo_id, conta_id)
);

alter table public.centro_conta enable row level security;
drop policy if exists "centro_conta_acesso" on public.centro_conta;
create policy "centro_conta_acesso" on public.centro_conta for all
  using      ( empresa_id = public.empresa_atual() or public.e_super_admin() )
  with check ( empresa_id = public.empresa_atual() or public.e_super_admin() );
