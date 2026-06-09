-- =====================================================================
-- LISTAS INTELIGENTES POR SEGMENTO: setores e unidades
-- Saem do código para a base de dados. Cada empresa tem a sua lista,
-- semeada conforme o SEGMENTO (construção, marketing, restauração…).
-- A empresa pode acrescentar mais. No futuro, geridas no painel Super Admin.
-- Correr no SQL Editor do Supabase. Pode correr-se mais do que uma vez.
-- =====================================================================

create table if not exists public.setores (
  id         uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  nome       text not null,
  criado_em  timestamptz not null default now(),
  unique (empresa_id, nome)
);

create table if not exists public.unidades (
  id         uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  nome       text not null,
  criado_em  timestamptz not null default now(),
  unique (empresa_id, nome)
);

alter table public.setores  enable row level security;
alter table public.unidades enable row level security;

drop policy if exists "setores_acesso" on public.setores;
create policy "setores_acesso" on public.setores for all
  using      ( empresa_id = public.empresa_atual() or public.e_super_admin() )
  with check ( empresa_id = public.empresa_atual() or public.e_super_admin() );

drop policy if exists "unidades_acesso" on public.unidades;
create policy "unidades_acesso" on public.unidades for all
  using      ( empresa_id = public.empresa_atual() or public.e_super_admin() )
  with check ( empresa_id = public.empresa_atual() or public.e_super_admin() );

-- ----- SEMENTES POR SEGMENTO -------------------------------------------------
-- CONSTRUÇÃO CIVIL
insert into public.setores (empresa_id, nome)
select e.id, s.nome from public.empresas e
cross join (values
  ('Elétrica'),('Hidráulica'),('Pintura'),('Construção Civil'),('Gesso Cartonado'),
  ('Carpintaria'),('Capoto'),('Cobertura/Impermeabilização'),('Ar Condicionado'),
  ('Demolição'),('Ferramentas'),('Diversos')
) as s(nome)
where e.segmento = 'Construção Civil'
on conflict (empresa_id, nome) do nothing;

insert into public.unidades (empresa_id, nome)
select e.id, u.nome from public.empresas e
cross join (values ('Uni'),('M'),('M²'),('M³'),('Kg'),('Lt'),('Rolo'),('Saco')) as u(nome)
where e.segmento = 'Construção Civil'
on conflict (empresa_id, nome) do nothing;

-- AGÊNCIA DE MARKETING/PUBLICIDADE
insert into public.setores (empresa_id, nome)
select e.id, s.nome from public.empresas e
cross join (values
  ('Design'),('Impressão'),('Digital'),('Audiovisual'),('Brindes'),('Eventos'),('Diversos')
) as s(nome)
where e.segmento = 'Agência de Marketing/Publicidade'
on conflict (empresa_id, nome) do nothing;

insert into public.unidades (empresa_id, nome)
select e.id, u.nome from public.empresas e
cross join (values ('Uni'),('Hora'),('Folha'),('M²'),('Pacote')) as u(nome)
where e.segmento = 'Agência de Marketing/Publicidade'
on conflict (empresa_id, nome) do nothing;

-- RESTAURAÇÃO
insert into public.setores (empresa_id, nome)
select e.id, s.nome from public.empresas e
cross join (values
  ('Cozinha'),('Sala'),('Bar'),('Limpeza'),('Economato'),('Diversos')
) as s(nome)
where e.segmento = 'Restauração'
on conflict (empresa_id, nome) do nothing;

insert into public.unidades (empresa_id, nome)
select e.id, u.nome from public.empresas e
cross join (values ('Uni'),('Kg'),('Lt'),('Dose'),('Caixa'),('Garrafa')) as u(nome)
where e.segmento = 'Restauração'
on conflict (empresa_id, nome) do nothing;
