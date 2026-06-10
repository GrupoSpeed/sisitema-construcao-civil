-- =====================================================================
-- ITENS: campos de reserva / compra / validação + armazém de recibos
-- Fluxo por item: solicitado -> reservado -> comprado -> validado (ou rejeitado).
-- Correr no SQL Editor do Supabase. Pode correr-se mais do que uma vez.
-- =====================================================================

-- Quem fez cada passo
alter table public.pedido_itens add column if not exists reservado_por     uuid references public.perfis(id) on delete set null;
alter table public.pedido_itens add column if not exists comprado_por      uuid references public.perfis(id) on delete set null;
alter table public.pedido_itens add column if not exists validado_por      uuid references public.perfis(id) on delete set null;
-- Dados da compra
alter table public.pedido_itens add column if not exists fornecedor_id     uuid references public.fornecedores(id) on delete set null;
alter table public.pedido_itens add column if not exists conta_bancaria_id uuid references public.contas_bancarias(id) on delete set null;
alter table public.pedido_itens add column if not exists valor_pago        numeric(12,2);
alter table public.pedido_itens add column if not exists recibo_url        text;
alter table public.pedido_itens add column if not exists motivo_rejeicao   text;

-- Garante a tabela de fornecedores (caso falte)
create table if not exists public.fornecedores (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  nome text not null,
  nif text,
  criado_em timestamptz not null default now()
);
alter table public.fornecedores enable row level security;
drop policy if exists "fornecedores_acesso" on public.fornecedores;
create policy "fornecedores_acesso" on public.fornecedores for all
  using      ( empresa_id = public.empresa_atual() or public.e_super_admin() )
  with check ( empresa_id = public.empresa_atual() or public.e_super_admin() );

-- Garante a tabela de contas bancárias (caso falte)
create table if not exists public.contas_bancarias (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  nome text not null,
  criado_em timestamptz not null default now()
);
alter table public.contas_bancarias enable row level security;
drop policy if exists "contas_bancarias_acesso" on public.contas_bancarias;
create policy "contas_bancarias_acesso" on public.contas_bancarias for all
  using      ( empresa_id = public.empresa_atual() or public.e_super_admin() )
  with check ( empresa_id = public.empresa_atual() or public.e_super_admin() );

-- Armazém de recibos (Supabase Storage)
insert into storage.buckets (id, name, public)
values ('recibos', 'recibos', true)
on conflict (id) do nothing;

drop policy if exists "recibos_upload" on storage.objects;
create policy "recibos_upload" on storage.objects
  for insert to authenticated with check ( bucket_id = 'recibos' );

drop policy if exists "recibos_leitura" on storage.objects;
create policy "recibos_leitura" on storage.objects
  for select using ( bucket_id = 'recibos' );
