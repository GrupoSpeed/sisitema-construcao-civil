-- =====================================================================
-- SEMENTES POR SEGMENTO: categorias e marcas
-- As tabelas já existem (04_categorias_marcas.sql). Aqui só semeamos
-- valores iniciais conforme o SEGMENTO de cada empresa. A empresa pode
-- acrescentar/remover à vontade.
-- Correr no SQL Editor do Supabase. Pode correr-se mais do que uma vez.
-- =====================================================================

-- ----- CONSTRUÇÃO CIVIL ------------------------------------------------------
insert into public.categorias (empresa_id, nome)
select e.id, c.nome from public.empresas e
cross join (values
  ('Cimentos'),('Argamassas'),('Tintas'),('Tubagem'),('Cabos Elétricos'),
  ('Madeiras'),('Isolamentos'),('Parafusos e Fixações'),('Telhas'),('Vidros'),
  ('Ferramentas'),('Diversos')
) as c(nome)
where e.segmento = 'Construção Civil'
on conflict (empresa_id, nome) do nothing;

insert into public.marcas (empresa_id, nome)
select e.id, m.nome from public.empresas e
cross join (values
  ('Sika'),('Weber'),('CIN'),('Robbialac'),('Hilti'),('Bosch'),('Leca'),('Secil'),('Diversos')
) as m(nome)
where e.segmento = 'Construção Civil'
on conflict (empresa_id, nome) do nothing;

-- ----- AGÊNCIA DE MARKETING/PUBLICIDADE --------------------------------------
insert into public.categorias (empresa_id, nome)
select e.id, c.nome from public.empresas e
cross join (values
  ('Papel'),('Tintas de Impressão'),('Lonas'),('Vinil'),('Brindes'),
  ('Material de Escritório'),('Equipamento'),('Diversos')
) as c(nome)
where e.segmento = 'Agência de Marketing/Publicidade'
on conflict (empresa_id, nome) do nothing;

insert into public.marcas (empresa_id, nome)
select e.id, m.nome from public.empresas e
cross join (values ('HP'),('Canon'),('Epson'),('Adobe'),('3M'),('Diversos')) as m(nome)
where e.segmento = 'Agência de Marketing/Publicidade'
on conflict (empresa_id, nome) do nothing;

-- ----- RESTAURAÇÃO -----------------------------------------------------------
insert into public.categorias (empresa_id, nome)
select e.id, c.nome from public.empresas e
cross join (values
  ('Carnes'),('Peixe'),('Legumes'),('Bebidas'),('Mercearia'),
  ('Limpeza'),('Descartáveis'),('Diversos')
) as c(nome)
where e.segmento = 'Restauração'
on conflict (empresa_id, nome) do nothing;

insert into public.marcas (empresa_id, nome)
select e.id, m.nome from public.empresas e
cross join (values ('Delta'),('Compal'),('Nestlé'),('Sical'),('Diversos')) as m(nome)
where e.segmento = 'Restauração'
on conflict (empresa_id, nome) do nothing;
