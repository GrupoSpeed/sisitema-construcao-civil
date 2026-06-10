// Ecrã de Pedidos de Material — passo "Solicitar".
// O colaborador monta um pedido (carrinho) de produtos do catálogo para um projeto.
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Perfil } from '../contexts/AuthContext'

type Projeto = { id: string; nome: string; nr_projeto: string | null }
type Produto = { id: string; nome: string; unidade: string }

// Linha do "carrinho" antes de enviar
type ItemCarrinho = {
  produto_id: string
  nome: string
  quantidade: string
  unidade: string
  observacao: string
}

// Pedido já criado (para a lista)
type PedidoItem = {
  quantidade: number
  unidade: string
  observacao: string | null
  estado: string
  produtos: { nome: string } | null
}
type Pedido = {
  id: string
  estado: string
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
  const [observacao, setObservacao] = useState('')
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([])
  const [produtoEscolhido, setProdutoEscolhido] = useState('')

  async function carregarTudo() {
    setCarregando(true)
    const [resProj, resProd, resPed] = await Promise.all([
      supabase.from('projetos').select('id, nome, nr_projeto').order('nome'),
      supabase.from('produtos').select('id, nome, unidade').eq('estado', 'aprovado').order('nome'),
      supabase
        .from('pedidos_material')
        .select(
          'id, estado, data_necessidade, observacao, criado_em, projetos(nome, nr_projeto), pedido_itens(quantidade, unidade, observacao, estado, produtos(nome))',
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

  function adicionarAoCarrinho(produtoId: string) {
    if (!produtoId) return
    if (carrinho.some((i) => i.produto_id === produtoId)) {
      setProdutoEscolhido('')
      return
    }
    const p = produtos.find((x) => x.id === produtoId)
    if (!p) return
    setCarrinho((c) => [
      ...c,
      { produto_id: p.id, nome: p.nome, quantidade: '1', unidade: p.unidade, observacao: '' },
    ])
    setProdutoEscolhido('')
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
    setProdutoEscolhido('')
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
              <select value={projetoId} onChange={(e) => setProjetoId(e.target.value)} required>
                <option value="" disabled hidden>
                  (escolher)
                </option>
                {projetos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nr_projeto ? `${p.nr_projeto} — ${p.nome}` : p.nome}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Data de necessidade
              <input type="date" value={dataNecessidade} onChange={(e) => setDataNecessidade(e.target.value)} />
            </label>
            <label>
              Observação (opcional)
              <input value={observacao} onChange={(e) => setObservacao(e.target.value)} placeholder="Ex: entregar na obra de manhã" />
            </label>
          </div>

          {/* Adicionar produtos ao carrinho */}
          <div className="adicionar-produto">
            <label>
              Adicionar produto
              <select value={produtoEscolhido} onChange={(e) => adicionarAoCarrinho(e.target.value)}>
                <option value="">➕ Escolher produto do catálogo…</option>
                {produtos
                  .filter((p) => !carrinho.some((i) => i.produto_id === p.id))
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
              </select>
            </label>
            {produtos.length === 0 && (
              <small className="aviso-duplicado">
                ⚠️ Ainda não há produtos aprovados no catálogo para pedir.
              </small>
            )}
          </div>

          {/* Carrinho */}
          {carrinho.length > 0 && (
            <div className="tabela-scroll">
              <table className="tabela">
                <thead>
                  <tr>
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
                  <span className={'badge badge-' + p.estado}>{p.estado}</span>
                </div>
                <ul className="cartao-pedido-itens">
                  {p.pedido_itens.map((it, idx) => (
                    <li key={idx}>
                      <span>{it.produtos?.nome ?? 'Produto'}</span>
                      <span className="cartao-pedido-qtd">
                        {it.quantidade} {it.unidade}
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
    </div>
  )
}
