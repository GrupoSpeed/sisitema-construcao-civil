# 📋 Relatório do Projeto — Sistema Grupo Speed

> Documento de estado para retomar o trabalho. Última atualização: **2026-06-09**.
> Lê este ficheiro no início de cada sessão para continuar de onde parámos.

---

## 1. O que é o projeto
Plataforma **SaaS multi-empresa** para gestão de empresas de **construção civil** em Portugal.
Cada empresa tem o seu espaço isolado; o dono do SaaS (Super Admin) vê tudo.
São **11 módulos** no total. Estamos a construir o **1.º: Módulo de Materiais**.

> **Visão (multi-segmento):** o sistema deve poder **adaptar-se a vários ramos** além da
> construção civil (ex.: restauração, gráfica…). No **registo da empresa**, ela escolhe o
> **segmento**. As empresas do mesmo segmento vão **alimentando e aproveitando dados partilhados**
> (listas de materiais/produtos comuns e outras configurações), para que cada nova empresa já
> comece com uma base útil. *Ainda não implementado — é a direção a seguir nas decisões de
> modelo de dados e interface.*

## 2. Tecnologias (stack)
- **Frontend (ecrãs):** React + Vite + TypeScript
- **Base de dados + Login:** Supabase (PostgreSQL na nuvem)
- **Histórico de código:** Git / GitHub (cliente tem conta GitHub)
- **Alojamento futuro:** Hostinger (ainda **não** tem conta — só é preciso no fim)
- **Estilo de trabalho:** explicar cada passo de forma didática, sem jargão, sempre em **português europeu**.

## 3. Decisões já tomadas (módulo de materiais)
- **M1** — O Admin da empresa cria os utilizadores (sem auto-registo). Login por email + palavra-passe.
- **M2** — Cada utilizador pertence a 1 empresa; só o Super Admin vê todas.
- **M3** — O catálogo de produtos começa **VAZIO** (colaboradores criam os produtos com foto).
- **M4** — Setores: Elétrica, Hidráulica, Pintura, Construção Civil, Gesso Cartonado, Carpintaria, Capoto, Cobertura/Impermeabilização, Ar Condicionado, Demolição, Ferramentas, Diversos.
- **M5** — Unidades: Uni, M, M², M³, Kg, Lt, Rolo, Saco.
- **M6** — Contas bancárias: tabela de configuração preenchida pelo Admin depois.
- **M7** — Fornecedores: vêm do CRM; pode criar novo na hora.
- **M8** — Notificações: dentro do sistema (🔔) por agora; email mais tarde.
- **M9** — Fotos/recibos: guardados no Supabase Storage.

### Fluxo do Módulo de Materiais
**Solicitar** (colaborador) → **Aprovar** (encarregado) → **Reservar + Comprar** (comprador, com foto do recibo + valor obrigatórios) → **Validar** (escritório, antes de entrar no financeiro).

## 4. O que já está FEITO ✅
**Base técnica**
- ✅ Ferramentas (Node, npm, Git, Supabase CLI). Projeto React + Vite + TypeScript em `C:\Users\Maycon\Desktop\Sistema - Construção Civil\grupo-speed`.
- ✅ App corre em `http://localhost:5173` (`npm run dev`). Verificação: `npm run build`.
- ✅ Supabase ligado: URL `https://ucsfinbopucmrrblfdew.supabase.co`; chave no `.env` (protegido). `src/lib/supabaseClient.ts`.

**Base de dados (SQL na pasta `database/`, já corridos no Supabase)**
- `01_esquema_inicial.sql` — empresas, perfis, obras, fornecedores, contas_bancarias, produtos, pedidos_material, pedido_itens + RLS por empresa + funções `empresa_atual()` / `e_super_admin()`.
- `02_primeiro_utilizador.sql` — 1ª empresa "Grupo Speed" + Admin (`adm.teste@grupospeed.pt`, nível 8, super admin).
- `03_storage_fotos.sql` — bucket `produtos` (fotos de produtos).
- `04_categorias_marcas.sql` — listas inteligentes `categorias` e `marcas`.
- `05_empresa_logo.sql` — `empresas.logo_url` + bucket `empresas` (logótipos).
- `06_produto_fornecedores.sql` — ligação produto↔fornecedores (muitos-p/muitos) com `valor` (preço de referência por fornecedor).
- `07_empresa_dados.sql` — campos da empresa: morada, codigo_postal, localidade, telefone, email, website.

**Funcionalidades (React)**
- ✅ Login (Supabase Auth) + carregamento de perfil e empresa (`AuthContext`).
- ✅ Barra de topo: logótipo+nome da empresa, nome+cargo do utilizador, menu **☰** (navega entre Catálogo e Perfil da Empresa + Sair com confirmação).
- ✅ **Catálogo de Materiais** (`CatalogoProdutos`): listar/adicionar/editar/eliminar (com confirmações), foto com pré-visualização, listas inteligentes Categoria/Marca, filtros (texto+setor+categoria), sugestões anti-duplicados, validação "aprovado" (escritório), **vários fornecedores por produto com preço + preço médio**.
- ✅ **Perfil da Empresa** (`PerfilEmpresa`): editar dados + carregar logótipo.

## 5. PRÓXIMO PASSO (quando retomarmos) ▶️
**Construir o fluxo de Pedidos de Material** (o coração do módulo), pela ordem:
1. **Solicitar** (colaborador): escolher produtos do catálogo (tipo carrinho), quantidade + unidade + observação, obra, data de necessidade → cria `pedidos_material` + `pedido_itens` (estado "pendente").
2. **Aprovar** (encarregado N3): ver pedidos, aprovar/editar/rejeitar (com motivo).
3. **Reservar + Comprar** (permissão comprador): ver aprovados de todas as obras, marcar comprado (foto recibo + valor obrigatórios + conta + fornecedor) → **ajusta o valor real** e cria registo no **histórico de preços** (criar tabela `historico_precos`).
4. **Validar** (escritório N4+): valida a compra antes de entrar no financeiro.

> Nota: precisaremos de **obras** (criar tela simples de obras) porque o pedido é por obra. Considerar criar tela de Obras antes do "Solicitar".

## 6. Notas importantes / segredos
- **Palavra-passe da base de dados:** está (deve estar) guardada pelo cliente no gestor de palavras-passe. NUNCA colar no chat.
- **Connection string** (`postgresql://...`): não é necessária por agora; as tabelas criam-se pelo Editor SQL do Supabase.
- A chave `service_role` (secreta) **nunca** deve ser partilhada. Só usamos a `anon`/`publishable`.

## 7. Pendentes (não bloqueiam o desenvolvimento)
- Software de faturação (Moloni recomendado) — só no Módulo 08.
- Preços finais dos planos SaaS — só no lançamento comercial.
- Conta Hostinger — só no fim, para publicar.

## 8. Dados Excel já recebidos (reservados para depois)
- **Modelo.xlsm** → categorias e trabalhos → para o **Módulo 07 (Orçamentos)**.
- Outros ficheiros (Sistema.xlsm, Financeiro, RH, Caixa) ainda por enviar.

---
**Como retomar:** abrir o projeto, dizer ao Claude "lê o RELATORIO-PROJETO.md e continuamos", e seguir o Próximo Passo (secção 5).
