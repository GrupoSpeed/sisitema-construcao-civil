# 📋 Relatório do Projeto — Sistema Grupo Speed

> Documento de estado para retomar o trabalho. Última atualização: **2026-06-10**.
> Lê este ficheiro no início de cada sessão para continuar de onde parámos.

---

## 1. O que é o projeto
Plataforma **SaaS multi-empresa e multi-segmento** para gestão de empresas em Portugal.
Cada empresa tem o seu espaço isolado; o dono do SaaS (Super Admin) vê tudo.
São **11 módulos** no total. Estamos a construir o **1.º: Módulo de Materiais**.

> **Visão multi-segmento:** o sistema adapta-se a vários ramos (Construção Civil, Agência de
> Marketing/Publicidade, Restauração…). No registo, a empresa escolhe o **segmento**, e as listas
> (setor, unidade, categoria, marca) são **semeadas conforme o segmento** e crescem com o uso.
> Uma agência de marketing nunca vê "Cimento". *Futuro: dados partilhados por segmento + painel
> Super Admin para gerir os segmentos.*

## 2. Tecnologias (stack)
- **Frontend:** React + Vite + TypeScript. Corre em `http://localhost:5173` (`npm run dev`); verificar com `npm run build`.
- **Base de dados + Login:** Supabase (PostgreSQL). URL `https://ucsfinbopucmrrblfdew.supabase.co`; chave no `.env` (protegido). `src/lib/supabaseClient.ts`.
- **GitHub:** `https://github.com/GrupoSpeed/sisitema-construcao-civil` (privado). Gravar = commit + push (login já memorizado).
- **Alojamento futuro:** Hostinger (ainda sem conta — só no fim).
- **Estilo de trabalho:** explicar cada passo de forma didática, sem jargão, sempre em **português europeu**. SQL sempre colado no chat para o cliente copiar.

## 3. Decisões / regras importantes
- **Níveis de acesso (1-8):** transversais a todos os módulos; acumulam (cada nível faz o dos de baixo + o seu). A **profissão ≠ nível** (um servente pode ter nível 2). Ativos agora: 1 (só ponto), 2 (solicita materiais), 3 (aprova/reserva), 4 (escritório/valida), 8 (admin). 5/6/7 entram com os módulos de obras/financeiro. Nível 9 = Super Admin (dono do SaaS).
- **Formatação (todos os ecrãs):** capitalizar nomes + `spellCheck` off; máscara `000 000 000` (NIF/telefone); código postal `0000-000`; email minúsculas/validado; palavra-passe provisória = 8 números (data de nascimento). Helpers em `src/lib/constantes.ts`.
- **Tabelas:** todas usam `tabela-scroll` (rola na horizontal, texto compacto, `nowrap`).
- **Colaboradores:** criados pelo Admin no Perfil da Empresa (login + perfil). Solução **temporária** no frontend (2.º cliente Supabase); falta Edge Function server-side. Exige "Confirm email" DESLIGADO no Supabase.
- **Obras → Projetos:** termo genérico (multi-segmento). Tabela `projetos`, coluna `pedidos_material.projeto_id`.
- **NIG** = Número de Identificação no Grupo (id do cliente). Mostrado como `nig - nome`.

### Fluxo do Módulo de Materiais (modelo do cliente — por ITEM, não por pedido)
Baseado no protótipo FlutterFlow do cliente: gestão numa **lista única por item com abas de estado**.
**Solicitar** (colaborador N2) → **Reservar** (encarregado N3, ✓) → **Comprar** (Comprador: fornecedor + valor + método Dinheiro/Cartão/Outros + foto do recibo) → **Validar** (escritório N4+).
Estados do item: `solicitado → reservado → comprado → validado` (ou `rejeitado`).
O colaborador pode **cancelar item a item** em "Os meus pedidos" enquanto está "solicitado".
O **processo completo do escritório** (na Validação: conta bancária específica, etc.) está simplificado e fica para a próxima etapa.

## 4. O que já está FEITO ✅

**Base de dados (SQL em `database/`, já corridos no Supabase)**
- `01`–`07` — esquema inicial, 1.º utilizador, bucket fotos, categorias/marcas, logótipo, produto↔fornecedores, dados da empresa.
- `08_localidades.sql`, `09_colaborador_campos.sql` (nif/email no perfil), `10_empresa_segmento.sql`, `11_segmentos.sql`.
- `12_setores_unidades.sql` — setor/unidade por segmento. `13` — sementes categorias/marcas. `14_categorias_por_setor.sql` — categoria pertence ao setor.
- `15_obras_para_projetos.sql` (rename). `16_clientes_projetos.sql` — mini-CRM clientes + campos do mapa de projetos.
- `17_pedidos.sql` — `pedidos_material` + `pedido_itens` (projeto_id). `18_itens_compra.sql` — colunas reserva/compra + contas + bucket `recibos`. `19_metodo_pagamento.sql`.
> ✅ Todos os SQL `01`–`19` confirmados como corridos no Supabase (2026-06-10).

**Funcionalidades (React)**
- ✅ Login + `AuthContext` (perfil/empresa). Barra de topo **fixa** + menu ☰ por permissão. Rodapé fixo (RGPD). Títulos de secção fixos ao rolar.
- ✅ **Catálogo de Materiais** — segmento→setor→categoria, unidade/marca, fotos, vários fornecedores c/ preço médio, **lançamento em lote** (adicionar vários no mesmo setor).
- ✅ **Perfil da Empresa** — dados (modo leitura + ✏️ editar + confirmação), segmento, logótipo, e **Gestão de Colaboradores** (criar/editar/excluir, guia de níveis).
- ✅ **Empresas Registadas** (Super Admin).
- ✅ **Projetos** (mapa completo: nº, cliente mini-CRM, zona, centro de custo, diretor+contacto, encarregado, datas, estado).
- ✅ **Pedidos de Material — Solicitar:** filtra por setor/categoria + pesquisa, lista de produtos com foto e caixas de seleção (marca → entra no pedido e preenche qtd/unidade/obs), carrinho, envia. **"Os meus pedidos"** com cancelamento **item a item** (enquanto "solicitado").
- ✅ **Lista de Materiais** (gestão por item, modelo do cliente): abas Tudo/Solicitado/Reservado/Comprado/Validado/Rejeitado, filtros projeto/setor, ações por linha (Reservar/Rejeitar/Comprar/Validar), **👁️ Ver** (detalhe + dados do solicitante).

## 5. PRÓXIMO PASSO ▶️
1. **Processo do escritório (Validar a sério):** definir o que o escritório preenche (conta bancária específica, etc.) — ficou simplificado por agora.
2. **Histórico de preços:** criar `historico_precos` ao registar a compra (guardar valor real por produto/fornecedor).
3. **Contas bancárias:** tela para o Admin as criar (a compra/validação já referencia conta).
4. **Notificações 🔔** dentro do sistema.
5. Melhorar criação de colaboradores (**Edge Function** server-side) e gestão de clientes (editar/eliminar).

## 6. Notas / segredos
- Palavra-passe da BD e chave `service_role`: **nunca** partilhar/colar no chat. Só usamos a `anon`.
- Tabelas criam-se pelo Editor SQL do Supabase (sem connection string).

## 7. Pendentes (não bloqueiam)
- Faturação (Moloni) — Módulo 08. Preços dos planos — no lançamento. Conta Hostinger — no fim.

## 8. Dados Excel recebidos (para depois)
- **Modelo.xlsm** → categorias/trabalhos → Módulo 07 (Orçamentos). Mapa de projetos (FlutterFlow) já usado como referência.

---
**Como retomar:** abrir o projeto, dizer ao Claude "lê o RELATORIO-PROJETO.md e continuamos", e seguir o Próximo Passo (secção 5).
