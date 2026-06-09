// Ecrã de entrada: email + palavra-passe.
import { useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'

export function Login() {
  const { entrar } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [aEntrar, setAEntrar] = useState(false)

  async function aoSubmeter(evento: FormEvent) {
    evento.preventDefault()
    setErro(null)
    setAEntrar(true)
    const { error } = await entrar(email, password)
    setAEntrar(false)
    if (error) {
      setErro('Não foi possível entrar. Verifica o email e a palavra-passe.')
    }
  }

  return (
    <div className="login-fundo">
      <form className="login-cartao" onSubmit={aoSubmeter}>
        <h1>Grupo Speed</h1>
        <p className="login-sub">Entrar no sistema</p>

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="o-teu-email@exemplo.pt"
            required
          />
        </label>

        <label>
          Palavra-passe
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </label>

        {erro && <div className="login-erro">{erro}</div>}

        <button type="submit" disabled={aEntrar}>
          {aEntrar ? 'A entrar…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
