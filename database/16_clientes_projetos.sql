-- =====================================================================
-- MINI-CRM DE CLIENTES + MAPA DE PROJETOS (idempotente e auto-suficiente)
-- Garante a tabela "projetos" (caso a renomeação de "obras" não se aplique),
-- cria os "clientes" e acrescenta os campos do mapa de projetos.
-- Rótulos genéricos (multi-segmento). Correr no SQL Editor do Supabase.
-- Pode correr-se mais do que uma vez.
-- =====================================================================

-- 1) Garante a tabela "projetos"
create table if not exists public.projetos (
  id         uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  nome       text not null,
  morada     text,
  estado     text not null default 'em_curso',
  criado_em  timestamptz not null default now()
);

alter table public.projetos enable row level security;
drop policy if exists "projetos_acesso" on public.projetos;
create policy "projetos_acesso" on public.projetos for all
  using      ( empresa_id = public.empresa_atual() or public.e_super_admin() )
  with check ( empresa_id = public.empresa_atual() or public.e_super_admin() );

-- 2) Clientes (mini-CRM, por empresa)
create table if not exists public.clientes (
  id         uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  nig        text,
  nome       text not null,
  criado_em  timestamptz not null default now(),
  unique (empresa_id, nome)
);

alter table public.clientes enable row level security;
drop policy if exists "clientes_acesso" on public.clientes;
create policy "clientes_acesso" on public.clientes for all
  using      ( empresa_id = public.empresa_atual() or public.e_super_admin() )
  with check ( empresa_id = public.empresa_atual() or public.e_super_admin() );

-- 3) Campos do mapa de projetos
alter table public.projetos add column if not exists cliente_id       uuid references public.clientes(id) on delete set null;
alter table public.projetos add column if not exists nr_projeto       text;
alter table public.projetos add column if not exists zona             text;
alter table public.projetos add column if not exists centro_custo     text;
alter table public.projetos add column if not exists diretor          text;  -- Diretor / Responsável
alter table public.projetos add column if not exists diretor_contacto text;  -- Contacto do diretor
alter table public.projetos add column if not exists encarregado      text;  -- Encarregado / Responsável de equipa
alter table public.projetos add column if not exists data_inicio      date;  -- Início
alter table public.projetos add column if not exists data_pc          date;  -- Data do PC (Plano de Contingência)
alter table public.projetos add column if not exists data_fim         date;  -- Fim
alter table public.projetos add column if not exists previsao_termino date;  -- Previsão de término
