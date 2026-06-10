import { useState } from 'react'
import { useAuth } from './contexts/AuthContext'
import { Login } from './components/Login'
import { BarraTopo } from './components/BarraTopo'
import { CatalogoProdutos } from './components/CatalogoProdutos'
import { Projetos } from './components/Projetos'
import { Pedidos } from './components/Pedidos'
import { PerfilEmpresa } from './components/PerfilEmpresa'
import { GestaoEmpresas } from './components/GestaoEmpresas'
import { RodaPe } from './components/RodaPe'
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
        ) : pagina === 'projetos' ? (
          <Projetos perfil={perfil} />
        ) : pagina === 'pedidos' ? (
          <Pedidos perfil={perfil} />
        ) : pagina === 'empresas' && perfil.is_super_admin ? (
          <GestaoEmpresas />
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

      <RodaPe />
    </>
  )
}

export default App
