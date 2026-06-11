// Lista de Materiais — gestão por item, com abas de estado (modelo do cliente).
// Fluxo por item: solicitado -> reservado -> comprado -> validado (ou rejeitado).
import { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Perfil } from '../contexts/AuthContext'
import { CARGOS } from '../lib/constantes'

const BUCKET_RECIBOS = 'recibos'

type Item = {
  id: string
  quantidade: number
  unidade: string
  observacao: string | null
  estado: string
  valor_pago: number | null
  metodo_pagamento: string | null
  recibo_url: string | null
  motivo_rejeicao: string | null
  produtos: { nome: string; setor: string | null; foto_url: string | null } | null
  fornecedores: { nome: string } | null
  pedido: {
    data_necessidade: string | null
    observacao: string | null
    urgente: boolean
    projetos: { nome: string; nr_projeto: string | null } | null
    solicitante: { nome: string | null; nivel_acesso: number; is_super_admin: boolean } | null
  } | null
}

type Fornecedor = { id: string; nome: string }

const ABAS = [
  { valor: 'tudo', etiqueta: 'Tudo' },
  { valor: 'solicitado', etiqueta: 'Solicitado' },
  { valor: 'reservado', etiqueta: 'Reservado' },
  { valor: 'comprado', etiqueta: 'Comprado' },
  { valor: 'validado', etiqueta: 'Validado' },
  { valor: 'rejeitado', etiqueta: 'Rejeitado' },
] as const

export function ListaMateriais({ perfil }: { perfil: Perfil }) {
  const podeReservar = perfil.nivel_acesso >= 3 || perfil.is_super_admin
  const podeComprar = perfil.is_comprador || perfil.is_super_admin
  const podeValidar = perfil.nivel_acesso >= 4 || perfil.is_super_admin

  const [itens, setItens] = useState<Item[]>([])
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [carregando, setCarregando] = useState(true)
  const [aProcessar, setAProcessar] = useState(false)
  const [mensagem, setMensagem] = useState<string | null>(null)

  const [aba, setAba] = useState<string>('solicitado')
  const [filtroProjeto, setFiltroProjeto] = useState('')
  const [filtroSetor, setFiltroSetor] = useState('')
  const [filtroFornecedor, setFiltroFornecedor] = useState('')

  // Modal comprar
  const [itemComprar, setItemComprar] = useState<Item | null>(null)
  const [fornecedorId, setFornecedorId] = useState('')
  const [valor, setValor] = useState('')
  const [metodoPagamento, setMetodoPagamento] = useState('')
  const [metodoOutro, setMetodoOutro] = useState('')
  const [recibo, setRecibo] = useState<File | null>(null)

  // Modal validar (simples por agora; o processo completo do escritório vem a seguir)
  const [itemValidar, setItemValidar] = useState<Item | null>(null)

  // Modal rejeitar
  const [itemRejeitar, setItemRejeitar] = useState<Item | null>(null)
  const [motivo, setMotivo] = useState('')

  // Modal detalhe (relatório do pedido)
  const [itemDetalhe, setItemDetalhe] = useState<Item | null>(null)

  async function carregar() {
    setCarregando(true)
    const [resItens, resForn] = await Promise.all([
      supabase
        .from('pedido_itens')
        .select(
          'id, quantidade, unidade, observacao, estado, valor_pago, metodo_pagamento, recibo_url, motivo_rejeicao, produtos(nome, setor, foto_url), fornecedores(nome), pedido:pedidos_material!inner(data_necessidade, observacao, urgente, projetos(nome, nr_projeto), solicitante:perfis!solicitado_por(nome, nivel_acesso, is_super_admin))',
        )
        .order('criado_em', { ascending: false }),
      supabase.from('fornecedores').select('id, nome').order('nome'),
    ])
    if (resItens.data) setItens(resItens.data as unknown as Item[])
    if (resForn.data) setFornecedores(resForn.data as Fornecedor[])
    setCarregando(false)
  }

  useEffect(() => {
    carregar()
  }, [])

  // ----- Ações -----
  async function reservar(item: Item) {
    setAProcessar(true)
    const { error } = await supabase
      .from('pedido_itens')
      .update({ estado: 'reservado', reservado_por: perfil.id })
      .eq('id', item.id)
    setAProcessar(false)
    if (error) return setMensagem('❌ ' + error.message)
    setMensagem('✅ Material reservado.')
    carregar()
  }

  async function confirmarValidacao() {
    if (!itemValidar) return
    setAProcessar(true)
    const { error } = await supabase
      .from('pedido_itens')
      .update({ estado: 'validado', validado_por: perfil.id })
      .eq('id', itemValidar.id)
    setAProcessar(false)
    setItemValidar(null)
    if (error) return setMensagem('❌ ' + error.message)
    setMensagem('✅ Compra validada.')
    carregar()
  }

  async function confirmarRejeicao() {
    if (!itemRejeitar) return
    if (!motivo.trim()) return setMensagem('⚠️ Indica o motivo.')
    setAProcessar(true)
    const { error } = await supabase
      .from('pedido_itens')
      .update({ estado: 'rejeitado', motivo_rejeicao: motivo.trim() })
      .eq('id', itemRejeitar.id)
    setAProcessar(false)
    setItemRejeitar(null)
    setMotivo('')
    if (error) return setMensagem('❌ ' + error.message)
    setMensagem('🚫 Material rejeitado.')
    carregar()
  }

  function abrirComprar(item: Item) {
    setItemComprar(item)
    setFornecedorId('')
    setValor('')
    setMetodoPagamento('')
    setMetodoOutro('')
    setRecibo(null)
  }

  async function confirmarCompra() {
    if (!itemComprar) return
    if (!fornecedorId) return setMensagem('⚠️ Escolhe o fornecedor.')
    if (!valor || Number(valor) <= 0) return setMensagem('⚠️ Indica o valor pago.')
    if (!metodoPagamento) return setMensagem('⚠️ Escolhe o método de pagamento.')
    const metodoFinal =
      metodoPagamento === 'Outros' ? metodoOutro.trim() || 'Outros' : metodoPagamento
    if (!recibo) return setMensagem('⚠️ Anexa a foto do recibo.')

    setAProcessar(true)
    // Carrega o recibo para o armazém
    const extensao = recibo.name.split('.').pop() || 'jpg'
    const caminho = `${perfil.empresa_id}/${itemComprar.id}-${Date.now()}.${extensao}`
    const { error: erroUpload } = await supabase.storage.from(BUCKET_RECIBOS).upload(caminho, recibo)
    if (erroUpload) {
      setAProcessar(false)
      return setMensagem('❌ Não foi possível enviar o recibo: ' + erroUpload.message)
    }
    const reciboUrl = supabase.storage.from(BUCKET_RECIBOS).getPublicUrl(caminho).data.publicUrl

    const { error } = await supabase
      .from('pedido_itens')
      .update({
        estado: 'comprado',
        comprado_por: perfil.id,
        fornecedor_id: fornecedorId,
        valor_pago: Number(valor),
        metodo_pagamento: metodoFinal,
        recibo_url: reciboUrl,
      })
      .eq('id', itemComprar.id)
    setAProcessar(false)
    setItemComprar(null)
    if (error) return setMensagem('❌ ' + error.message)
    setMensagem('🛒 Compra registada.')
    carregar()
  }

  function aoEscolherRecibo(e: ChangeEvent<HTMLInputElement>) {
    setRecibo(e.target.files?.[0] ?? null)
  }

  // ----- Filtros -----
  const setoresDistintos = [
    ...new Set(itens.map((i) => i.produtos?.setor).filter(Boolean)),
  ] as string[]
  const projetosDistintos = [
    ...new Set(itens.map((i) => i.pedido?.projetos?.nome).filter(Boolean)),
  ] as string[]
  const fornecedoresDistintos = [
    ...new Set(itens.map((i) => i.fornecedores?.nome).filter(Boolean)),
  ] as string[]

  const itensFiltrados = itens
    .filter((i) => {
      const okAba = aba === 'tudo' || i.estado === aba
      const okProjeto = !filtroProjeto || i.pedido?.projetos?.nome === filtroProjeto
      const okSetor = !filtroSetor || i.produtos?.setor === filtroSetor
      const okFornecedor = !filtroFornecedor || i.fornecedores?.nome === filtroFornecedor
      return okAba && okProjeto && okSetor && okFornecedor
    })
    // Urgentes primeiro
    .sort((a, b) => Number(b.pedido?.urgente ?? false) - Number(a.pedido?.urgente ?? false))

  function contar(estado: string): number {
    return estado === 'tudo' ? itens.length : itens.filter((i) => i.estado === estado).length
  }

  function projetoTexto(i: Item): string {
    return i.pedido?.projetos?.nome ?? '—'
  }

  function solicitanteTexto(i: Item): string {
    const s = i.pedido?.solicitante
    if (!s) return '—'
    const cargo = s.is_super_admin ? 'Super Admin' : (CARGOS[s.nivel_acesso] ?? '')
    return cargo ? `${cargo}: ${s.nome ?? '—'}` : (s.nome ?? '—')
  }

  return (
    <div className="pagina pagina-larga">
      <h2>Lista de Materiais</h2>
      <p className="subtexto">Acompanha e trata os materiais pedidos, por estado.</p>

      {/* Abas de estado */}
      <div className="abas">
        {ABAS.map((a) => (
          <button
            key={a.valor}
            type="button"
            className={'aba' + (aba === a.valor ? ' aba-ativa' : '')}
            onClick={() => setAba(a.valor)}
          >
            {a.etiqueta} ({contar(a.valor)})
          </button>
        ))}
      </div>

      <div className="lista">
        <div className="lista-cabecalho">
          <h3>Materiais ({itensFiltrados.length})</h3>
          <div className="filtros">
            <select value={filtroProjeto} onChange={(e) => setFiltroProjeto(e.target.value)}>
              <option value="">Todos os projetos</option>
              {projetosDistintos.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <select value={filtroSetor} onChange={(e) => setFiltroSetor(e.target.value)}>
              <option value="">Todos os setores</option>
              {setoresDistintos.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select value={filtroFornecedor} onChange={(e) => setFiltroFornecedor(e.target.value)}>
              <option value="">Todos os fornecedores</option>
              {fornecedoresDistintos.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
        </div>

        {mensagem && <div className="mensagem">{mensagem}</div>}

        {carregando ? (
          <p>A carregar…</p>
        ) : itensFiltrados.length === 0 ? (
          <p className="vazio">Nenhum material neste estado.</p>
        ) : (
          <div className="tabela-scroll">
            <table className="tabela">
              <thead>
                <tr>
                  <th>Foto</th>
                  <th>Material</th>
                  <th>Setor</th>
                  <th>Qtd</th>
                  <th>Unid.</th>
                  <th>Fornecedor</th>
                  <th>Valor</th>
                  <th>Estado</th>
                  <th>Solicitante</th>
                  <th>Projeto</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                {itensFiltrados.map((i) => (
                  <tr key={i.id} className={i.pedido?.urgente ? 'linha-urgente' : undefined}>
                    <td>
                      {i.produtos?.foto_url ? (
                        <img className="miniatura" src={i.produtos.foto_url} alt="" />
                      ) : (
                        <span className="miniatura-vazia">—</span>
                      )}
                    </td>
                    <td>
                      {i.pedido?.urgente && <span className="marca-urgente" title="Pedido urgente">🚨</span>}
                      {i.produtos?.nome ?? 'Produto'}
                      {i.observacao ? ` — ${i.observacao}` : ''}
                    </td>
                    <td>{i.produtos?.setor ?? '—'}</td>
                    <td>{i.quantidade}</td>
                    <td>{i.unidade}</td>
                    <td>{i.fornecedores?.nome ?? '—'}</td>
                    <td>
                      {i.valor_pago != null ? `${i.valor_pago} €` : '—'}
                      {i.metodo_pagamento ? ` · ${i.metodo_pagamento}` : ''}
                    </td>
                    <td>
                      <span className={'badge badge-' + i.estado}>{i.estado}</span>
                    </td>
                    <td>{i.pedido?.solicitante?.nome ?? '—'}</td>
                    <td>{projetoTexto(i)}</td>
                    <td>
                      <div className="acoes-celula">
                        <button type="button" className="botao-acao" onClick={() => setItemDetalhe(i)}>
                          👁️ Ver
                        </button>
                        {i.estado === 'solicitado' && podeReservar && (
                          <>
                            <button type="button" className="botao-acao" onClick={() => reservar(i)} disabled={aProcessar}>
                              ✅ Reservar
                            </button>
                            <button
                              type="button"
                              className="botao-acao botao-acao-perigo"
                              onClick={() => {
                                setMotivo('')
                                setItemRejeitar(i)
                              }}
                            >
                              🚫 Rejeitar
                            </button>
                          </>
                        )}
                        {i.estado === 'reservado' && podeComprar && (
                          <button type="button" className="botao-acao" onClick={() => abrirComprar(i)}>
                            🛒 Comprar
                          </button>
                        )}
                        {i.estado === 'comprado' && (
                          <>
                            {i.recibo_url && (
                              <a className="botao-acao" href={i.recibo_url} target="_blank" rel="noreferrer">
                                🧾 Recibo
                              </a>
                            )}
                            {podeValidar && (
                              <button type="button" className="botao-acao" onClick={() => setItemValidar(i)}>
                                ✔️ Validar
                              </button>
                            )}
                          </>
                        )}
                        {i.estado === 'validado' && i.recibo_url && (
                          <a className="botao-acao" href={i.recibo_url} target="_blank" rel="noreferrer">
                            🧾 Recibo
                          </a>
                        )}
                        {i.estado === 'rejeitado' && (
                          <span className="texto-rejeicao" title={i.motivo_rejeicao ?? ''}>
                            {i.motivo_rejeicao ?? '—'}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Detalhe (relatório do pedido) */}
      {itemDetalhe && (
        <div className="modal-fundo" onClick={() => setItemDetalhe(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Detalhe do material</h3>
            <dl className="detalhe">
              <dt>Produto</dt>
              <dd>{itemDetalhe.produtos?.nome ?? '—'}</dd>
              <dt>Quantidade</dt>
              <dd>{itemDetalhe.quantidade}</dd>
              <dt>Unidade de medida</dt>
              <dd>{itemDetalhe.unidade}</dd>
              <dt>Setor</dt>
              <dd>{itemDetalhe.produtos?.setor ?? '—'}</dd>
              <dt>Fornecedor</dt>
              <dd>{itemDetalhe.fornecedores?.nome ?? '—'}</dd>
              <dt>Estado</dt>
              <dd>
                <span className={'badge badge-' + itemDetalhe.estado}>{itemDetalhe.estado}</span>
              </dd>
              {itemDetalhe.valor_pago != null && (
                <>
                  <dt>Valor pago</dt>
                  <dd>
                    {itemDetalhe.valor_pago} €
                    {itemDetalhe.metodo_pagamento ? ` · ${itemDetalhe.metodo_pagamento}` : ''}
                  </dd>
                </>
              )}
              {itemDetalhe.observacao && (
                <>
                  <dt>Observação</dt>
                  <dd>{itemDetalhe.observacao}</dd>
                </>
              )}
            </dl>

            <h4 className="detalhe-subtitulo">Dados do solicitante</h4>
            <dl className="detalhe">
              <dt>Colaborador</dt>
              <dd>{solicitanteTexto(itemDetalhe)}</dd>
              <dt>Projeto</dt>
              <dd>{projetoTexto(itemDetalhe)}</dd>
              {itemDetalhe.pedido?.data_necessidade && (
                <>
                  <dt>Necessário até</dt>
                  <dd>
                    {new Date(itemDetalhe.pedido.data_necessidade).toLocaleDateString('pt-PT')}
                  </dd>
                </>
              )}
            </dl>

            {itemDetalhe.recibo_url && (
              <p>
                <a href={itemDetalhe.recibo_url} target="_blank" rel="noreferrer">
                  🧾 Ver recibo
                </a>
              </p>
            )}

            <div className="modal-botoes">
              <button type="button" className="botao-primario" onClick={() => setItemDetalhe(null)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Comprar */}
      {itemComprar && (
        <div className="modal-fundo" onClick={() => setItemComprar(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Registar compra</h3>
            <p>
              <strong>{itemComprar.produtos?.nome}</strong> — {itemComprar.quantidade}{' '}
              {itemComprar.unidade}
            </p>
            <label className="modal-campo">
              Fornecedor *
              <select value={fornecedorId} onChange={(e) => setFornecedorId(e.target.value)}>
                <option value="">(escolher)</option>
                {fornecedores.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="modal-campo">
              Valor pago (€) *
              <input type="number" step="0.01" min="0" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="Ex: 12.50" />
            </label>
            <label className="modal-campo">
              Método de pagamento *
              <select value={metodoPagamento} onChange={(e) => setMetodoPagamento(e.target.value)}>
                <option value="">(escolher)</option>
                <option value="Dinheiro">Dinheiro</option>
                <option value="Cartão">Cartão</option>
                <option value="Outros">Outros…</option>
              </select>
            </label>
            {metodoPagamento === 'Outros' && (
              <label className="modal-campo">
                Especificar
                <input
                  value={metodoOutro}
                  onChange={(e) => setMetodoOutro(e.target.value)}
                  placeholder="Ex: Transferência, MB Way…"
                />
              </label>
            )}
            <label className="modal-campo">
              Foto do recibo *
              <input type="file" accept="image/*" capture="environment" onChange={aoEscolherRecibo} />
              {recibo && <small>{recibo.name}</small>}
            </label>
            <div className="modal-botoes">
              <button type="button" className="botao-secundario" onClick={() => setItemComprar(null)}>
                Cancelar
              </button>
              <button type="button" className="botao-primario" onClick={confirmarCompra} disabled={aProcessar}>
                {aProcessar ? 'A registar…' : 'Registar compra'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Validar (simples por agora; processo completo do escritório vem a seguir) */}
      {itemValidar && (
        <div className="modal-fundo" onClick={() => setItemValidar(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Validar compra?</h3>
            <p>
              <strong>{itemValidar.produtos?.nome}</strong> —{' '}
              {itemValidar.valor_pago != null ? `${itemValidar.valor_pago} €` : ''}{' '}
              {itemValidar.metodo_pagamento ? `(${itemValidar.metodo_pagamento})` : ''}
            </p>
            <div className="modal-botoes">
              <button type="button" className="botao-secundario" onClick={() => setItemValidar(null)}>
                Não
              </button>
              <button type="button" className="botao-primario" onClick={confirmarValidacao} disabled={aProcessar}>
                {aProcessar ? 'A validar…' : 'Sim, validar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Rejeitar */}
      {itemRejeitar && (
        <div className="modal-fundo" onClick={() => setItemRejeitar(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Rejeitar material</h3>
            <p>Indica o motivo (o solicitante poderá ver):</p>
            <textarea
              className="campo-motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              autoFocus
            />
            <div className="modal-botoes">
              <button type="button" className="botao-secundario" onClick={() => setItemRejeitar(null)}>
                Cancelar
              </button>
              <button type="button" className="botao-perigo" onClick={confirmarRejeicao} disabled={aProcessar}>
                Rejeitar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
