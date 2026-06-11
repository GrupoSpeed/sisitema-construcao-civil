// Barra de topo: logótipo + nome da empresa e nome/cargo do utilizador.
// A navegação está no menu lateral (MenuLateral). O logótipo aqui é só para mostrar.
import { useAuth } from '../contexts/AuthContext'
import { CARGOS } from '../lib/constantes'

export function BarraTopo() {
  const { session, perfil, empresa } = useAuth()

  const cargo = perfil
    ? perfil.is_super_admin
      ? 'Super Admin'
      : (CARGOS[perfil.nivel_acesso] ?? `Nível ${perfil.nivel_acesso}`)
    : ''

  return (
    <div className="barra">
      <div className="barra-esquerda">
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
  )
}
