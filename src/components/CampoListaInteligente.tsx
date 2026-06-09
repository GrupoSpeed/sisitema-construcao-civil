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
  // Filtro opcional: mostra/cria só os valores ligados a outra coluna
  // (ex.: categorias de um certo setor). filtroColuna="setor", filtroValor=setor escolhido.
  filtroColuna?: string
  filtroValor?: string
  // Destaque visual quando o campo está fixo (ex.: bloqueado no modo "adicionar vários")
  realce?: boolean
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
  filtroColuna,
  filtroValor,
  realce = false,
}: Props) {
  const [opcoes, setOpcoes] = useState<string[]>([])
  const [aCriarNova, setACriarNova] = useState(false)
  const [novoNome, setNovoNome] = useState('')

  // Quando há filtro mas ainda não foi escolhido o valor de referência (ex.: sem setor)
  const aguardaFiltro = !!filtroColuna && !filtroValor

  async function carregar() {
    if (aguardaFiltro) {
      setOpcoes([])
      return
    }
    let consulta = supabase.from(tabela).select('nome').order('nome')
    if (filtroColuna && filtroValor) consulta = consulta.eq(filtroColuna, filtroValor)
    const { data } = await consulta
    if (data) setOpcoes(data.map((d) => d.nome as string))
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroValor])

  async function adicionarNova() {
    const nome = capitalizar ? capitalizarPalavras(novoNome.trim()) : novoNome.trim()
    if (!nome) return
    // Inclui a coluna de filtro (ex.: setor) e o conflito tem de a considerar
    const registo: Record<string, unknown> = { empresa_id: empresaId, nome }
    let conflito = 'empresa_id,nome'
    if (filtroColuna && filtroValor) {
      registo[filtroColuna] = filtroValor
      conflito = `empresa_id,${filtroColuna},nome`
    }
    await supabase.from(tabela).upsert(registo, { onConflict: conflito, ignoreDuplicates: true })
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
          className={realce ? 'select-bloqueado' : undefined}
          value={valor}
          required={obrigatorio}
          disabled={desativado || aguardaFiltro}
          onChange={(e) => {
            if (e.target.value === '__nova__') {
              setACriarNova(true)
            } else {
              aoMudar(e.target.value)
            }
          }}
        >
          {aguardaFiltro ? (
            <option value="" disabled hidden>
              (escolhe primeiro o setor)
            </option>
          ) : obrigatorio ? (
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
          {!aguardaFiltro && <option value="__nova__">➕ Adicionar nova…</option>}
        </select>
      )}
    </label>
  )
}
