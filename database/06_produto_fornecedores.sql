-- =====================================================================
-- LIGAÇÃO PRODUTO <-> FORNECEDORES (muitos-para-muitos)
-- Cada produto pode ter vários fornecedores (e vice-versa).
-- Correr no SQL Editor do Supabase. Pode correr-se mais do que uma vez.
-- =====================================================================

create table if not exists public.produto_fornecedores (
  produto_id    uuid not null references public.produtos(id) on delete cascade,
  fornecedor_id uuid not null references public.fornecedores(id) on delete cascade,
  empresa_id    uuid not null references public.empresas(id) on delete cascade,
  valor         numeric(12,2),   -- preço de referência deste fornecedor para o produto
  primary key (produto_id, fornecedor_id)
);

-- Caso a tabela já existisse sem a coluna, acrescenta-a:
alter table public.produto_fornecedores add column if not exists valor numeric(12,2);

alter table public.produto_fornecedores enable row level security;

drop policy if exists "produto_fornecedores_acesso" on public.produto_fornecedores;
create policy "produto_fornecedores_acesso" on public.produto_fornecedores for all
  using      ( empresa_id = public.empresa_atual() or public.e_super_admin() )
  with check ( empresa_id = public.empresa_atual() or public.e_super_admin() );
