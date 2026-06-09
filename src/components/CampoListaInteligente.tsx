// Campo de seleção "inteligente": mostra os valores já existentes (que crescem com o uso)
// e permite adicionar um novo, que fica guardado para os próximos produtos.
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { capitalizarPalavras } from '../lib/constantes'

type Props = {
  rotulo: string
  tabela: 'categorias' | 'marcas' | 'localidades' | 'segmentos' | 'setores' | 'unidades'
  empresaId: string | null
  valor: string
  aoMudar: (valor: string) => void
  obrigatorio?: boolean
  desativado?: boolean
  capitalizar?: boolean
  exemplo?: string
}

export function CampoListaInteligente({
  rotulo,
  tabela,
  empresaId,
  valor,
  aoMudar,
  obrigatorio = false,
  desativado = false,
  capitalizar = false,
  exemplo,
}: Props) {
  const [opcoes, setOpcoes] = useState<string[]>([])
  const [aCriarNova, setACriarNova] = useState(false)
  const [novoNome, setNovoNome] = useState('')

  async function carregar() {
    const { data } = await supabase.from(tabela).select('nome').order('nome')
    if (data) setOpcoes(data.map((d) => d.nome as string))
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function adicionarNova() {
    const nome = capitalizar ? capitalizarPalavras(novoNome.trim()) : novoNome.trim()
    if (!nome) return
    // Guarda a nova opção (ignora se já existir)
    await supabase
      .from(tabela)
      .upsert({ empresa_id: empresaId, nome }, { onConflict: 'empresa_id,nome', ignoreDuplicates: true })
    await carregar()
    aoMudar(nome)
    setNovoNome('')
    setACriarNova(false)
  }

  // Garante que o valor já guardado aparece na lista, mesmo que ainda não esteja carregado
  const listaOpcoes = valor && !opcoes.includes(valor) ? [valor, ...opcoes] : opcoes

  return (
    <label>
      {rotulo}
      {obrigatorio ? ' *' : ''}
      {aCriarNova ? (
        <div className="lista-inteligente-nova">
          <input
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            placeholder="Escrever nova…"
            spellCheck={false}
            autoFocus
          />
          <button type="button" className="botao-mini" onClick={adicionarNova}>
            Adicionar
          </button>
          <button
            type="button"
            className="botao-mini-cinza"
            onClick={() => setACriarNova(false)}
          >
            ✕
          </button>
        </div>
      ) : (
        <select
          value={valor}
          required={obrigatorio}
          disabled={desativado}
          onChange={(e) => {
            if (e.target.value === '__nova__') {
              setACriarNova(true)
            } else {
              aoMudar(e.target.value)
            }
          }}
        >
          {obrigatorio ? (
            <option value="" disabled hidden>
              {exemplo ? `Ex: ${exemplo}` : '(escolher)'}
            </option>
          ) : (
            <option value="">{exemplo ? `Ex: ${exemplo}` : '(nenhuma)'}</option>
          )}
          {listaOpcoes.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
          <option value="__nova__">➕ Adicionar nova…</option>
        </select>
      )}
    </label>
  )
}
