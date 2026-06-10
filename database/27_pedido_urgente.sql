-- =====================================================================
-- PEDIDOS: marcar um pedido como URGENTE
-- Correr no SQL Editor do Supabase. Pode correr-se mais do que uma vez.
-- =====================================================================

alter table public.pedidos_material add column if not exists urgente boolean not null default false;
