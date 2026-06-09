-- =====================================================================
-- SISTEMA GRUPO SPEED — Esquema inicial da base de dados
-- Fundação (empresas, utilizadores, obras, fornecedores, contas)
--   + Módulo de Materiais (catálogo, pedidos, itens)
--   + Segurança por empresa (RLS)
--
-- COMO USAR: copiar tudo e colar no Editor SQL do Supabase. Correr UMA vez.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1) FUNDAÇÃO
-- ---------------------------------------------------------------------

-- Empresas que usam o sistema (cada subscritor do SaaS)
create table if not exists public.empresas (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null,
  nif        text,
  criado_em  timestamptz not null default now()
);

-- Utilizadores (ligados ao sistema de login do Supabase: auth.users)
create table if not exists public.perfis (
  id             uuid primary key references auth.users(id) on delete cascade,
  empresa_id     uuid references public.empresas(id) on delete set null,
  nome           text,
  nivel_acesso   int     not null default 1,     -- 1 a 9 (níveis de acesso)
  is_comprador   boolean not null default false, -- permissão extra "Comprador"
  is_super_admin boolean not null default false, -- dono do SaaS
  ativo          boolean not null default true,
  criado_em      timestamptz not null default now()
);

-- Obras / projetos
create table if not exists public.obras (
  id         uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  nome       text not null,
  morada     text,
  estado     text not null default 'em_curso',  -- em_curso / concluido / pausado
  criado_em  timestamptz not null default now()
);

-- Fornecedores (versão simples; mais tarde liga ao CRM)
create table if not exists public.fornecedores (
  id         uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  nome       text not null,
  nif        text,
  criado_em  timestamptz not null default now()
);

-- Contas bancárias da empresa (para registar onde se pagou)
create table if not exists public.contas_bancarias (
  id         uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  nome       text not null,                      -- ex: "Caixa", "Conta BCP"
  criado_em  timestamptz not null default now()
);


-- ---------------------------------------------------------------------
-- 2) MÓDULO DE MATERIAIS
-- ---------------------------------------------------------------------

-- Catálogo de produtos/materiais (começa vazio; colaboradores criam com foto)
create table if not exists public.produtos (
  id                         uuid primary key default gen_random_uuid(),
  empresa_id                 uuid not null references public.empresas(id) on delete cascade,
  nome                       text not null,
  foto_url                   text,
  setor                      text not null,
  unidade                    text not null,
  categoria                  text,
  marca                      text,
  fornecedor_preferencial_id uuid references public.fornecedores(id) on delete set null,
  referencia                 text,
  valor_referencia           numeric(12,2),
  observacoes                text,
  estado                     text not null default 'pendente', -- pendente / aprovado / rejeitado
  criado_por                 uuid references public.perfis(id) on delete set null,
  criado_em                  timestamptz not null default now()
);

-- Pedidos de material (o "carrinho" que o colaborador envia ao encarregado)
create table if not exists public.pedidos_material (
  id                         uuid primary key default gen_random_uuid(),
  empresa_id                 uuid not null references public.empresas(id) on delete cascade,
  obra_id                    uuid not null references public.obras(id) on delete cascade,
  solicitado_por             uuid references public.perfis(id) on delete set null,
  estado                     text not null default 'pendente', -- pendente / aprovado / rejeitado
  data_necessidade           date not null,
  fornecedor_preferencial_id uuid references public.fornecedores(id) on delete set null,
  motivo_rejeicao            text,
  aprovado_por               uuid references public.perfis(id) on delete set null,
  criado_em                  timestamptz not null default now()
);

-- Itens dentro de cada pedido (cada material e o seu estado no fluxo)
create table if not exists public.pedido_itens (
  id                  uuid primary key default gen_random_uuid(),
  empresa_id          uuid not null references public.empresas(id) on delete cascade,
  pedido_id           uuid not null references public.pedidos_material(id) on delete cascade,
  produto_id          uuid references public.produtos(id) on delete set null,
  quantidade          numeric(12,2) not null,
  unidade             text not null,
  observacao          text,
  estado              text not null default 'solicitado', -- solicitado / reservado / comprado / validado
  reservado_por       uuid references public.perfis(id) on delete set null,
  comprado_por        uuid references public.perfis(id) on delete set null,
  valor_pago          numeric(12,2),
  conta_bancaria_id   uuid references public.contas_bancarias(id) on delete set null,
  fornecedor_id       uuid references public.fornecedores(id) on delete set null,
  recibo_url          text,
  validado_financeiro boolean not null default false,
  criado_em           timestamptz not null default now()
);


-- ---------------------------------------------------------------------
-- 3) FUNÇÕES DE APOIO À SEGURANÇA
-- ---------------------------------------------------------------------

-- Devolve a empresa do utilizador que está autenticado
create or replace function public.empresa_atual()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select empresa_id from public.perfis where id = auth.uid()
$$;

-- Indica se o utilizador autenticado é o Super Admin (dono do SaaS)
create or replace function public.e_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_super_admin from public.perfis where id = auth.uid()), false)
$$;


-- ---------------------------------------------------------------------
-- 4) SEGURANÇA POR EMPRESA (RLS — Row Level Security)
--    Garante que cada empresa só acede aos SEUS dados.
-- ---------------------------------------------------------------------

alter table public.empresas         enable row level security;
alter table public.perfis           enable row level security;
alter table public.obras            enable row level security;
alter table public.fornecedores     enable row level security;
alter table public.contas_bancarias enable row level security;
alter table public.produtos         enable row level security;
alter table public.pedidos_material enable row level security;
alter table public.pedido_itens     enable row level security;

-- EMPRESAS: cada um vê a sua; super admin vê todas
drop policy if exists "empresas_acesso" on public.empresas;
create policy "empresas_acesso" on public.empresas
  for all
  using      ( id = public.empresa_atual() or public.e_super_admin() )
  with check ( id = public.empresa_atual() or public.e_super_admin() );

-- PERFIS: vê o próprio e os colegas da mesma empresa; super admin vê todos
drop policy if exists "perfis_acesso" on public.perfis;
create policy "perfis_acesso" on public.perfis
  for all
  using      ( id = auth.uid() or empresa_id = public.empresa_atual() or public.e_super_admin() )
  with check ( id = auth.uid() or empresa_id = public.empresa_atual() or public.e_super_admin() );

-- OBRAS
drop policy if exists "obras_acesso" on public.obras;
create policy "obras_acesso" on public.obras
  for all
  using      ( empresa_id = public.empresa_atual() or public.e_super_admin() )
  with check ( empresa_id = public.empresa_atual() or public.e_super_admin() );

-- FORNECEDORES
drop policy if exists "fornecedores_acesso" on public.fornecedores;
create policy "fornecedores_acesso" on public.fornecedores
  for all
  using      ( empresa_id = public.empresa_atual() or public.e_super_admin() )
  with check ( empresa_id = public.empresa_atual() or public.e_super_admin() );

-- CONTAS BANCÁRIAS
drop policy if exists "contas_bancarias_acesso" on public.contas_bancarias;
create policy "contas_bancarias_acesso" on public.contas_bancarias
  for all
  using      ( empresa_id = public.empresa_atual() or public.e_super_admin() )
  with check ( empresa_id = public.empresa_atual() or public.e_super_admin() );

-- PRODUTOS
drop policy if exists "produtos_acesso" on public.produtos;
create policy "produtos_acesso" on public.produtos
  for all
  using      ( empresa_id = public.empresa_atual() or public.e_super_admin() )
  with check ( empresa_id = public.empresa_atual() or public.e_super_admin() );

-- PEDIDOS DE MATERIAL
drop policy if exists "pedidos_material_acesso" on public.pedidos_material;
create policy "pedidos_material_acesso" on public.pedidos_material
  for all
  using      ( empresa_id = public.empresa_atual() or public.e_super_admin() )
  with check ( empresa_id = public.empresa_atual() or public.e_super_admin() );

-- ITENS DO PEDIDO
drop policy if exists "pedido_itens_acesso" on public.pedido_itens;
create policy "pedido_itens_acesso" on public.pedido_itens
  for all
  using      ( empresa_id = public.empresa_atual() or public.e_super_admin() )
  with check ( empresa_id = public.empresa_atual() or public.e_super_admin() );

-- =====================================================================
-- FIM
-- =====================================================================
