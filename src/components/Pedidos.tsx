// Ecrã de Pedidos de Material — passo "Solicitar".
// O colaborador monta um pedido (carrinho) de produtos do catálogo para um projeto.
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Perfil } from '../contexts/AuthContext'

const HOJE = new Date().toISOString().slice(0, 10)

type Projeto = { id: string; nome: string; nr_projeto: string | null }
type Produto = {
  id: string
  nome: string
  unidade: string
  setor: string | null
  categoria: string | null
  foto_url: string | null
}

// Linha do "carrinho" antes de enviar
type ItemCarrinho = {
  produto_id: string
  nome: string
  foto_url: string | null
  quantidade: string
  unidade: string
  observacao: string
}

// Pedido já criado (para a lista)
type PedidoItem = {
  id: string
  quantidade: number
  unidade: string
  observacao: string | null
  estado: string
  produtos: { nome: string; foto_url: string | null } | null
}
type Pedido = {
  id: string
  estado: string
  urgente: boolean
  data_necessidade: string | null
  observacao: string | null
  criado_em: string
  projetos: { nome: string; nr_projeto: string | null } | null
  pedido_itens: PedidoItem[]
}

function dataPt(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-PT')
}

export function Pedidos({ perfil }: { perfil: Perfil }) {
  // Quem pode solicitar (nível 2+) — o nível 1 só marca ponto
  const podeSolicitar = perfil.nivel_acesso >= 2 || perfil.is_super_admin

  const [projetos, setProjetos] = useState<Projeto[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [carregando, setCarregando] = useState(true)
  const [aGuardar, setAGuardar] = useState(false)
  const [mensagem, setMensagem] = useState<string | null>(null)

  // Formulário do novo pedido
  const [projetoId, setProjetoId] = useState('')
  const [dataNecessidade, setDataNecessidade] = useState('')
  const [urgente, setUrgente] = useState(false)
  const [observacao, setObservacao] = useState('')
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([])
  const [alvoCancelar, setAlvoCancelar] = useState<{ item: PedidoItem; pedido: Pedido } | null>(null)
  const [aCancelar, setACancelar] = useState(false)
  const [setorPedido, setSetorPedido] = useState('')
  const [categoriaPedido, setCategoriaPedido] = useState('')
  const [pesquisaProduto, setPesquisaProduto] = useState('')

  async function carregarTudo() {
    setCarregando(true)
    const [resProj, resProd, resPed] = await Promise.all([
      supabase.from('projetos').select('id, nome, nr_projeto').order('nome'),
      supabase
        .from('produtos')
        .select('id, nome, unidade, setor, categoria, foto_url')
        .eq('estado', 'aprovado')
        .order('nome'),
      supabase
        .from('pedidos_material')
        .select(
          'id, estado, urgente, data_necessidade, observacao, criado_em, projetos(nome, nr_projeto), pedido_itens(id, quantidade, unidade, observacao, estado, produtos(nome, foto_url))',
        )
        .eq('solicitado_por', perfil.id)
        .order('criado_em', { ascending: false }),
    ])
    if (resProj.data) setProjetos(resProj.data as Projeto[])
    if (resProd.data) setProdutos(resProd.data as Produto[])
    if (resPed.data) setPedidos(resPed.data as unknown as Pedido[])
    setCarregando(false)
  }

  useEffect(() => {
    carregarTudo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Ao marcar/desmarcar um produto, entra/sai logo do pedido (preenche-se a info em baixo)
  function alternarProduto(produtoId: string) {
    if (carrinho.some((i) => i.produto_id === produtoId)) {
      setCarrinho((c) => c.filter((i) => i.produto_id !== produtoId))
      return
    }
    const p = produtos.find((x) => x.id === produtoId)
    if (!p) return
    setCarrinho((c) => [
      ...c,
      {
        produto_id: p.id,
        nome: p.nome,
        foto_url: p.foto_url,
        quantidade: '1',
        unidade: p.unidade,
        observacao: '',
      },
    ])
  }

  function mudarItem(produtoId: string, campo: keyof ItemCarrinho, valor: string) {
    setCarrinho((c) => c.map((i) => (i.produto_id === produtoId ? { ...i, [campo]: valor } : i)))
  }

  function removerItem(produtoId: string) {
    setCarrinho((c) => c.filter((i) => i.produto_id !== produtoId))
  }

  function limpar() {
    setProjetoId('')
    setDataNecessidade('')
    setObservacao('')
    setCarrinho([])
    setUrgente(false)
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setMensagem(null)
    if (!projetoId) {
      setMensagem('⚠️ Escolhe o projeto.')
      return
    }
    if (carrinho.length === 0) {
      setMensagem('⚠️ Adiciona pelo menos um produto ao pedido.')
      return
    }
    if (carrinho.some((i) => !i.quantidade || Number(i.quantidade) <= 0)) {
      setMensagem('⚠️ Indica uma quantidade válida em todos os produtos.')
      return
    }

    setAGuardar(true)
    // 1) Cria o pedido
    const { data: pedido, error: erroPedido } = await supabase
      .from('pedidos_material')
      .insert({
        empresa_id: perfil.empresa_id,
        projeto_id: projetoId,
        solicitado_por: perfil.id,
        estado: 'pendente',
        data_necessidade: dataNecessidade || null,
        urgente,
        observacao: observacao || null,
      })
      .select('id')
      .single()

    if (erroPedido || !pedido) {
      setAGuardar(false)
      setMensagem('❌ Não foi possível criar o pedido: ' + (erroPedido?.message ?? ''))
      return
    }

    // 2) Cria os itens
    const { error: erroItens } = await supabase.from('pedido_itens').insert(
      carrinho.map((i) => ({
        empresa_id: perfil.empresa_id,
        pedido_id: pedido.id,
        produto_id: i.produto_id,
        quantidade: Number(i.quantidade),
        unidade: i.unidade,
        observacao: i.observacao || null,
        estado: 'solicitado',
      })),
    )

    setAGuardar(false)
    if (erroItens) {
      setMensagem('❌ Pedido criado, mas falhou ao guardar os itens: ' + erroItens.message)
      return
    }
    setMensagem('✅ Pedido enviado! Agora segue para aprovação.')
    limpar()
    carregarTudo()
  }

  // Cancela um item (só enquanto "solicitado"). Se for o último, remove o pedido vazio.
  async function cancelarItem() {
    if (!alvoCancelar) return
    const { item, pedido } = alvoCancelar
    setACancelar(true)
    const { error } = await supabase.from('pedido_itens').delete().eq('id', item.id)
    if (!error && pedido.pedido_itens.length === 1) {
      await supabase.from('pedidos_material').delete().eq('id', pedido.id)
    }
    setACancelar(false)
    setAlvoCancelar(null)
    if (error) {
      setMensagem('❌ Não foi possível cancelar: ' + error.message)
      return
    }
    setMensagem('🗑️ Material cancelado.')
    carregarTudo()
  }

  const setoresProduto = [
    ...new Set(produtos.map((p) => p.setor).filter(Boolean)),
  ] as string[]
  // Categorias disponíveis (do setor escolhido, ou de todos)
  const categoriasProduto = [
    ...new Set(
      produtos
        .filter((p) => !setorPedido || p.setor === setorPedido)
        .map((p) => p.categoria)
        .filter(Boolean),
    ),
  ] as string[]

  // Produtos visíveis na lista (setor + categoria + pesquisa). Os já no pedido aparecem marcados.
  const termoPesquisa = pesquisaProduto.trim().toLowerCase()
  const produtosDisponiveis = produtos.filter(
    (p) =>
      (!setorPedido || p.setor === setorPedido) &&
      (!categoriaPedido || p.categoria === categoriaPedido) &&
      (!termoPesquisa || p.nome.toLowerCase().includes(termoPesquisa)),
  )

  return (
    <div className="pagina pagina-larga">
      <h2>Pedidos de Material</h2>
      <p className="subtexto">Solicita os materiais necessários para um projeto.</p>

      {podeSolicitar && (
        <form className="cartao-form" onSubmit={enviar}>
          <h3>Novo pedido</h3>
          <div className="grelha-form">
            <label>
              Projeto *
              <select value={projetoId} onChange={(e) => setProjetoId(e.target.value)}>
                <option value="">(escolher)</option>
                {projetos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nr_projeto ? `${p.nr_projeto} — ${p.nome}` : p.nome}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Data de necessidade
              <input type="date" min={HOJE} value={dataNecessidade} onChange={(e) => setDataNecessidade(e.target.value)} />
            </label>
            <label>
              Observação (opcional)
              <input value={observacao} onChange={(e) => setObservacao(e.target.value)} placeholder="Ex: entregar na obra de manhã" />
            </label>
          </div>

          {/* Adicionar produtos ao carrinho — filtrar por setor/categoria facilita */}
          <div className="adicionar-produto">
            <div className="grelha-form">
              <label>
                Setor
                <select
                  value={setorPedido}
                  onChange={(e) => {
                    setSetorPedido(e.target.value)
                    setCategoriaPedido('') // a categoria depende do setor
                  }}
                >
                  <option value="">Todos os setores</option>
                  {setoresProduto.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Categoria
                <select value={categoriaPedido} onChange={(e) => setCategoriaPedido(e.target.value)}>
                  <option value="">Todas as categorias</option>
                  {categoriasProduto.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <span className="rotulo-campo">
              Escolher produtos — marca os que queres ({produtosDisponiveis.length} disponíveis)
            </span>
            <input
              className="filtro-texto pesquisa-produto"
              placeholder="🔍 Procurar produto…"
              value={pesquisaProduto}
              onChange={(e) => setPesquisaProduto(e.target.value)}
            />
            {produtos.length === 0 ? (
              <small className="aviso-duplicado">
                ⚠️ Ainda não há produtos aprovados no catálogo para pedir.
              </small>
            ) : produtosDisponiveis.length === 0 ? (
              <p className="vazio">Nenhum produto neste setor/categoria.</p>
            ) : (
              <div className="lista-escolher">
                {produtosDisponiveis.map((p) => (
                  <label key={p.id} className="linha-escolher">
                    <input
                      type="checkbox"
                      checked={carrinho.some((i) => i.produto_id === p.id)}
                      onChange={() => alternarProduto(p.id)}
                    />
                    {p.foto_url ? (
                      <img className="miniatura-mini" src={p.foto_url} alt="" />
                    ) : (
                      <span className="miniatura-mini miniatura-vazia">—</span>
                    )}
                    <span className="linha-escolher-nome">{p.nome}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Carrinho */}
          {carrinho.length > 0 && (
            <div className="tabela-scroll">
              <table className="tabela">
                <thead>
                  <tr>
                    <th>Foto</th>
                    <th>Produto</th>
                    <th>Quantidade</th>
                    <th>Unidade</th>
                    <th>Observação</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {carrinho.map((i) => (
                    <tr key={i.produto_id}>
                      <td>
                        {i.foto_url ? (
                          <img className="miniatura" src={i.foto_url} alt={i.nome} />
                        ) : (
                          <span className="miniatura-vazia">—</span>
                        )}
                      </td>
                      <td>{i.nome}</td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="input-qtd"
                          value={i.quantidade}
                          onChange={(e) => mudarItem(i.produto_id, 'quantidade', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          className="input-qtd"
                          value={i.unidade}
                          onChange={(e) => mudarItem(i.produto_id, 'unidade', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          value={i.observacao}
                          onChange={(e) => mudarItem(i.produto_id, 'observacao', e.target.value)}
                          placeholder="(opcional)"
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="botao-acao botao-acao-perigo"
                          onClick={() => removerItem(i.produto_id)}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <button
            type="button"
            className={'botao-urgencia' + (urgente ? ' botao-urgencia-on' : '')}
            onClick={() => setUrgente((v) => !v)}
          >
            🚨 {urgente ? 'Pedido URGENTE (clica para tirar)' : 'Marcar como urgente'}
          </button>

          {mensagem && <div className="mensagem">{mensagem}</div>}
          <div className="form-botoes">
            <button type="submit" disabled={aGuardar}>
              {aGuardar ? 'A enviar…' : 'Enviar pedido'}
            </button>
            {carrinho.length > 0 && (
              <button type="button" className="botao-cancelar" onClick={limpar}>
                Limpar
              </button>
            )}
          </div>
        </form>
      )}

      {/* Lista de pedidos do utilizador */}
      <div className="lista">
        <div className="lista-cabecalho">
          <h3>Os meus pedidos ({pedidos.length})</h3>
        </div>
        {carregando ? (
          <p>A carregar…</p>
        ) : pedidos.length === 0 ? (
          <p className="vazio">Ainda não fizeste pedidos.</p>
        ) : (
          <div className="pedidos-lista">
            {pedidos.map((p) => (
              <div key={p.id} className="cartao-pedido">
                <div className="cartao-pedido-topo">
                  <div>
                    <strong>
                      {p.projetos
                        ? p.projetos.nr_projeto
                          ? `${p.projetos.nr_projeto} — ${p.projetos.nome}`
                          : p.projetos.nome
                        : 'Sem projeto'}
                    </strong>
                    <span className="cartao-pedido-meta">
                      Pedido em {dataPt(p.criado_em)}
                      {p.data_necessidade ? ` · necessário até ${dataPt(p.data_necessidade)}` : ''}
                    </span>
                  </div>
                  <div className="cartao-pedido-badges">
                    {p.urgente && <span className="badge badge-urgente">🚨 Urgente</span>}
                    <span className={'badge badge-' + p.estado}>{p.estado}</span>
                  </div>
                </div>
                <ul className="cartao-pedido-itens">
                  {p.pedido_itens.map((it) => (
                    <li key={it.id}>
                      <span className="item-com-foto">
                        {it.produtos?.foto_url ? (
                          <img className="miniatura-mini" src={it.produtos.foto_url} alt="" />
                        ) : (
                          <span className="miniatura-mini miniatura-vazia">—</span>
                        )}
                        {it.produtos?.nome ?? 'Produto'}
                      </span>
                      <span className="cartao-pedido-item-dir">
                        <span className="cartao-pedido-qtd">
                          {it.quantidade} {it.unidade}
                        </span>
                        {it.estado === 'solicitado' ? (
                          <button
                            type="button"
                            className="botao-cancelar-item"
                            title="Cancelar este material"
                            onClick={() => setAlvoCancelar({ item: it, pedido: p })}
                          >
                            ✕
                          </button>
                        ) : (
                          <span className={'badge badge-' + it.estado}>{it.estado}</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
                {p.observacao && <p className="cartao-pedido-obs">📝 {p.observacao}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmação de cancelar item */}
      {alvoCancelar && (
        <div className="modal-fundo" onClick={() => setAlvoCancelar(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Cancelar material?</h3>
            <p>
              Queres cancelar <strong>{alvoCancelar.item.produtos?.nome ?? 'este material'}</strong>{' '}
              deste pedido? Esta ação não pode ser desfeita.
            </p>
            <div className="modal-botoes">
              <button type="button" className="botao-secundario" onClick={() => setAlvoCancelar(null)}>
                Não
              </button>
              <button type="button" className="botao-perigo" onClick={cancelarItem} disabled={aCancelar}>
                {aCancelar ? 'A cancelar…' : 'Sim, cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
