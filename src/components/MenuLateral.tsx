// Menu de navegação responsivo.
// Desktop: barra lateral fixa à esquerda (só ícones; expande no hover; submenus à direita).
// Mobile (≤768px): ícone hambúrguer que abre um overlay de ecrã inteiro.
import { useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import type { Perfil } from '../contexts/AuthContext'
import type { Pagina } from '../lib/navegacao'

// sub: 'id' = âncora para uma secção da página; 'tabela' = abrir uma lista nas Configurações
type SubItem = { id?: string; tabela?: string; rotulo: string; mostrar?: (p: Perfil) => boolean }
type ItemMenu = {
  pagina: Pagina
  icone: string
  rotulo: string
  mostrar: (p: Perfil) => boolean
  sub?: SubItem[]
}

// Itens do menu (com as permissões de cada um)
const ITENS: ItemMenu[] = [
  { pagina: 'catalogo', icone: '📦', rotulo: 'Catálogo', mostrar: () => true },
  { pagina: 'pedidos', icone: '🛒', rotulo: 'Pedidos de Material', mostrar: () => true },
  {
    pagina: 'materiais',
    icone: '📊',
    rotulo: 'Lista de Materiais',
    mostrar: (p) => p.nivel_acesso >= 3 || p.is_comprador || p.is_super_admin,
  },
  {
    pagina: 'movimentos',
    icone: '💶',
    rotulo: 'Movimentos',
    mostrar: (p) => p.nivel_acesso >= 4 || p.is_super_admin,
  },
  { pagina: 'projetos', icone: '📋', rotulo: 'Projetos', mostrar: () => true },
  {
    pagina: 'empresa',
    icone: '🏢',
    rotulo: 'Perfil da Empresa',
    mostrar: () => true,
    sub: [
      { id: 'perfil-dados', rotulo: 'Dados da empresa' },
      { id: 'perfil-colaboradores', rotulo: 'Colaboradores', mostrar: (p) => p.nivel_acesso >= 8 || p.is_super_admin },
    ],
  },
  {
    pagina: 'configuracoes',
    icone: '⚙️',
    rotulo: 'Configurações',
    mostrar: (p) => p.nivel_acesso >= 8 || p.is_super_admin,
    sub: [
      { tabela: 'centros_custo', rotulo: 'Centros de custo' },
      { tabela: 'tipos_documento', rotulo: 'Tipos de documento' },
      { tabela: 'contas_bancarias', rotulo: 'Contas bancárias' },
      { tabela: 'ligacao_contas', rotulo: 'Contas por centro de custo' },
      { tabela: 'categorias_mov', rotulo: 'Categorias de movimento' },
      { tabela: 'setores', rotulo: 'Setores' },
      { tabela: 'unidades', rotulo: 'Unidades' },
      { tabela: 'marcas', rotulo: 'Marcas' },
      { tabela: 'localidades', rotulo: 'Localidades' },
      { tabela: 'segmentos', rotulo: 'Segmentos' },
    ],
  },
  { pagina: 'empresas', icone: '🏬', rotulo: 'Empresas Registadas', mostrar: (p) => p.is_super_admin },
]

export function MenuLateral({
  pagina,
  aoNavegar,
  aoAbrirConfig,
  perfil,
}: {
  pagina: Pagina
  aoNavegar: (p: Pagina) => void
  aoAbrirConfig: (tabela: string) => void
  perfil: Perfil
}) {
  const { sair } = useAuth()
  const [mobileAberto, setMobileAberto] = useState(false)
  const [confirmarSair, setConfirmarSair] = useState(false)
  // Controlo (por JS) da barra expandida e do submenu aberto — evita o submenu "fugir"
  const [expandido, setExpandido] = useState(false)
  const [subAberto, setSubAberto] = useState<Pagina | null>(null)
  const fecharTimer = useRef<number | null>(null)

  const itens = ITENS.filter((i) => i.mostrar(perfil))

  function abrirSub(p: Pagina) {
    if (fecharTimer.current) window.clearTimeout(fecharTimer.current)
    setSubAberto(p)
  }
  function agendarFechar() {
    if (fecharTimer.current) window.clearTimeout(fecharTimer.current)
    fecharTimer.current = window.setTimeout(() => setSubAberto(null), 250)
  }

  // Navega para a página e, se houver âncora, rola até à secção
  function irPara(p: Pagina, ancora?: string) {
    aoNavegar(p)
    setMobileAberto(false)
    if (ancora) {
      setTimeout(() => document.getElementById(ancora)?.scrollIntoView({ behavior: 'smooth' }), 120)
    }
  }

  // Clique num subitem: abre uma lista das Configurações ou rola até uma secção (e fecha o submenu)
  function cliqueSub(item: ItemMenu, sub: SubItem) {
    setSubAberto(null)
    setExpandido(false)
    setMobileAberto(false)
    if (item.pagina === 'configuracoes' && sub.tabela) {
      aoAbrirConfig(sub.tabela)
    } else {
      irPara(item.pagina, sub.id)
    }
  }

  return (
    <>
      {/* Hambúrguer (só mobile) */}
      <button
        className="menu-hamburguer"
        type="button"
        aria-label="Abrir menu"
        onClick={() => setMobileAberto(true)}
      >
        ☰
      </button>

      {/* Barra lateral (desktop) */}
      <nav
        className={'menu-lateral' + (expandido || subAberto ? ' expandido' : '')}
        aria-label="Navegação principal"
        onMouseEnter={() => setExpandido(true)}
        onMouseLeave={() => {
          setExpandido(false)
          agendarFechar()
        }}
      >
        <div className="menu-lateral-itens">
          {itens.map((i) => (
            <div
              key={i.pagina}
              className="menu-item-wrap"
              onMouseEnter={() => (i.sub ? abrirSub(i.pagina) : setSubAberto(null))}
            >
              <button
                type="button"
                className={'menu-item' + (pagina === i.pagina ? ' ativo' : '')}
                onClick={() => irPara(i.pagina)}
              >
                <span className="menu-item-icone">{i.icone}</span>
                <span className="menu-item-texto">{i.rotulo}</span>
              </button>

              {/* Submenu flutuante à direita */}
              {i.sub && (
                <div
                  className="menu-submenu"
                  style={{ display: subAberto === i.pagina ? 'block' : 'none' }}
                  onMouseEnter={() => abrirSub(i.pagina)}
                  onMouseLeave={agendarFechar}
                >
                  <div className="menu-submenu-titulo">{i.rotulo}</div>
                  {i.sub
                    .filter((s) => !s.mostrar || s.mostrar(perfil))
                    .map((s) => (
                      <button
                        key={s.id ?? s.tabela}
                        type="button"
                        className="menu-subitem"
                        onClick={() => cliqueSub(i, s)}
                      >
                        {s.rotulo}
                      </button>
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Sair (fundo da barra) */}
        <button
          type="button"
          className="menu-item menu-item-sair"
          onClick={() => setConfirmarSair(true)}
        >
          <span className="menu-item-icone">✕</span>
          <span className="menu-item-texto">Sair</span>
        </button>
      </nav>

      {/* Overlay (mobile) */}
      {mobileAberto && (
        <div className="menu-overlay">
          <button
            type="button"
            className="menu-overlay-fechar"
            aria-label="Fechar menu"
            onClick={() => setMobileAberto(false)}
          >
            ✕
          </button>
          <div className="menu-overlay-itens">
            {itens.map((i) => (
              <div key={i.pagina}>
                <button
                  type="button"
                  className={'menu-overlay-item' + (pagina === i.pagina ? ' ativo' : '')}
                  onClick={() => irPara(i.pagina)}
                >
                  <span>{i.icone}</span> {i.rotulo}
                </button>
                {i.sub &&
                  i.sub
                    .filter((s) => !s.mostrar || s.mostrar(perfil))
                    .map((s) => (
                      <button
                        key={s.id ?? s.tabela}
                        type="button"
                        className="menu-overlay-subitem"
                        onClick={() => cliqueSub(i, s)}
                      >
                        ↳ {s.rotulo}
                      </button>
                    ))}
              </div>
            ))}
            <button
              type="button"
              className="menu-overlay-item menu-item-sair"
              onClick={() => {
                setMobileAberto(false)
                setConfirmarSair(true)
              }}
            >
              ✕ Sair
            </button>
          </div>
        </div>
      )}

      {/* Confirmar sair */}
      {confirmarSair && (
        <div className="modal-fundo" onClick={() => setConfirmarSair(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Sair da aplicação?</h3>
            <p>Pretende mesmo terminar a sessão?</p>
            <div className="modal-botoes">
              <button type="button" className="botao-secundario" onClick={() => setConfirmarSair(false)}>
                Não
              </button>
              <button type="button" className="botao-primario" onClick={sair}>
                Sim, sair
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
