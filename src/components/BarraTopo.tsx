// Barra de topo: módulos, logótipo + nome da empresa, nome/cargo do utilizador e sair (✕).
// O logótipo aqui é só para mostrar — muda-se no Perfil da Empresa.
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { CARGOS } from '../lib/constantes'
import type { Pagina } from '../lib/navegacao'

export function BarraTopo({
  pagina,
  aoNavegar,
}: {
  pagina: Pagina
  aoNavegar: (p: Pagina) => void
}) {
  const { session, perfil, empresa, sair } = useAuth()
  const [confirmarSair, setConfirmarSair] = useState(false)
  const [menuAberto, setMenuAberto] = useState(false)

  const cargo = perfil
    ? perfil.is_super_admin
      ? 'Super Admin'
      : (CARGOS[perfil.nivel_acesso] ?? `Nível ${perfil.nivel_acesso}`)
    : ''

  return (
    <>
      <div className="barra">
        <div className="barra-esquerda">
          <div className="modulos-wrapper">
            <button
              className="botao-modulos"
              type="button"
              title="Módulos"
              onClick={() => setMenuAberto((v) => !v)}
            >
              ☰
            </button>
            {menuAberto && (
              <div className="modulos-menu">
                <button
                  type="button"
                  className={pagina === 'catalogo' ? 'ativo' : ''}
                  onClick={() => {
                    aoNavegar('catalogo')
                    setMenuAberto(false)
                  }}
                >
                  📦 Catálogo de Materiais
                </button>
                <button
                  type="button"
                  className={pagina === 'pedidos' ? 'ativo' : ''}
                  onClick={() => {
                    aoNavegar('pedidos')
                    setMenuAberto(false)
                  }}
                >
                  🛒 Pedidos de Material
                </button>
                {(perfil
                  ? perfil.nivel_acesso >= 3 || perfil.is_comprador || perfil.is_super_admin
                  : false) && (
                  <button
                    type="button"
                    className={pagina === 'materiais' ? 'ativo' : ''}
                    onClick={() => {
                      aoNavegar('materiais')
                      setMenuAberto(false)
                    }}
                  >
                    📊 Lista de Materiais
                  </button>
                )}
                {(perfil ? perfil.nivel_acesso >= 4 || perfil.is_super_admin : false) && (
                  <button
                    type="button"
                    className={pagina === 'movimentos' ? 'ativo' : ''}
                    onClick={() => {
                      aoNavegar('movimentos')
                      setMenuAberto(false)
                    }}
                  >
                    💶 Movimentos
                  </button>
                )}
                <button
                  type="button"
                  className={pagina === 'projetos' ? 'ativo' : ''}
                  onClick={() => {
                    aoNavegar('projetos')
                    setMenuAberto(false)
                  }}
                >
                  📋 Projetos
                </button>
                <button
                  type="button"
                  className={pagina === 'empresa' ? 'ativo' : ''}
                  onClick={() => {
                    aoNavegar('empresa')
                    setMenuAberto(false)
                  }}
                >
                  🏢 Perfil da Empresa
                </button>
                {perfil?.is_super_admin && (
                  <button
                    type="button"
                    className={pagina === 'empresas' ? 'ativo' : ''}
                    onClick={() => {
                      aoNavegar('empresas')
                      setMenuAberto(false)
                    }}
                  >
                    🏬 Empresas Registadas
                  </button>
                )}

                <div className="modulos-separador" />

                <button
                  type="button"
                  className="modulos-sair"
                  onClick={() => {
                    setMenuAberto(false)
                    setConfirmarSair(true)
                  }}
                >
                  ✕ Sair
                </button>
              </div>
            )}
          </div>

          <div className="barra-empresa">
            <div className="logo-empresa">
              {empresa?.logo_url ? (
                <img src={empresa.logo_url} alt="Logótipo" />
              ) : (
                <span>{empresa?.nome?.charAt(0) ?? '🏗️'}</span>
              )}
            </div>
            <div className="barra-empresa-texto">
              <strong>{empresa?.nome ?? 'Sistema Grupo Speed'}</strong>
            </div>
          </div>
        </div>

        <div className="barra-direita">
          <div className="barra-utilizador-info">
            <strong>{perfil?.nome ?? session?.user.email}</strong>
            <span>{cargo}</span>
          </div>
        </div>
      </div>

      {confirmarSair && (
        <div className="modal-fundo" onClick={() => setConfirmarSair(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Sair da aplicação?</h3>
            <p>Pretende mesmo terminar a sessão?</p>
            <div className="modal-botoes">
              <button
                type="button"
                className="botao-secundario"
                onClick={() => setConfirmarSair(false)}
              >
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
