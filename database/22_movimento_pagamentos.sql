-- =====================================================================
-- PAGAMENTOS DE UM MOVIMENTO (total ou parcial)
-- Um movimento pode ter vários pagamentos até liquidar o valor bruto.
-- Cada pagamento regista quem o lançou.
-- Correr no SQL Editor do Supabase. Pode correr-se mais do que uma vez.
-- =====================================================================

create table if not exists public.movimento_pagamentos (
  id           uuid primary key default gen_random_uuid(),
  empresa_id   uuid not null references public.empresas(id) on delete cascade,
  movimento_id uuid not null references public.movimentos(id) on delete cascade,
  valor        numeric(12,2) not null,
  data         date,
  metodo       text,
  conta        text,
  criado_por   uuid references public.perfis(id) on delete set null,
  criado_em    timestamptz not null default now()
);

alter table public.movimento_pagamentos enable row level security;
drop policy if exists "movimento_pagamentos_acesso" on public.movimento_pagamentos;
create policy "movimento_pagamentos_acesso" on public.movimento_pagamentos for all
  using      ( empresa_id = public.empresa_atual() or public.e_super_admin() )
  with check ( empresa_id = public.empresa_atual() or public.e_super_admin() );
