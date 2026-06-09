-- =====================================================================
-- LOGÓTIPO DA EMPRESA
-- Adiciona a coluna do logótipo e cria o armazém de logótipos.
-- Correr no SQL Editor do Supabase. Pode correr-se mais do que uma vez.
-- =====================================================================

-- Coluna para guardar o endereço do logótipo
alter table public.empresas add column if not exists logo_url text;

-- Armazém público para os logótipos das empresas
insert into storage.buckets (id, name, public)
values ('empresas', 'empresas', true)
on conflict (id) do nothing;

-- Utilizadores autenticados podem carregar e atualizar logótipos
drop policy if exists "empresas_logo_upload" on storage.objects;
create policy "empresas_logo_upload" on storage.objects
  for insert to authenticated
  with check ( bucket_id = 'empresas' );

drop policy if exists "empresas_logo_update" on storage.objects;
create policy "empresas_logo_update" on storage.objects
  for update to authenticated
  using ( bucket_id = 'empresas' );

drop policy if exists "empresas_logo_leitura" on storage.objects;
create policy "empresas_logo_leitura" on storage.objects
  for select
  using ( bucket_id = 'empresas' );
