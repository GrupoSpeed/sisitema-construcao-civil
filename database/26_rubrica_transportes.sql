-- =====================================================================
-- RUBRICA (categoria de movimento): acrescentar "Transportes" (Variável)
-- O resto das rubricas já foi semeado em 21_categorias_mov_tipo.sql.
-- Geríveis em Configurações → Categorias de movimento.
-- Correr no SQL Editor do Supabase. Pode correr-se mais do que uma vez.
-- =====================================================================

insert into public.categorias_mov (empresa_id, tipo, nome)
select e.id, 'Variável', 'Transportes' from public.empresas e
on conflict (empresa_id, tipo, nome) do nothing;
