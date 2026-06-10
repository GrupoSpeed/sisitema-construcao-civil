-- =====================================================================
-- CATEGORIA DO MOVIMENTO depende do TIPO DE CUSTO (Fixo / Variável)
-- Acrescenta a coluna `tipo` e semeia as listas (do modelo do cliente).
-- Correr no SQL Editor do Supabase. Pode correr-se mais do que uma vez.
-- =====================================================================

alter table public.categorias_mov add column if not exists tipo text;
alter table public.categorias_mov drop constraint if exists categorias_mov_empresa_id_nome_key;
create unique index if not exists categorias_mov_emp_tipo_nome
  on public.categorias_mov (empresa_id, tipo, nome);

insert into public.categorias_mov (empresa_id, tipo, nome)
select e.id, v.tipo, v.nome from public.empresas e
cross join (values
  ('Fixo','Seguros'),('Fixo','Seguro R.C.'),('Fixo','Seguro Auto'),('Fixo','Estrutura-Renda'),
  ('Fixo','Estrutura-Água'),('Fixo','Estrutura-Eletricidade'),('Fixo','Estrutura-Telecomunicação'),
  ('Fixo','Pessoal-Seguro Auto'),('Fixo','Pessoal-Renda'),('Fixo','Pessoal-Água'),
  ('Fixo','Pessoal-Eletricidade'),('Fixo','Pessoal-Telecomunicações'),('Fixo','Pessoal-Pensão'),
  ('Fixo','Créditos'),('Fixo','Serv. Consultoria'),('Fixo','Contabilidade'),('Fixo','Banco'),
  ('Fixo','Impostos'),('Fixo','Automóveis'),('Fixo','Equipamentos'),('Fixo','Peças Carro/Manutenção'),
  ('Fixo','Outros'),
  ('Variável','Deslocações'),('Variável','Combustíveis'),('Variável','Alimentação'),
  ('Variável','M.O Extra'),('Variável','Equipamentos / ferramentas'),('Variável','Material Escritório'),
  ('Variável','Matéria Prima'),('Variável','Materiais / Produtos'),('Variável','EPI'),
  ('Variável','Diversas'),('Variável','Orçamento'),('Variável','Impostos - Finanças')
) as v(tipo, nome)
where e.segmento = 'Construção Civil' or e.segmento is null or true
on conflict (empresa_id, tipo, nome) do nothing;
