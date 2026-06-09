// Seletor de vários fornecedores para um produto, cada um com o seu preço (€).
// Mostra o preço médio e permite adicionar existentes ou criar um novo na hora.
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

type Fornecedor = { id: string; nome: string }
export type FornecedorSel = { fornecedor_id: string; valor: string }

type Props = {
  empresaId: string | null
  selecionados: FornecedorSel[]
  aoMudar: (lista: FornecedorSel[]) => void
}

export function SeletorFornecedores({ empresaId, selecionados, aoMudar }: Props) {
  const [opcoes, setOpcoes] = useState<Fornecedor[]>([])
  const [aCriarNovo, setACriarNovo] = useState(false)
  const [novoNome, setNovoNome] = useState('')

  async function carregar() {
    const { data } = await supabase.from('fornecedores').select('id, nome').order('nome')
    if (data) setOpcoes(data as Fornecedor[])
  }

  useEffect(() => {
    carregar()
  }, [])

  function adicionar(id: string) {
    if (selecionados.some((s) => s.fornecedor_id === id)) return
    aoMudar([...selecionados, { fornecedor_id: id, valor: '' }])
  }

  function remover(id: string) {
    aoMudar(selecionados.filter((s) => s.fornecedor_id !== id))
  }

  function mudarValor(id: string, valor: string) {
    aoMudar(selecionados.map((s) => (s.fornecedor_id === id ? { ...s, valor } : s)))
  }

  async function adicionarNovo() {
    const nome = novoNome.trim()
    if (!nome) return
    const { data, error } = await supabase
      .from('fornecedores')
      .insert({ empresa_id: empresaId, nome })
      .select('id, nome')
      .single()
    if (!error && data) {
      await carregar()
      adicionar(data.id)
    }
    setNovoNome('')
    setACriarNovo(false)
  }

  // Preço médio dos fornecedores que já têm preço preenchido
  const precos = selecionados.map((s) => parseFloat(s.valor)).filter((n) => !Number.isNaN(n))
  const media = precos.length ? precos.reduce((a, b) => a + b, 0) / precos.length : null

  function nomeDe(id: string) {
    return opcoes.find((o) => o.id === id)?.nome ?? '—'
  }

  return (
    <div className="campo-fornecedores">
      <span className="rotulo-campo">Fornecedores e preço (podes adicionar vários)</span>

      {selecionados.length > 0 && (
        <div className="lista-fornecedores">
          {selecionados.map((s) => (
            <div key={s.fornecedor_id} className="linha-fornecedor">
              <span className="nome-fornecedor">{nomeDe(s.fornecedor_id)}</span>
              <div className="preco-fornecedor">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Preço"
                  value={s.valor}
                  onChange={(e) => mudarValor(s.fornecedor_id, e.target.value)}
                />
                <span>€</span>
              </div>
              <button type="button" onClick={() => remover(s.fornecedor_id)} title="Remover">
                ✕
              </button>
            </div>
          ))}

          {media != null && (
            <div className="media-fornecedor">
              Preço médio: <strong>{media.toFixed(2)} €</strong>
            </div>
          )}
        </div>
      )}

      {aCriarNovo ? (
        <div className="lista-inteligente-nova">
          <input
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            placeholder="Nome do fornecedor…"
            autoFocus
          />
          <button type="button" className="botao-mini" onClick={adicionarNovo}>
            Adicionar
          </button>
          <button type="button" className="botao-mini-cinza" onClick={() => setACriarNovo(false)}>
            ✕
          </button>
        </div>
      ) : (
        <select
          className="select-fornecedor"
          value=""
          onChange={(e) => {
            const v = e.target.value
            if (v === '__novo__') setACriarNovo(true)
            else if (v) adicionar(v)
          }}
        >
          <option value="" disabled hidden>
            ➕ Adicionar fornecedor
          </option>
          {opcoes
            .filter((o) => !selecionados.some((s) => s.fornecedor_id === o.id))
            .map((o) => (
              <option key={o.id} value={o.id}>
                {o.nome}
              </option>
            ))}
          <option value="__novo__">➕ Novo fornecedor…</option>
        </select>
      )}
    </div>
  )
}
