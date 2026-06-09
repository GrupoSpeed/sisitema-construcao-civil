# 🔐 Níveis de Acesso — Guia para quem regista colaboradores

Cada colaborador tem **um nível** (de 1 a 8) que define o que pode fazer no sistema.
Quanto maior o número, mais permissões. Escolhe o nível pela **função real** da pessoa na empresa.

> 🔁 **Os níveis acumulam:** cada nível faz **tudo o que os de baixo fazem**, mais a sua função
> própria. Por exemplo, um Gestor de Obra (nível 5) também marca o ponto e também pode solicitar
> materiais.

> O nível **9 (Super Admin)** é exclusivo do dono do sistema (Grupo Speed) e não aparece para escolher.

> ⏳ **Ativos agora:** níveis **1, 2, 3, 4 e 8** (são os que os módulos já construídos usam).
> Os níveis **5, 6 e 7** serão ativados quando construirmos os módulos de obras/financeiro.

---

## Tabela rápida

| Nível | Cargo | Resumo | Estado |
|:---:|---|---|:---:|
| 1 | Colaborador Básico | Só marca o ponto (entrada/saída). | ✅ |
| 2 | Colaborador Completo | Marca ponto + solicita materiais e cria produtos. | ✅ |
| 3 | Encarregado | Aprova ou rejeita os pedidos de material. | ✅ |
| 4 | Assistente Administrativo | Escritório: valida as compras antes do financeiro. | ✅ |
| 5 | Gestor de Obra | Gere obras e acompanha os pedidos. | ⏳ em breve |
| 6 | Gestor Financeiro | Acesso à área financeira. | ⏳ em breve |
| 7 | Diretor / Sócio | Visão geral de toda a empresa. | ⏳ em breve |
| 8 | Admin Empresa | Gere utilizadores e dados da empresa. | ✅ |

---

## Explicação detalhada

### Nível 1 — Colaborador Básico
O trabalhador de campo. No sistema **só faz uma coisa: marcar o ponto** (registar a hora de
**entrada e de saída**). Não acede ao catálogo, aos pedidos nem a qualquer outro módulo.
> *Exemplo: ajudante, servente.*

### Nível 2 — Colaborador Completo
Marca o ponto **e**, no Módulo de Materiais, pode **solicitar materiais** e **criar novos
produtos** no catálogo (com foto). É aqui que começa o acesso aos materiais.
> *Exemplo: oficial, pedreiro experiente.*

### Nível 3 — Encarregado
Recebe os pedidos dos colaboradores e **aprova, edita ou rejeita** (com motivo).
É o primeiro "filtro" antes de comprar.
> *Exemplo: encarregado de obra, chefe de equipa.*

### Nível 4 — Assistente Administrativo
Trabalha no **escritório**. Depois da compra feita, **valida** que está tudo certo
(recibo, valor) antes de entrar nas contas.
> *Exemplo: administrativo, apoio ao escritório.*

### Nível 5 — Gestor de Obra
**Gere as obras**: cria obras, acompanha os pedidos de várias frentes ao mesmo tempo.
Tem uma visão mais alargada do que o encarregado.
> *Exemplo: diretor de obra, coordenador.*

### Nível 6 — Gestor Financeiro
Acesso à **parte financeira** (valores, contas, pagamentos).
> *Exemplo: responsável financeiro, contabilidade interna.*

### Nível 7 — Diretor / Sócio
**Visão geral** de toda a empresa: obras, materiais e finanças. Pensado para a direção.
> *Exemplo: sócio, diretor-geral.*

### Nível 8 — Admin Empresa
O **gestor do sistema dentro da empresa**. Pode **criar e gerir colaboradores**, editar
os dados da empresa e o logótipo. Normalmente é só 1 ou 2 pessoas.
> *Exemplo: dono da empresa, gestor de confiança.*

---

## Permissão extra: **Comprador** ✔️

Independente do nível, podes marcar alguém como **Comprador**. Essa pessoa fica autorizada a
**registar as compras** (com foto do recibo e valor obrigatórios). Pode ser dada, por exemplo,
a um encarregado (nível 3) que também faz as compras.

---

## Regra prática para escolher
1. A pessoa só **marca o ponto**? → **Nível 1**.
2. A pessoa **pede materiais** (e cria produtos)? → **Nível 2**.
3. A pessoa **aprova** pedidos? → **Nível 3**.
3. Trabalha no **escritório a validar**? → **Nível 4**.
4. **Gere obras**? → **Nível 5**.
5. Vê **finanças**? → **Nível 6**.
6. É da **direção**? → **Nível 7**.
7. **Gere o sistema e os utilizadores**? → **Nível 8**.

E se também **faz compras**, marca a caixa **Comprador**. ✔️
