-- =====================================================================
-- SEMENTES DE CONFIGURAÇÃO (listas do modelo do cliente)
-- Tipos de documento, centros de custo e contas bancárias.
-- O Admin pode editar/remover no ecrã Configurações.
-- Correr no SQL Editor do Supabase. Pode correr-se mais do que uma vez.
-- =====================================================================

-- Tipos de documento
insert into public.tipos_documento (empresa_id, nome)
select e.id, v.nome from public.empresas e
cross join (values
  ('Fatura'),('Fatura Recibo'),('Fatura Proforma'),('Nota de Crédito'),('Nota de Débito'),
  ('Recibo'),('Folha de Despesas'),('Folha de Caixa'),('Nota de Honorários'),
  ('Aviso de Pagamento'),('Plano Prestacional'),('Orçamento'),('Guia de Pagamento')
) as v(nome)
on conflict (empresa_id, nome) do nothing;

-- Centros de custo
insert into public.centros_custo (empresa_id, nome)
select e.id, v.nome from public.empresas e
cross join (values
  ('Speed Construções'),('M.aluguer'),('Speed Limpezas'),('Maycon Soares - Pessoal'),('Dick Top')
) as v(nome)
on conflict (empresa_id, nome) do nothing;

-- Contas bancárias
insert into public.contas_bancarias (empresa_id, nome)
select e.id, v.nome from public.empresas e
cross join (values
  ('Millenium'),('Caixa (Dinheiro)'),('BPI 1 (Débito Direto)'),('BPI 2 (Movimentação)'),
  ('Cartão Crédito BPI'),('Conta Agrícola'),('Conta do Sócio Gerente'),('Oferta'),('Outros')
) as v(nome)
on conflict (empresa_id, nome) do nothing;
