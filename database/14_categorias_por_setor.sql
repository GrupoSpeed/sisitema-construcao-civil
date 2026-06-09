-- =====================================================================
-- CATEGORIA PERTENCE A UM SETOR (relação setor -> categorias)
-- Ex.: setor "Elétrica" tem categorias "Cabos", "Tomadas e Interruptores"…
-- Acrescenta a coluna `setor`, ajusta a unicidade e re-semeia por segmento.
-- Correr no SQL Editor do Supabase. Pode correr-se mais do que uma vez.
-- =====================================================================

-- 1) Coluna do setor + unicidade por (empresa, setor, nome)
alter table public.categorias add column if not exists setor text;
alter table public.categorias drop constraint if exists categorias_empresa_id_nome_key;
create unique index if not exists categorias_empresa_setor_nome
  on public.categorias (empresa_id, setor, nome);

-- 2) Limpa as categorias antigas (que ainda não tinham setor) para re-semear certo
delete from public.categorias where setor is null;

-- 3) Sementes categoria-por-setor ------------------------------------------------

-- CONSTRUÇÃO CIVIL
insert into public.categorias (empresa_id, setor, nome)
select e.id, v.setor, v.nome from public.empresas e
cross join (values
  ('Elétrica','Cabos'),('Elétrica','Tomadas e Interruptores'),('Elétrica','Quadros Elétricos'),('Elétrica','Iluminação'),('Elétrica','Calhas e Tubos'),
  ('Hidráulica','Tubagem'),('Hidráulica','Torneiras'),('Hidráulica','Válvulas'),('Hidráulica','Acessórios'),('Hidráulica','Sanitários'),
  ('Pintura','Tintas'),('Pintura','Primários'),('Pintura','Diluentes'),('Pintura','Rolos e Pincéis'),('Pintura','Fitas'),
  ('Construção Civil','Cimentos'),('Construção Civil','Argamassas'),('Construção Civil','Tijolos'),('Construção Civil','Areia e Brita'),('Construção Civil','Blocos'),
  ('Gesso Cartonado','Placas'),('Gesso Cartonado','Perfis'),('Gesso Cartonado','Massa de Juntas'),('Gesso Cartonado','Fita de Junta'),
  ('Carpintaria','Madeiras'),('Carpintaria','Painéis'),('Carpintaria','Ferragens'),('Carpintaria','Portas'),
  ('Capoto','Painéis Isolantes'),('Capoto','Colas'),('Capoto','Rede'),('Capoto','Acabamentos'),
  ('Cobertura/Impermeabilização','Telhas'),('Cobertura/Impermeabilização','Telas'),('Cobertura/Impermeabilização','Isolamentos'),('Cobertura/Impermeabilização','Caleiras'),
  ('Ar Condicionado','Equipamentos'),('Ar Condicionado','Tubagem de Cobre'),('Ar Condicionado','Suportes'),('Ar Condicionado','Acessórios'),
  ('Demolição','Discos de Corte'),('Demolição','Sacos de Entulho'),('Demolição','Pontas'),
  ('Ferramentas','Manuais'),('Ferramentas','Elétricas'),('Ferramentas','Consumíveis'),('Ferramentas','Proteção'),
  ('Diversos','Diversos')
) as v(setor, nome)
where e.segmento = 'Construção Civil'
on conflict (empresa_id, setor, nome) do nothing;

-- AGÊNCIA DE MARKETING/PUBLICIDADE
insert into public.categorias (empresa_id, setor, nome)
select e.id, v.setor, v.nome from public.empresas e
cross join (values
  ('Design','Software'),('Design','Material de Desenho'),('Design','Mockups'),
  ('Impressão','Papel'),('Impressão','Tintas de Impressão'),('Impressão','Lonas'),('Impressão','Vinil'),('Impressão','Acabamentos'),
  ('Digital','Domínios'),('Digital','Alojamento'),('Digital','Anúncios'),('Digital','Software'),
  ('Audiovisual','Câmaras'),('Audiovisual','Iluminação'),('Audiovisual','Áudio'),('Audiovisual','Edição'),
  ('Brindes','Têxteis'),('Brindes','Canetas'),('Brindes','Sacos'),('Brindes','Personalização'),
  ('Eventos','Estruturas'),('Eventos','Decoração'),('Eventos','Catering'),('Eventos','Sinalética'),
  ('Diversos','Diversos')
) as v(setor, nome)
where e.segmento = 'Agência de Marketing/Publicidade'
on conflict (empresa_id, setor, nome) do nothing;

-- RESTAURAÇÃO
insert into public.categorias (empresa_id, setor, nome)
select e.id, v.setor, v.nome from public.empresas e
cross join (values
  ('Cozinha','Carnes'),('Cozinha','Peixe'),('Cozinha','Legumes'),('Cozinha','Mercearia'),('Cozinha','Congelados'),('Cozinha','Temperos'),
  ('Sala','Loiça'),('Sala','Talheres'),('Sala','Toalhas'),('Sala','Decoração'),
  ('Bar','Bebidas'),('Bar','Vinhos'),('Bar','Cafés'),('Bar','Copos'),
  ('Limpeza','Detergentes'),('Limpeza','Descartáveis'),('Limpeza','Utensílios'),
  ('Economato','Embalagens'),('Economato','Papel'),('Economato','Material de Escritório'),
  ('Diversos','Diversos')
) as v(setor, nome)
where e.segmento = 'Restauração'
on conflict (empresa_id, setor, nome) do nothing;
