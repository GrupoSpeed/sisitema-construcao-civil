// "Cérebro" da autenticação: sabe quem está autenticado e qual o seu perfil.
// Qualquer ecrã do sistema pode perguntar a este ficheiro "quem é o utilizador?".
import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'

// Os dados do utilizador que guardamos na nossa tabela "perfis"
export type Perfil = {
  id: string
  empresa_id: string | null
  nome: string | null
  nivel_acesso: number
  is_comprador: boolean
  is_super_admin: boolean
  ativo: boolean
}

// Dados da empresa do utilizador
export type Empresa = {
  id: string
  nome: string
  logo_url: string | null
}

type AuthContextType = {
  session: Session | null
  perfil: Perfil | null
  empresa: Empresa | null
  carregando: boolean
  entrar: (email: string, password: string) => Promise<{ error: string | null }>
  sair: () => Promise<void>
  recarregarEmpresa: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [empresa, setEmpresa] = useState<Empresa | null>(null)
  const [carregando, setCarregando] = useState(true)

  // Ao arrancar: lê a sessão atual e fica a ouvir entradas/saídas
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setCarregando(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_evento, novaSessao) => {
      setSession(novaSessao)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  // Sempre que a sessão muda, vai buscar o perfil do utilizador à base de dados
  useEffect(() => {
    let ativo = true
    async function carregarPerfil() {
      if (!session) {
        setPerfil(null)
        return
      }
      const { data } = await supabase
        .from('perfis')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle()
      if (ativo) setPerfil((data as Perfil) ?? null)
    }
    carregarPerfil()
    return () => {
      ativo = false
    }
  }, [session])

  // Quando o perfil muda, carrega a empresa correspondente
  async function carregarEmpresa(empresaId: string | null | undefined) {
    if (!empresaId) {
      setEmpresa(null)
      return
    }
    const { data } = await supabase
      .from('empresas')
      .select('id, nome, logo_url')
      .eq('id', empresaId)
      .maybeSingle()
    setEmpresa((data as Empresa) ?? null)
  }

  useEffect(() => {
    carregarEmpresa(perfil?.empresa_id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perfil?.empresa_id])

  async function recarregarEmpresa() {
    await carregarEmpresa(perfil?.empresa_id)
  }

  async function entrar(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error ? error.message : null }
  }

  async function sair() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{ session, perfil, empresa, carregando, entrar, sair, recarregarEmpresa }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// Atalho para os ecrãs usarem a autenticação
export function useAuth() {
  const contexto = useContext(AuthContext)
  if (!contexto) throw new Error('useAuth tem de estar dentro do AuthProvider')
  return contexto
}
