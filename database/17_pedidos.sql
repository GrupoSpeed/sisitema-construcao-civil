-- =====================================================================
-- PEDIDOS DE MATERIAL + ITENS (idempotente e auto-suficiente)
-- Garante as tabelas com projeto_id (renomeia obra_id se vier do esquema antigo).
-- Correr no SQL Editor do Supabase. Pode correr-se mais do que uma vez.
-- =====================================================================

-- Pedido (o "carrinho" que o colaborador envia)
create table if not exists public.pedidos_material (
  id               uuid primary key default gen_random_uuid(),
  empresa_id       uuid not null references public.empresas(id) on delete cascade,
  projeto_id       uuid references public.projetos(id) on delete cascade,
  solicitado_por   uuid references public.perfis(id) on delete set null,
  estado           text not null default 'pendente',   -- pendente / aprovado / rejeitado
  data_necessidade date,
  observacao       text,
  motivo_rejeicao  text,
  aprovado_por     uuid references public.perfis(id) on delete set null,
  criado_em        timestamptz not null default now()
);

-- Se veio do esquema antigo com obra_id, renomeia para projeto_id
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'pedidos_material' and column_name = 'obra_id'
  ) then
    alter table public.pedidos_material rename column obra_id to projeto_id;
  end if;
end $$;

alter table public.pedidos_material add column if not exists projeto_id uuid references public.projetos(id) on delete cascade;
alter table public.pedidos_material add column if not exists observacao text;

-- Itens do pedido (cada material pedido)
create table if not exists public.pedido_itens (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references public.empresas(id) on delete cascade,
  pedido_id   uuid not null references public.pedidos_material(id) on delete cascade,
  produto_id  uuid references public.produtos(id) on delete set null,
  quantidade  numeric(12,2) not null,
  unidade     text not null,
  observacao  text,
  estado      text not null default 'solicitado',  -- solicitado / reservado / comprado / validado
  criado_em   timestamptz not null default now()
);

-- Segurança por empresa
alter table public.pedidos_material enable row level security;
alter table public.pedido_itens     enable row level security;

drop policy if exists "pedidos_material_acesso" on public.pedidos_material;
create policy "pedidos_material_acesso" on public.pedidos_material for all
  using      ( empresa_id = public.empresa_atual() or public.e_super_admin() )
  with check ( empresa_id = public.empresa_atual() or public.e_super_admin() );

drop policy if exists "pedido_itens_acesso" on public.pedido_itens;
create policy "pedido_itens_acesso" on public.pedido_itens for all
  using      ( empresa_id = public.empresa_atual() or public.e_super_admin() )
  with check ( empresa_id = public.empresa_atual() or public.e_super_admin() );
