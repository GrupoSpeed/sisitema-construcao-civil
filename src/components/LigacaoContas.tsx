// Ligação Contas ↔ Centro de custo (muitos-para-muitos), gerida por centro de custo.
// Escolhe-se um centro de custo e marcam-se as contas que lhe pertencem.
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

type Item = { id: string; nome: string }
type Ligacao = { centro_custo_id: string; conta_id: string }

export function LigacaoContas({ empresaId }: { empresaId: string | null }) {
  const [centros, setCentros] = useState<Item[]>([])
  const [contas, setContas] = useState<Item[]>([])
  const [ligacoes, setLigacoes] = useState<Ligacao[]>([])
  const [centroSel, setCentroSel] = useState('')
  const [aGuardar, setAGuardar] = useState(false)

  async function carregar() {
    const [resC, resCo, resL] = await Promise.all([
      supabase.from('centros_custo').select('id, nome').order('nome'),
      supabase.from('contas_bancarias').select('id, nome').order('nome'),
      supabase.from('centro_conta').select('centro_custo_id, conta_id'),
    ])
    if (resC.data) {
      setCentros(resC.data as Item[])
      if (!centroSel && resC.data.length) setCentroSel((resC.data[0] as Item).id)
    }
    if (resCo.data) setContas(resCo.data as Item[])
    if (resL.data) setLigacoes(resL.data as Ligacao[])
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // O centro "Geral" inclui sempre todas as contas (automático, não editável)
  const ehGeral = centros.find((c) => c.id === centroSel)?.nome === 'Geral'

  function estaLigada(contaId: string): boolean {
    if (ehGeral) return true
    return ligacoes.some((l) => l.centro_custo_id === centroSel && l.conta_id === contaId)
  }

  async function alternar(contaId: string) {
    if (!centroSel || ehGeral) return
    setAGuardar(true)
    if (estaLigada(contaId)) {
      await supabase
        .from('centro_conta')
        .delete()
        .eq('centro_custo_id', centroSel)
        .eq('conta_id', contaId)
    } else {
      await supabase
        .from('centro_conta')
        .insert({ empresa_id: empresaId, centro_custo_id: centroSel, conta_id: contaId })
    }
    await carregar()
    setAGuardar(false)
  }

  return (
    <div className="cartao-form">
      <div className="escolher-lista">
        <span>Centro de custo</span>
        <select
          value={centroSel}
          onChange={(e) => setCentroSel(e.target.value)}
          className="select-lista-config"
        >
          {centros.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </div>

      {centros.length === 0 ? (
        <p className="vazio">Cria primeiro centros de custo.</p>
      ) : contas.length === 0 ? (
        <p className="vazio">Cria primeiro contas bancárias.</p>
      ) : (
        <>
          <span className="rotulo-campo">
            {ehGeral
              ? 'O centro "Geral" inclui sempre todas as contas:'
              : 'Marca as contas ligadas a este centro de custo:'}
          </span>
          <div className="lista-config" style={{ opacity: aGuardar ? 0.6 : 1 }}>
            {contas.map((c) => (
              <li key={c.id} style={{ listStyle: 'none' }}>
                <label className="campo-checkbox" style={{ flexDirection: 'row', gap: 10 }}>
                  <input
                    type="checkbox"
                    checked={estaLigada(c.id)}
                    disabled={ehGeral}
                    onChange={() => alternar(c.id)}
                  />
                  {c.nome}
                </label>
              </li>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
