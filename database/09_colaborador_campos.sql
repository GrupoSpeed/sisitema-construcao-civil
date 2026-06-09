-- =====================================================================
-- COLABORADORES: campos extra no perfil (NIF e email para mostrar na lista)
-- O email também vive em auth.users (login); aqui guardamos uma cópia só
-- para conseguir mostrá-lo na tabela de colaboradores sem aceder ao auth.
-- Correr no SQL Editor do Supabase. Pode correr-se mais do que uma vez.
-- =====================================================================

alter table public.perfis add column if not exists nif   text;
alter table public.perfis add column if not exists email text;
