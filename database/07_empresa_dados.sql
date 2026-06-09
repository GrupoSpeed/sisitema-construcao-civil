-- =====================================================================
-- DADOS ADICIONAIS DA EMPRESA (perfil)
-- Correr no SQL Editor do Supabase. Pode correr-se mais do que uma vez.
-- =====================================================================

alter table public.empresas add column if not exists morada text;
alter table public.empresas add column if not exists codigo_postal text;
alter table public.empresas add column if not exists localidade text;
alter table public.empresas add column if not exists telefone text;
alter table public.empresas add column if not exists email text;
alter table public.empresas add column if not exists website text;
