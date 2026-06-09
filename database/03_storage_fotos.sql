-- =====================================================================
-- ARMAZÉM DE FOTOS DOS PRODUTOS (Supabase Storage)
-- Cria um "bucket" (armazém) público chamado "produtos" e as regras
-- para utilizadores autenticados poderem carregar fotos.
-- Correr no SQL Editor do Supabase. Pode correr-se mais do que uma vez.
-- =====================================================================

-- Cria o armazém (público para as fotos poderem ser mostradas facilmente)
insert into storage.buckets (id, name, public)
values ('produtos', 'produtos', true)
on conflict (id) do nothing;

-- Permitir a utilizadores autenticados CARREGAR fotos para este armazém
drop policy if exists "produtos_upload" on storage.objects;
create policy "produtos_upload" on storage.objects
  for insert
  to authenticated
  with check ( bucket_id = 'produtos' );

-- Permitir LEITURA das fotos (o armazém é público; esta política reforça o acesso)
drop policy if exists "produtos_leitura" on storage.objects;
create policy "produtos_leitura" on storage.objects
  for select
  using ( bucket_id = 'produtos' );
