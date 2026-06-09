-- =====================================================================
-- EMPRESA: segmento / ramo de atividade (construção, restauração, gráfica…)
-- Escolhido pela empresa; base para, no futuro, partilhar dados por segmento.
-- Correr no SQL Editor do Supabase. Pode correr-se mais do que uma vez.
-- =====================================================================

alter table public.empresas add column if not exists segmento text;
