// Barra de topo: módulos, logótipo + nome da empresa, nome/cargo do utilizador e sair (✕).
import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { CARGOS } from '../lib/constantes'
import type { Pagina } from '../lib/navegacao'

const BUCKET_EMPRESAS = 'empresas'

export function BarraTopo({
  pagina,
  aoNavegar,
}: {
  pagina: Pagina
  aoNavegar: (p: Pagina) => void
}) {
  const { session, perfil, empresa, sair, recarregarEmpresa } = useAuth()
  const inputLogoRef = useRef<HTMLInputElement>(null)
  const [aEnviarLogo, setAEnviarLogo] = useState(false)
  const [confirmarSair, setConfirmarSair] = useState(false)
  const [menuAberto, setMenuAberto] = useState(false)

  // Só o Admin da empresa (nível 8) ou o Super Admin podem mudar o logótipo
  const podeGerirEmpresa = !!perfil && (perfil.nivel_acesso >= 8 || perfil.is_super_admin)

  const cargo = perfil
    ? perfil.is_super_admin
      ? 'Super Admin'
      : (CARGOS[perfil.nivel_acesso] ?? `Nível ${perfil.nivel_acesso}`)
    : ''

  async function aoEscolherLogo(evento: ChangeEvent<HTMLInputElement>) {
    const ficheiro = evento.target.files?.[0]
    if (!ficheiro || !empresa) return
    setAEnviarLogo(true)

    const extensao = ficheiro.name.split('.').pop() || 'png'
    const caminho = `${empresa.id}/logo-${Date.now()}.${extensao}`
    const { error: erroUpload } = await supabase.storage
      .from(BUCKET_EMPRESAS)
      .upload(caminho, ficheiro, { upsert: true })

    if (!erroUpload) {
      const url = supabase.storage.from(BUCKET_EMPRESAS).getPublicUrl(caminho).data.publicUrl
      await supabase.from('empresas').update({ logo_url: url }).eq('id', empresa.id)
      await recarregarEmpresa()
    }

    setAEnviarLogo(false)
    if (inputLogoRef.current) inputLogoRef.current.value = ''
  }

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
                  className={pagina === 'empresa' ? 'ativo' : ''}
                  onClick={() => {
                    aoNavegar('empresa')
                    setMenuAberto(false)
                  }}
                >
                  🏢 Perfil da Empresa
                </button>

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
            <div
              className={'logo-empresa' + (podeGerirEmpresa ? ' logo-empresa-editavel' : '')}
              onClick={() => podeGerirEmpresa && inputLogoRef.current?.click()}
              title={podeGerirEmpresa ? 'Clica para mudar o logótipo' : undefined}
            >
              {empresa?.logo_url ? (
                <img src={empresa.logo_url} alt="Logótipo" />
              ) : (
                <span>{empresa?.nome?.charAt(0) ?? '🏗️'}</span>
              )}
              {aEnviarLogo && <span className="logo-a-enviar">…</span>}
            </div>
            <div className="barra-empresa-texto">
              <strong>{empresa?.nome ?? 'Sistema Grupo Speed'}</strong>
              <span>🏗️ Sistema Grupo Speed</span>
            </div>
            {podeGerirEmpresa && (
              <input
                ref={inputLogoRef}
                type="file"
                accept="image/*"
                hidden
                onChange={aoEscolherLogo}
              />
            )}
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
