-- =====================================================================
-- MOVIMENTOS (lançamento de faturas / contas a pagar) + listas de classificação
-- Baseado no modelo "Movimentos" do cliente. Listas inteligentes que crescem com o uso.
-- Correr no SQL Editor do Supabase. Pode correr-se mais do que uma vez.
-- =====================================================================

-- Listas inteligentes (padrão: por empresa, sem repetidos)
create table if not exists public.centros_custo    (id uuid primary key default gen_random_uuid(), empresa_id uuid not null references public.empresas(id) on delete cascade, nome text not null, criado_em timestamptz not null default now(), unique (empresa_id, nome));
create table if not exists public.mov_tipos         (id uuid primary key default gen_random_uuid(), empresa_id uuid not null references public.empresas(id) on delete cascade, nome text not null, criado_em timestamptz not null default now(), unique (empresa_id, nome));
create table if not exists public.tipos_custo       (id uuid primary key default gen_random_uuid(), empresa_id uuid not null references public.empresas(id) on delete cascade, nome text not null, criado_em timestamptz not null default now(), unique (empresa_id, nome));
create table if not exists public.tipos_documento   (id uuid primary key default gen_random_uuid(), empresa_id uuid not null references public.empresas(id) on delete cascade, nome text not null, criado_em timestamptz not null default now(), unique (empresa_id, nome));
create table if not exists public.categorias_mov    (id uuid primary key default gen_random_uuid(), empresa_id uuid not null references public.empresas(id) on delete cascade, nome text not null, criado_em timestamptz not null default now(), unique (empresa_id, nome));
create table if not exists public.tipos_pagamento   (id uuid primary key default gen_random_uuid(), empresa_id uuid not null references public.empresas(id) on delete cascade, nome text not null, criado_em timestamptz not null default now(), unique (empresa_id, nome));

-- Garante contas_bancarias e a unicidade (empresa, nome) para a lista inteligente
create table if not exists public.contas_bancarias (id uuid primary key default gen_random_uuid(), empresa_id uuid not null references public.empresas(id) on delete cascade, nome text not null, criado_em timestamptz not null default now());
create unique index if not exists contas_bancarias_empresa_nome on public.contas_bancarias (empresa_id, nome);

-- RLS para as listas
do $$
declare t text;
begin
  foreach t in array array['centros_custo','mov_tipos','tipos_custo','tipos_documento','categorias_mov','tipos_pagamento','contas_bancarias']
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists "%s_acesso" on public.%I;', t, t);
    execute format('create policy "%s_acesso" on public.%I for all using (empresa_id = public.empresa_atual() or public.e_super_admin()) with check (empresa_id = public.empresa_atual() or public.e_super_admin());', t, t);
  end loop;
end $$;

-- Tabela principal de movimentos
create table if not exists public.movimentos (
  id               uuid primary key default gen_random_uuid(),
  empresa_id       uuid not null references public.empresas(id) on delete cascade,
  criado_por       uuid references public.perfis(id) on delete set null,
  criado_em        timestamptz not null default now(),
  -- Dados da fatura
  numero_fatura    text,
  fornecedor_nig   text,
  fornecedor_id    uuid references public.fornecedores(id) on delete set null,
  -- Dados contabilísticos
  centro_custo     text,
  movimento        text,
  cod_movimento    text,
  tipo_custo       text,
  desc_movimento   text,
  -- Lançamento do documento
  projeto_id       uuid references public.projetos(id) on delete set null,
  categoria        text,
  tipo_documento   text,
  fornecedor_obs   text,
  data_emissao     date,
  data_vencimento  date,
  prazo_pagamento  text,
  valor_liquido    numeric(12,2),
  iva              numeric(6,2),     -- percentagem (ex.: 23)
  valor_bruto      numeric(12,2),
  -- Pagamento
  data_pagamento   date,
  tipo_pagamento   text,
  obs              text,
  valor_pago       numeric(12,2),
  metodo_pagamento text,
  conta_bancaria   text
);

alter table public.movimentos enable row level security;
drop policy if exists "movimentos_acesso" on public.movimentos;
create policy "movimentos_acesso" on public.movimentos for all
  using      ( empresa_id = public.empresa_atual() or public.e_super_admin() )
  with check ( empresa_id = public.empresa_atual() or public.e_super_admin() );
