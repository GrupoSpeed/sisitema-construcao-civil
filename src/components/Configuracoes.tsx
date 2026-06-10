// Ecrã de Configurações (Admin): gerir as listas usadas no sistema.
import { useState } from 'react'
import type { Perfil } from '../contexts/AuthContext'
import { GestaoLista } from './GestaoLista'
import { LigacaoContas } from './LigacaoContas'

type ListaConfig = {
  tabela: string
  rotulo: string
  grupoCampo?: string
  grupos?: string[]
  nota?: string
}

const LISTAS: ListaConfig[] = [
  { tabela: 'centros_custo', rotulo: 'Centros de custo' },
  { tabela: 'tipos_documento', rotulo: 'Tipos de documento' },
  { tabela: 'contas_bancarias', rotulo: 'Contas bancárias' },
  { tabela: 'ligacao_contas', rotulo: 'Contas por centro de custo' },
  {
    tabela: 'categorias_mov',
    rotulo: 'Categorias de movimento',
    grupoCampo: 'tipo',
    grupos: ['Fixo', 'Variável'],
    nota: 'As categorias de movimento estão separadas por Fixo / Variável.',
  },
  { tabela: 'setores', rotulo: 'Setores (catálogo)' },
  { tabela: 'unidades', rotulo: 'Unidades' },
  { tabela: 'marcas', rotulo: 'Marcas' },
  { tabela: 'localidades', rotulo: 'Localidades' },
  { tabela: 'segmentos', rotulo: 'Segmentos' },
]

export function Configuracoes({ perfil }: { perfil: Perfil }) {
  const podeUsar = perfil.nivel_acesso >= 8 || perfil.is_super_admin
  const [sel, setSel] = useState(LISTAS[0].tabela)
  const atual = LISTAS.find((l) => l.tabela === sel) ?? LISTAS[0]

  if (!podeUsar) {
    return (
      <div className="pagina">
        <h2>Configurações</h2>
        <p className="vazio">Sem acesso — esta área é do Admin da empresa.</p>
      </div>
    )
  }

  return (
    <div className="pagina">
      <h2>Configurações</h2>
      <p className="subtexto">Gere as listas usadas no sistema. Já vêm preenchidas; podes adicionar ou remover.</p>

      <div className="escolher-lista">
        <span>Que lista queres gerir?</span>
        <select value={sel} onChange={(e) => setSel(e.target.value)} className="select-lista-config">
          {LISTAS.map((l) => (
            <option key={l.tabela} value={l.tabela}>
              {l.rotulo}
            </option>
          ))}
        </select>
      </div>

      {atual.nota && <p className="subtexto">{atual.nota}</p>}

      {atual.tabela === 'ligacao_contas' ? (
        <LigacaoContas empresaId={perfil.empresa_id} />
      ) : (
        <GestaoLista
          key={atual.tabela}
          tabela={atual.tabela}
          empresaId={perfil.empresa_id}
          grupoCampo={atual.grupoCampo}
          grupos={atual.grupos}
        />
      )}
    </div>
  )
}
