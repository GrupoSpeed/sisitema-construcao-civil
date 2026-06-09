-- =====================================================================
-- RENOMEAR "obras" -> "projetos" (termo genérico para multi-segmento)
-- Também renomeia a coluna pedidos_material.obra_id -> projeto_id e a política RLS.
-- Correr no SQL Editor do Supabase. Correr UMA vez.
-- =====================================================================

alter table public.obras rename to projetos;
alter table public.pedidos_material rename column obra_id to projeto_id;
alter policy "obras_acesso" on public.projetos rename to "projetos_acesso";
