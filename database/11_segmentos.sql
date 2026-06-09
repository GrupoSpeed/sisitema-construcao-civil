-- =====================================================================
-- LISTA INTELIGENTE: segmentos / ramos de atividade (cresce com o uso)
-- Por agora é por empresa (como categorias/marcas). No futuro passa a ser
-- gerida num painel do Super Admin do SaaS.
-- Correr no SQL Editor do Supabase. Pode correr-se mais do que uma vez.
-- =====================================================================

create table if not exists public.segmentos (
  id         uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  nome       text not null,
  criado_em  timestamptz not null default now(),
  unique (empresa_id, nome)
);

alter table public.segmentos enable row level security;

drop policy if exists "segmentos_acesso" on public.segmentos;
create policy "segmentos_acesso" on public.segmentos for all
  using      ( empresa_id = public.empresa_atual() or public.e_super_admin() )
  with check ( empresa_id = public.empresa_atual() or public.e_super_admin() );

-- Sementes: cria os 3 segmentos iniciais para cada empresa já existente
insert into public.segmentos (empresa_id, nome)
select e.id, s.nome
from public.empresas e
cross join (values
  ('Construção Civil'),
  ('Agência de Marketing/Publicidade'),
  ('Restauração')
) as s(nome)
on conflict (empresa_id, nome) do nothing;
