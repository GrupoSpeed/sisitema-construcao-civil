// Gestor genérico de uma lista (adicionar / eliminar itens), usado nas Configurações.
// Suporta um "grupo" opcional (ex.: categorias de movimento por Fixo/Variável).
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

type Item = { id: string; nome: string }

export function GestaoLista({
  tabela,
  empresaId,
  grupoCampo,
  grupos,
}: {
  tabela: string
  empresaId: string | null
  grupoCampo?: string
  grupos?: string[]
}) {
  const [itens, setItens] = useState<Item[]>([])
  const [grupo, setGrupo] = useState(grupos?.[0] ?? '')
  const [novo, setNovo] = useState('')
  const [aGuardar, setAGuardar] = useState(false)
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [paraEliminar, setParaEliminar] = useState<Item | null>(null)

  async function carregar() {
    let consulta = supabase
      .from(tabela)
      .select('id, nome')
      .order('nome')
    if (grupoCampo && grupo) consulta = consulta.eq(grupoCampo, grupo)
    const { data } = await consulta
    if (data) setItens(data as Item[])
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabela, grupo])

  async function adicionar() {
    const nome = novo.trim()
    if (!nome) return
    setAGuardar(true)
    const registo: Record<string, unknown> = { empresa_id: empresaId, nome }
    if (grupoCampo && grupo) registo[grupoCampo] = grupo
    const { error } = await supabase.from(tabela).insert(registo)
    setAGuardar(false)
    if (error) {
      setMensagem(
        error.message.toLowerCase().includes('duplicate') ? '⚠️ Esse item já existe.' : '❌ ' + error.message,
      )
      return
    }
    setNovo('')
    setMensagem(null)
    carregar()
  }

  async function eliminar() {
    if (!paraEliminar) return
    const { error } = await supabase.from(tabela).delete().eq('id', paraEliminar.id)
    setParaEliminar(null)
    if (error) {
      setMensagem('❌ Não foi possível eliminar: ' + error.message)
      return
    }
    carregar()
  }

  return (
    <div className="cartao-form">
      {grupos && grupos.length > 0 && (
        <label>
          Grupo
          <select value={grupo} onChange={(e) => setGrupo(e.target.value)}>
            {grupos.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="lista-inteligente-nova" style={{ marginTop: 12 }}>
        <input
          value={novo}
          onChange={(e) => setNovo(e.target.value)}
          placeholder="Escrever novo item…"
          spellCheck={false}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              adicionar()
            }
          }}
        />
        <button type="button" className="botao-mini" onClick={adicionar} disabled={aGuardar}>
          {aGuardar ? '…' : 'Adicionar'}
        </button>
      </div>

      {mensagem && <div className="mensagem">{mensagem}</div>}

      {itens.length === 0 ? (
        <p className="vazio" style={{ marginTop: 12 }}>
          Lista vazia.
        </p>
      ) : (
        <ul className="lista-config">
          {itens.map((i) => (
            <li key={i.id}>
              <span>{i.nome}</span>
              <button
                type="button"
                className="botao-cancelar-item"
                title="Eliminar"
                onClick={() => setParaEliminar(i)}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      {paraEliminar && (
        <div className="modal-fundo" onClick={() => setParaEliminar(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Eliminar item?</h3>
            <p>
              Eliminar <strong>{paraEliminar.nome}</strong> da lista?
            </p>
            <div className="modal-botoes">
              <button type="button" className="botao-secundario" onClick={() => setParaEliminar(null)}>
                Não
              </button>
              <button type="button" className="botao-perigo" onClick={eliminar}>
                Sim, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
