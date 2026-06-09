import { useState } from 'react'
import { useAuth } from './contexts/AuthContext'
import { Login } from './components/Login'
import { BarraTopo } from './components/BarraTopo'
import { CatalogoProdutos } from './components/CatalogoProdutos'
import { PerfilEmpresa } from './components/PerfilEmpresa'
import type { Pagina } from './lib/navegacao'

function App() {
  const { session, perfil, carregando } = useAuth()
  const [pagina, setPagina] = useState<Pagina>('catalogo')

  // Enquanto verifica se há sessão iniciada
  if (carregando) {
    return <div className="centro">A carregar…</div>
  }

  // Sem sessão → mostra o ecrã de login
  if (!session) {
    return <Login />
  }

  // Com sessão → área autenticada
  return (
    <>
      <BarraTopo pagina={pagina} aoNavegar={setPagina} />

      {perfil ? (
        pagina === 'empresa' ? (
          <PerfilEmpresa />
        ) : (
          <CatalogoProdutos perfil={perfil} />
        )
      ) : (
        <div className="centro">
          <div className="aviso">
            ⚠️ Este utilizador ainda não tem <strong>perfil/empresa</strong> associados.
          </div>
        </div>
      )}
    </>
  )
}

export default App
