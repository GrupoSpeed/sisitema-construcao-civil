// Gestão de colaboradores da empresa (dentro do Perfil da Empresa).
// O Admin cria o colaborador (login + perfil); depois o colaborador entra e ajusta os seus dados.
//
// NOTA (temporária): criar o login a partir do ecrã usa um 2.º cliente Supabase isolado
// (para não desligar o Admin). A solução final será uma Edge Function no servidor.
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { createClient } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import {
  CARGOS,
  NIVEIS_INFO,
  agrupar3,
  capitalizarPalavras,
  emailValido,
  validarPasswordProvisoria,
} from '../lib/constantes'

// 2.º cliente só para criar o login, sem mexer na sessão do Admin que está a usar o sistema.
const supabaseCriarLogin = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

type Colaborador = {
  id: string
  nome: string | null
  nif: string | null
  email: string | null
  nivel_acesso: number
  is_comprador: boolean
  is_super_admin: boolean
  ativo: boolean
}

export function GestaoColaboradores({ empresaId }: { empresaId: string }) {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [carregando, setCarregando] = useState(true)
  const [aGuardar, setAGuardar] = useState(false)
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [mostrarNiveis, setMostrarNiveis] = useState(false)

  // Campos do formulário
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [nome, setNome] = useState('')
  const [nif, setNif] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nivel, setNivel] = useState(1)
  const [comprador, setComprador] = useState(false)
  const [ativo, setAtivo] = useState(true)

  // Eliminação
  const [paraExcluir, setParaExcluir] = useState<Colaborador | null>(null)
  const [aExcluir, setAExcluir] = useState(false)

  async function carregar() {
    setCarregando(true)
    const { data, error } = await supabase
      .from('perfis')
      .select('id, nome, nif, email, nivel_acesso, is_comprador, is_super_admin, ativo')
      .eq('empresa_id', empresaId)
      .order('nivel_acesso', { ascending: false })
    if (!error && data) setColaboradores(data as Colaborador[])
    setCarregando(false)
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId])

  function limparFormulario() {
    setEditandoId(null)
    setNome('')
    setNif('')
    setEmail('')
    setPassword('')
    setNivel(1)
    setComprador(false)
    setAtivo(true)
  }

  function iniciarEdicao(c: Colaborador) {
    setEditandoId(c.id)
    setNome(c.nome ?? '')
    setNif(c.nif ?? '')
    setEmail(c.email ?? '')
    setPassword('')
    setNivel(c.nivel_acesso)
    setComprador(c.is_comprador)
    setAtivo(c.ativo)
    setMensagem(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function guardar(evento: FormEvent) {
    evento.preventDefault()
    setMensagem(null)

    if (!nome.trim()) {
      setMensagem('⚠️ Indica o nome do colaborador.')
      return
    }

    // EDITAR — só mexe no perfil (não muda email/palavra-passe aqui)
    if (editandoId) {
      setAGuardar(true)
      const { error } = await supabase
        .from('perfis')
        .update({
          nome: nome.trim(),
          nif: nif || null,
          nivel_acesso: nivel,
          is_comprador: comprador,
          ativo,
        })
        .eq('id', editandoId)
      setAGuardar(false)
      if (error) {
        setMensagem('❌ Não foi possível guardar: ' + error.message)
        return
      }
      setMensagem('✅ Colaborador atualizado!')
      limparFormulario()
      carregar()
      return
    }

    // CRIAR — precisa de email + palavra-passe válidos para o login
    if (!emailValido(email)) {
      setMensagem('⚠️ Indica um email válido (ex: nome@empresa.pt).')
      return
    }
    const erroPassword = validarPasswordProvisoria(password)
    if (erroPassword) {
      setMensagem('⚠️ ' + erroPassword)
      return
    }

    setAGuardar(true)
    // 1) Cria a conta de login (sem desligar o Admin)
    const { data: dadosLogin, error: erroLogin } = await supabaseCriarLogin.auth.signUp({
      email: email.trim(),
      password,
    })
    if (erroLogin || !dadosLogin.user) {
      setAGuardar(false)
      setMensagem(
        '❌ Não foi possível criar o login: ' +
          (erroLogin?.message ?? 'utilizador não devolvido') +
          (erroLogin?.message?.toLowerCase().includes('registered')
            ? ' (este email já tem conta).'
            : ''),
      )
      return
    }

    // 2) Cria o perfil ligado a essa conta
    const { error: erroPerfil } = await supabase.from('perfis').insert({
      id: dadosLogin.user.id,
      empresa_id: empresaId,
      nome: nome.trim(),
      nif: nif || null,
      email: email.trim(),
      nivel_acesso: nivel,
      is_comprador: comprador,
      ativo: true,
    })
    setAGuardar(false)
    if (erroPerfil) {
      setMensagem(
        '❌ Login criado, mas não foi possível guardar o perfil: ' + erroPerfil.message,
      )
      return
    }

    setMensagem('✅ Colaborador criado! Entrega-lhe o email e a palavra-passe temporária.')
    limparFormulario()
    carregar()
  }

  async function excluir() {
    if (!paraExcluir) return
    setAExcluir(true)
    const { error } = await supabase.from('perfis').delete().eq('id', paraExcluir.id)
    setAExcluir(false)
    if (error) {
      setMensagem('❌ Não foi possível excluir: ' + error.message)
      setParaExcluir(null)
      return
    }
    setMensagem('🗑️ Colaborador removido.')
    if (editandoId === paraExcluir.id) limparFormulario()
    setParaExcluir(null)
    carregar()
  }

  function nivelAcessoDe(c: Colaborador): string {
    if (c.is_super_admin) return 'Super Admin'
    return `${c.nivel_acesso} — ${CARGOS[c.nivel_acesso] ?? 'Nível ' + c.nivel_acesso}`
  }

  return (
    <div className="lista" style={{ marginTop: '2rem' }}>
      <div className="lista-cabecalho">
        <h3>Colaboradores da empresa</h3>
        <button type="button" className="botao-mini-cinza" onClick={() => setMostrarNiveis((v) => !v)}>
          {mostrarNiveis ? 'Esconder níveis' : 'ℹ️ O que é cada nível?'}
        </button>
      </div>

      {/* Guia dos níveis de acesso (janela) */}
      {mostrarNiveis && (
        <div className="modal-fundo" onClick={() => setMostrarNiveis(false)}>
          <div className="modal modal-largo" onClick={(e) => e.stopPropagation()}>
            <h3>🔐 Guia dos níveis de acesso</h3>
            <p>
              Escolhe o nível pela função real da pessoa. Os níveis <strong>acumulam</strong>: cada
              um faz tudo o que os de baixo fazem, mais o seu.
            </p>
            <table className="tabela">
              <thead>
                <tr>
                  <th>Nível</th>
                  <th>Cargo</th>
                  <th>O que pode fazer</th>
                  <th>Exemplo</th>
                </tr>
              </thead>
              <tbody>
                {NIVEIS_INFO.map((n) => (
                  <tr key={n.nivel}>
                    <td>{n.nivel}</td>
                    <td>{CARGOS[n.nivel]}</td>
                    <td>{n.descricao}</td>
                    <td>{n.exemplo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p>
              <small>
                Extra: a permissão <strong>Comprador</strong> pode ser dada a qualquer nível e
                permite registar as compras (recibo + valor).
              </small>
            </p>
            <div className="modal-botoes">
              <button type="button" className="botao-primario" onClick={() => setMostrarNiveis(false)}>
                Percebi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Formulário de adicionar / editar colaborador */}
      <form className="cartao-form" onSubmit={guardar}>
        <h3>{editandoId ? 'Editar colaborador' : 'Adicionar colaborador'}</h3>
        <div className="grelha-form">
          <label>
            Nome *
            <input
              value={nome}
              onChange={(e) => setNome(capitalizarPalavras(e.target.value))}
              spellCheck={false}
              required
            />
          </label>
          <label>
            NIF / NIPC
            <input
              value={nif}
              onChange={(e) => setNif(agrupar3(e.target.value))}
              inputMode="numeric"
              placeholder="000 000 000"
            />
          </label>

          {/* Email e palavra-passe só ao criar (login não se altera aqui) */}
          {!editandoId && (
            <>
              <label>
                Email (login) *
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.toLowerCase().trim())}
                  placeholder="nome@empresa.pt"
                  required
                />
                {email !== '' && !emailValido(email) && (
                  <small className="aviso-duplicado">⚠️ Email inválido (ex: nome@empresa.pt).</small>
                )}
              </label>
              <label>
                Palavra-passe provisória (8 números) *
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  inputMode="numeric"
                  maxLength={8}
                  placeholder="data de nascimento, ex: 01012000"
                  required
                />
                {password !== '' && validarPasswordProvisoria(password) && (
                  <small className="aviso-duplicado">⚠️ {validarPasswordProvisoria(password)}</small>
                )}
              </label>
            </>
          )}

          <label>
            <span className="rotulo-com-ajuda">
              Nível de acesso *
              <button
                type="button"
                className="botao-mini-cinza"
                onClick={() => setMostrarNiveis(true)}
              >
                ❓ Ajuda a escolher
              </button>
            </span>
            <select value={nivel} onChange={(e) => setNivel(Number(e.target.value))}>
              {NIVEIS_INFO.map((n) => (
                <option key={n.nivel} value={n.nivel}>
                  {n.nivel} — {CARGOS[n.nivel]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="caixa-validacao">
          <div className="caixa-validacao-texto">
            <strong>Permissões extra</strong>
            <span>O Comprador pode registar compras; o estado ativo controla o acesso.</span>
          </div>
          <label className="campo-checkbox">
            <input type="checkbox" checked={comprador} onChange={(e) => setComprador(e.target.checked)} />
            Comprador
          </label>
          {editandoId && (
            <label className="campo-checkbox">
              <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} />
              Ativo
            </label>
          )}
        </div>

        {mensagem && <div className="mensagem">{mensagem}</div>}
        <div className="form-botoes">
          <button type="submit" disabled={aGuardar}>
            {aGuardar ? 'A guardar…' : editandoId ? 'Guardar alterações' : 'Criar colaborador'}
          </button>
          {editandoId && (
            <button type="button" className="botao-cancelar" onClick={limparFormulario}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      {/* Tabela de colaboradores */}
      {carregando ? (
        <p>A carregar…</p>
      ) : colaboradores.length === 0 ? (
        <p className="vazio">Ainda não há colaboradores. Adiciona o primeiro acima! 👆</p>
      ) : (
        <div className="tabela-scroll">
        <table className="tabela">
          <thead>
            <tr>
              <th>Nome</th>
              <th>NIF</th>
              <th>Email</th>
              <th>Nível de acesso</th>
              <th>Comprador</th>
              <th>Estado</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {colaboradores.map((c) => (
              <tr key={c.id}>
                <td>{c.nome ?? '—'}</td>
                <td>{c.nif ? agrupar3(c.nif) : '—'}</td>
                <td>{c.email ?? '—'}</td>
                <td>{nivelAcessoDe(c)}</td>
                <td>{c.is_comprador ? '✔️' : '—'}</td>
                <td>
                  <span className={'badge badge-' + (c.ativo ? 'aprovado' : 'rejeitado')}>
                    {c.ativo ? 'ativo' : 'inativo'}
                  </span>
                </td>
                <td>
                  <div className="acoes-celula">
                    <button type="button" className="botao-acao" onClick={() => iniciarEdicao(c)}>
                      ✏️ Editar
                    </button>
                    {!c.is_super_admin && (
                      <button
                        type="button"
                        className="botao-acao botao-acao-perigo"
                        onClick={() => setParaExcluir(c)}
                      >
                        🗑️ Excluir
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}

      {/* Confirmação de excluir */}
      {paraExcluir && (
        <div className="modal-fundo" onClick={() => setParaExcluir(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Excluir colaborador?</h3>
            <p>
              Tens a certeza que queres remover <strong>{paraExcluir.nome ?? 'este colaborador'}</strong>?
              Ele deixa de ter perfil no sistema.
            </p>
            <div className="modal-botoes">
              <button type="button" className="botao-secundario" onClick={() => setParaExcluir(null)}>
                Não
              </button>
              <button type="button" className="botao-perigo" onClick={excluir} disabled={aExcluir}>
                {aExcluir ? 'A excluir…' : 'Sim, excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
