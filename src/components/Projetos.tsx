// Ecrã de Projetos (mapa de projetos): cada pedido de material pertence a um projeto.
// Campos baseados no mapa do cliente, com rótulos genéricos (multi-segmento).
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Perfil } from '../contexts/AuthContext'
import { capitalizarPalavras } from '../lib/constantes'
import { SeletorCliente } from './SeletorCliente'

type Projeto = {
  id: string
  nr_projeto: string | null
  nome: string
  cliente_id: string | null
  clientes: { nome: string; nig: string | null } | null
  morada: string | null
  zona: string | null
  centro_custo: string | null
  diretor: string | null
  diretor_contacto: string | null
  encarregado: string | null
  data_inicio: string | null
  data_pc: string | null
  data_fim: string | null
  previsao_termino: string | null
  estado: string
  criado_em: string
}

const ESTADOS = [
  { valor: 'em_curso', etiqueta: 'Em curso' },
  { valor: 'pausado', etiqueta: 'Pausado' },
  { valor: 'concluido', etiqueta: 'Concluído' },
] as const

function etiquetaEstado(valor: string): string {
  return ESTADOS.find((e) => e.valor === valor)?.etiqueta ?? valor
}

function dataPt(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-PT')
}

// Estado inicial vazio do formulário
const FORM_VAZIO = {
  nr_projeto: '',
  nome: '',
  cliente_id: '',
  morada: '',
  zona: '',
  centro_custo: '',
  diretor: '',
  diretor_contacto: '',
  encarregado: '',
  data_inicio: '',
  data_pc: '',
  data_fim: '',
  previsao_termino: '',
  estado: 'em_curso',
}

export function Projetos({ perfil }: { perfil: Perfil }) {
  const [projetos, setProjetos] = useState<Projeto[]>([])
  const [carregando, setCarregando] = useState(true)
  const [aGuardar, setAGuardar] = useState(false)
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false)

  // Quem pode gerir projetos (escritório nível 4+ ou Super Admin); os outros só veem
  const podeGerir = perfil.nivel_acesso >= 4 || perfil.is_super_admin

  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...FORM_VAZIO })

  const [projetoParaEliminar, setProjetoParaEliminar] = useState<Projeto | null>(null)
  const [aEliminar, setAEliminar] = useState(false)

  const [filtroTexto, setFiltroTexto] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')

  // Atalho para atualizar um campo do formulário
  function mudar<K extends keyof typeof FORM_VAZIO>(campo: K, valor: string) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  async function carregar() {
    setCarregando(true)
    const { data, error } = await supabase
      .from('projetos')
      .select(
        'id, nr_projeto, nome, cliente_id, clientes(nome, nig), morada, zona, centro_custo, diretor, diretor_contacto, encarregado, data_inicio, data_pc, data_fim, previsao_termino, estado, criado_em',
      )
      .order('criado_em', { ascending: false })
    if (!error && data) setProjetos(data as unknown as Projeto[])
    setCarregando(false)
  }

  useEffect(() => {
    carregar()
  }, [])

  function limparFormulario() {
    setEditandoId(null)
    setForm({ ...FORM_VAZIO })
  }

  function iniciarEdicao(p: Projeto) {
    setEditandoId(p.id)
    setForm({
      nr_projeto: p.nr_projeto ?? '',
      nome: p.nome,
      cliente_id: p.cliente_id ?? '',
      morada: p.morada ?? '',
      zona: p.zona ?? '',
      centro_custo: p.centro_custo ?? '',
      diretor: p.diretor ?? '',
      diretor_contacto: p.diretor_contacto ?? '',
      encarregado: p.encarregado ?? '',
      data_inicio: p.data_inicio ?? '',
      data_pc: p.data_pc ?? '',
      data_fim: p.data_fim ?? '',
      previsao_termino: p.previsao_termino ?? '',
      estado: p.estado,
    })
    setMensagem(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function submeter(evento: FormEvent) {
    evento.preventDefault()
    setMensagem(null)
    if (!form.nome.trim()) {
      setMensagem('⚠️ Indica o nome do projeto.')
      return
    }
    setMostrarConfirmacao(true)
  }

  async function guardar() {
    setMostrarConfirmacao(false)
    setAGuardar(true)
    const dados = {
      nr_projeto: form.nr_projeto || null,
      nome: form.nome.trim(),
      cliente_id: form.cliente_id || null,
      morada: form.morada || null,
      zona: form.zona || null,
      centro_custo: form.centro_custo || null,
      diretor: form.diretor || null,
      diretor_contacto: form.diretor_contacto || null,
      encarregado: form.encarregado || null,
      data_inicio: form.data_inicio || null,
      data_pc: form.data_pc || null,
      data_fim: form.data_fim || null,
      previsao_termino: form.previsao_termino || null,
      estado: form.estado,
    }

    let erro = null
    if (editandoId) {
      const res = await supabase.from('projetos').update(dados).eq('id', editandoId)
      erro = res.error
    } else {
      const res = await supabase.from('projetos').insert({ ...dados, empresa_id: perfil.empresa_id })
      erro = res.error
    }

    setAGuardar(false)
    if (erro) {
      setMensagem('❌ Não foi possível guardar: ' + erro.message)
      return
    }
    setMensagem(editandoId ? '✅ Projeto atualizado!' : '✅ Projeto criado!')
    limparFormulario()
    carregar()
  }

  async function eliminar() {
    if (!projetoParaEliminar) return
    setAEliminar(true)
    const { error } = await supabase.from('projetos').delete().eq('id', projetoParaEliminar.id)
    setAEliminar(false)
    if (error) {
      setMensagem('❌ Não foi possível eliminar: ' + error.message)
      setProjetoParaEliminar(null)
      return
    }
    setMensagem('🗑️ Projeto eliminado.')
    if (editandoId === projetoParaEliminar.id) limparFormulario()
    setProjetoParaEliminar(null)
    carregar()
  }

  const projetosFiltrados = projetos.filter((p) => {
    const termo = filtroTexto.trim().toLowerCase()
    const okTexto =
      p.nome.toLowerCase().includes(termo) ||
      (p.nr_projeto ?? '').toLowerCase().includes(termo) ||
      (p.clientes?.nome ?? '').toLowerCase().includes(termo)
    const okEstado = !filtroEstado || p.estado === filtroEstado
    return okTexto && okEstado
  })

  return (
    <div className="pagina pagina-larga">
      <h2>Projetos</h2>
      <p className="subtexto">O mapa de projetos da tua empresa. Cada pedido de material pertence a um projeto.</p>

      {podeGerir && (
        <form className="cartao-form" onSubmit={submeter}>
          <h3>{editandoId ? 'Editar projeto' : 'Adicionar projeto'}</h3>
          <div className="grelha-form">
            <label>
              Nº do Projeto
              <input value={form.nr_projeto} onChange={(e) => mudar('nr_projeto', e.target.value)} placeholder="Ex: 2601" />
            </label>
            <label>
              Nome do Projeto *
              <input
                value={form.nome}
                onChange={(e) => mudar('nome', capitalizarPalavras(e.target.value))}
                placeholder="Ex: Speed — Sede"
                spellCheck={false}
                required
              />
            </label>
            <SeletorCliente
              empresaId={perfil.empresa_id}
              valor={form.cliente_id}
              aoMudar={(id) => mudar('cliente_id', id)}
            />
            <label>
              Morada
              <input value={form.morada} onChange={(e) => mudar('morada', capitalizarPalavras(e.target.value))} spellCheck={false} />
            </label>
            <label>
              Zona
              <input value={form.zona} onChange={(e) => mudar('zona', capitalizarPalavras(e.target.value))} placeholder="Ex: Setúbal" spellCheck={false} />
            </label>
            <label>
              Centro de Custo
              <input value={form.centro_custo} onChange={(e) => mudar('centro_custo', e.target.value)} placeholder="Ex: 2601-MS-Speed" />
            </label>
            <label>
              Diretor / Responsável
              <input value={form.diretor} onChange={(e) => mudar('diretor', capitalizarPalavras(e.target.value))} spellCheck={false} />
            </label>
            <label>
              Contacto do Diretor
              <input value={form.diretor_contacto} onChange={(e) => mudar('diretor_contacto', e.target.value)} inputMode="numeric" />
            </label>
            <label>
              Encarregado / Responsável de Equipa
              <input value={form.encarregado} onChange={(e) => mudar('encarregado', capitalizarPalavras(e.target.value))} spellCheck={false} />
            </label>
            <label>
              Início
              <input type="date" value={form.data_inicio} onChange={(e) => mudar('data_inicio', e.target.value)} />
            </label>
            <label>
              Data do PC (Plano de Contingência)
              <input type="date" value={form.data_pc} onChange={(e) => mudar('data_pc', e.target.value)} />
            </label>
            <label>
              Fim
              <input type="date" value={form.data_fim} onChange={(e) => mudar('data_fim', e.target.value)} />
            </label>
            <label>
              Previsão de Término
              <input type="date" value={form.previsao_termino} onChange={(e) => mudar('previsao_termino', e.target.value)} />
            </label>
            <label>
              Estado *
              <select value={form.estado} onChange={(e) => mudar('estado', e.target.value)}>
                {ESTADOS.map((e) => (
                  <option key={e.valor} value={e.valor}>
                    {e.etiqueta}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {mensagem && <div className="mensagem">{mensagem}</div>}
          <div className="form-botoes">
            <button type="submit" disabled={aGuardar}>
              {aGuardar ? 'A guardar…' : editandoId ? 'Guardar alterações' : 'Adicionar projeto'}
            </button>
            {editandoId && (
              <button type="button" className="botao-cancelar" onClick={limparFormulario}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      )}

      <div className="lista">
        <div className="lista-cabecalho">
          <h3>
            Projetos ({projetosFiltrados.length}
            {projetosFiltrados.length !== projetos.length ? ` de ${projetos.length}` : ''})
          </h3>
          <div className="filtros">
            <input
              className="filtro-texto"
              placeholder="🔍 Procurar (nome, nº, cliente)…"
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
            />
            <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
              <option value="">Todos os estados</option>
              {ESTADOS.map((e) => (
                <option key={e.valor} value={e.valor}>
                  {e.etiqueta}
                </option>
              ))}
            </select>
          </div>
        </div>

        {carregando ? (
          <p>A carregar…</p>
        ) : projetos.length === 0 ? (
          <p className="vazio">Ainda não há projetos. {podeGerir ? 'Adiciona o primeiro acima! 👆' : ''}</p>
        ) : projetosFiltrados.length === 0 ? (
          <p className="vazio">Nenhum projeto corresponde ao filtro.</p>
        ) : (
          <div className="tabela-scroll">
            <table className="tabela">
              <thead>
                <tr>
                  <th>Nº</th>
                  <th>Projeto</th>
                  <th>Cliente</th>
                  <th>Morada</th>
                  <th>Zona</th>
                  <th>Centro de Custo</th>
                  <th>Diretor</th>
                  <th>Contacto</th>
                  <th>Encarregado</th>
                  <th>Início</th>
                  <th>PC</th>
                  <th>Fim</th>
                  <th>Previsão</th>
                  <th>Estado</th>
                  {podeGerir && <th>Ações</th>}
                </tr>
              </thead>
              <tbody>
                {projetosFiltrados.map((p) => (
                  <tr key={p.id}>
                    <td>{p.nr_projeto ?? '—'}</td>
                    <td>
                      <strong>{p.nome}</strong>
                    </td>
                    <td>
                      {p.clientes?.nome ?? '—'}
                      {p.clientes?.nig ? ` (${p.clientes.nig})` : ''}
                    </td>
                    <td>{p.morada ?? '—'}</td>
                    <td>{p.zona ?? '—'}</td>
                    <td>{p.centro_custo ?? '—'}</td>
                    <td>{p.diretor ?? '—'}</td>
                    <td>{p.diretor_contacto ?? '—'}</td>
                    <td>{p.encarregado ?? '—'}</td>
                    <td>{dataPt(p.data_inicio)}</td>
                    <td>{dataPt(p.data_pc)}</td>
                    <td>{dataPt(p.data_fim)}</td>
                    <td>{dataPt(p.previsao_termino)}</td>
                    <td>
                      <span className={'badge badge-' + p.estado}>{etiquetaEstado(p.estado)}</span>
                    </td>
                    {podeGerir && (
                      <td>
                        <div className="acoes-celula">
                          <button type="button" className="botao-acao" onClick={() => iniciarEdicao(p)}>
                            ✏️ Editar
                          </button>
                          <button
                            type="button"
                            className="botao-acao botao-acao-perigo"
                            onClick={() => setProjetoParaEliminar(p)}
                          >
                            🗑️ Eliminar
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmação de guardar */}
      {mostrarConfirmacao && (
        <div className="modal-fundo" onClick={() => setMostrarConfirmacao(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editandoId ? 'Guardar alterações?' : 'Adicionar este projeto?'}</h3>
            <p>
              {editandoId ? 'Confirmas as alterações a ' : 'Confirmas que queres adicionar '}
              <strong>{form.nome}</strong>?
            </p>
            <div className="modal-botoes">
              <button type="button" className="botao-secundario" onClick={() => setMostrarConfirmacao(false)}>
                Não
              </button>
              <button type="button" className="botao-primario" onClick={guardar}>
                {editandoId ? 'Sim, guardar' : 'Sim, adicionar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmação de eliminar */}
      {projetoParaEliminar && (
        <div className="modal-fundo" onClick={() => setProjetoParaEliminar(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Eliminar projeto?</h3>
            <p>
              Tens a certeza que queres eliminar <strong>{projetoParaEliminar.nome}</strong>? Esta ação
              não pode ser desfeita.
            </p>
            <div className="modal-botoes">
              <button type="button" className="botao-secundario" onClick={() => setProjetoParaEliminar(null)}>
                Não
              </button>
              <button type="button" className="botao-perigo" onClick={eliminar} disabled={aEliminar}>
                {aEliminar ? 'A eliminar…' : 'Sim, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
