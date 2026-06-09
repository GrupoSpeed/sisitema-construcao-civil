-- =====================================================================
-- PRIMEIRA EMPRESA + UTILIZADOR ADMIN
-- Corre isto DEPOIS de criares o utilizador em Authentication > Users.
-- ANTES de correr: troca o email abaixo pelo email que usaste nesse utilizador.
-- =====================================================================

with nova_empresa as (
  insert into public.empresas (nome, nif)
  values ('Grupo Speed', null)
  returning id
)
insert into public.perfis (id, empresa_id, nome, nivel_acesso, is_super_admin, ativo)
select
  u.id,
  e.id,
  'Administrador',
  8,        -- nível 8 = Admin Empresa
  true,     -- é também Super Admin (dono do SaaS)
  true
from auth.users u, nova_empresa e
where u.email = 'adm.teste@grupospeed.pt';
