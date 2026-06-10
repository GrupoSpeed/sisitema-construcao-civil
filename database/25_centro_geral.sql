-- =====================================================================
-- CENTRO DE CUSTO "Geral" (inclui sempre TODAS as contas, automaticamente)
-- Os outros centros de custo definem as suas contas (ligação manual).
-- Correr no SQL Editor do Supabase. Pode correr-se mais do que uma vez.
-- =====================================================================

insert into public.centros_custo (empresa_id, nome)
select id, 'Geral' from public.empresas
on conflict (empresa_id, nome) do nothing;
