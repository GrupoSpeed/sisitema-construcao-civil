-- =====================================================================
-- ITENS: método de pagamento (escolhido por quem compra: Dinheiro / Cartão)
-- A conta bancária específica é atribuída depois pelo escritório (validação).
-- Correr no SQL Editor do Supabase. Pode correr-se mais do que uma vez.
-- =====================================================================

alter table public.pedido_itens add column if not exists metodo_pagamento text; -- 'Dinheiro' / 'Cartão'
