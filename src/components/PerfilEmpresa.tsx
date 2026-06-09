// Tela de Perfil da Empresa: dados de identificação, morada, contactos e logótipo.
import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { agrupar3, capitalizarPalavras, formatarCodigoPostal, emailValido } from '../lib/constantes'
import { CampoListaInteligente } from './CampoListaInteligente'
import { GestaoColaboradores } from './GestaoColaboradores'

const BUCKET_EMPRESAS = 'empresas'

export function PerfilEmpresa() {
  const { perfil, empresa, recarregarEmpresa } = useAuth()
  const podeGerir = !!perfil && (perfil.nivel_acesso >= 8 || perfil.is_super_admin)

  const [nome, setNome] = useState('')
  const [nif, setNif] = useState('')
  const [morada, setMorada] = useState('')
  const [codigoPostal, setCodigoPostal] = useState('')
  const [localidade, setLocalidade] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  const [carregando, setCarregando] = useState(true)
  const [aGuardar, setAGuardar] = useState(false)
  const [aEnviarLogo, setAEnviarLogo] = useState(false)
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [editando, setEditando] = useState(false)
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false)
  const inputLogoRef = useRef<HTMLInputElement>(null)

  async function carregar() {
    if (!empresa) {
      setCarregando(false)
      return
    }
    const { data } = await supabase.from('empresas').select('*').eq('id', empresa.id).single()
    if (data) {
      setNome(data.nome ?? '')
      setNif(agrupar3(data.nif ?? ''))
      setMorada(data.morada ?? '')
      setCodigoPostal(data.codigo_postal ?? '')
      setLocalidade(data.localidade ?? '')
      setTelefone(agrupar3(data.telefone ?? ''))
      setEmail(data.email ?? '')
      setWebsite(data.website ?? '')
      setLogoUrl(data.logo_url ?? null)
    }
    setCarregando(false)
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresa?.id])

  // "Cancelar": desfaz as alterações (recarrega da base de dados) e sai do modo edição
  function cancelarEdicao() {
    carregar()
    setEditando(false)
    setMensagem(null)
  }

  async function aoEscolherLogo(evento: ChangeEvent<HTMLInputElement>) {
    const ficheiro = evento.target.files?.[0]
    if (!ficheiro || !empresa) return
    setAEnviarLogo(true)
    const extensao = ficheiro.name.split('.').pop() || 'png'
    const caminho = `${empresa.id}/logo-${Date.now()}.${extensao}`
    const { error: erroUpload } = await supabase.storage
      .from(BUCKET_EMPRESAS)
      .upload(caminho, ficheiro, { upsert: true })
    if (erroUpload) {
      setMensagem(
        '❌ Não foi possível enviar o logótipo: ' +
          erroUpload.message +
          ' (verifica se correste o SQL do armazém de logótipos).',
      )
    } else {
      const url = supabase.storage.from(BUCKET_EMPRESAS).getPublicUrl(caminho).data.publicUrl
      const { error: erroUpdate } = await supabase
        .from('empresas')
        .update({ logo_url: url })
        .eq('id', empresa.id)
      if (erroUpdate) {
        setMensagem('❌ Logótipo enviado, mas não foi possível guardar: ' + erroUpdate.message)
      } else {
        setLogoUrl(url)
        setMensagem('✅ Logótipo atualizado!')
        await recarregarEmpresa()
      }
    }
    setAEnviarLogo(false)
    if (inputLogoRef.current) inputLogoRef.current.value = ''
  }

  // Ao submeter o formulário, pedimos confirmação antes de gravar
  function guardar(evento: FormEvent) {
    evento.preventDefault()
    setMensagem(null)
    if (email && !emailValido(email)) {
      setMensagem('⚠️ Corrige o email antes de guardar (ex: nome@empresa.pt).')
      return
    }
    setMostrarConfirmacao(true)
  }

  // Grava mesmo, só depois do utilizador confirmar com "Sim"
  async function confirmarGuardar() {
    if (!empresa) return
    setMostrarConfirmacao(false)
    setAGuardar(true)
    const { error } = await supabase
      .from('empresas')
      .update({
        nome,
        nif: nif || null,
        morada: morada || null,
        codigo_postal: codigoPostal || null,
        localidade: localidade || null,
        telefone: telefone || null,
        email: email || null,
        website: website || null,
      })
      .eq('id', empresa.id)
    setAGuardar(false)
    if (error) {
      setMensagem('❌ Não foi possível guardar: ' + error.message)
      return
    }
    setEditando(false)
    setMensagem('✅ Dados da empresa guardados!')
    recarregarEmpresa()
  }

  if (carregando) return <div className="centro">A carregar…</div>

  return (
    <div className="pagina">
      <div className="cabecalho-pagina">
        <h2>Perfil da Empresa</h2>
        {podeGerir && !editando && (
          <button
            type="button"
            className="botao-icone"
            title="Editar dados da empresa"
            onClick={() => setEditando(true)}
          >
            ✏️
          </button>
        )}
      </div>
      <p className="subtexto">Os dados da tua empresa no sistema.</p>

      <form className="cartao-form" onSubmit={guardar}>
        {/* Logótipo */}
        <div className="perfil-logo">
          <div className="perfil-logo-img">
            {logoUrl ? <img src={logoUrl} alt="Logótipo" /> : <span>{nome.charAt(0) || '🏗️'}</span>}
          </div>
          {podeGerir && editando && (
            <div>
              <button
                type="button"
                className="botao-logo"
                onClick={() => inputLogoRef.current?.click()}
                disabled={aEnviarLogo}
              >
                {aEnviarLogo ? 'A enviar…' : 'Adicionar logomarca'}
              </button>
              <input
                ref={inputLogoRef}
                type="file"
                accept="image/*"
                hidden
                onChange={aoEscolherLogo}
              />
            </div>
          )}
        </div>

        <div className="grelha-form">
          <label>
            Nome da empresa *
            <input
              value={nome}
              onChange={(e) => setNome(capitalizarPalavras(e.target.value))}
              spellCheck={false}
              required
              disabled={!podeGerir || !editando}
            />
          </label>
          <label>
            NIF / NIPC *
            <input
              value={nif}
              onChange={(e) => setNif(agrupar3(e.target.value))}
              inputMode="numeric"
              placeholder="000 000 000"
              required
              disabled={!podeGerir || !editando}
            />
          </label>
          <label>
            Morada Completa
            <input
              value={morada}
              onChange={(e) => setMorada(capitalizarPalavras(e.target.value))}
              spellCheck={false}
              disabled={!podeGerir || !editando}
            />
          </label>
          <label>
            Código Postal
            <input
              value={codigoPostal}
              onChange={(e) => setCodigoPostal(formatarCodigoPostal(e.target.value))}
              inputMode="numeric"
              placeholder="0000-000"
              disabled={!podeGerir || !editando}
            />
          </label>
          <CampoListaInteligente
            rotulo="Localidade"
            tabela="localidades"
            empresaId={empresa?.id ?? null}
            valor={localidade}
            aoMudar={setLocalidade}
            desativado={!podeGerir || !editando}
            capitalizar
          />
          <label>
            Telefone / Telemóvel
            <input
              value={telefone}
              onChange={(e) => setTelefone(agrupar3(e.target.value))}
              inputMode="numeric"
              placeholder="000 000 000"
              disabled={!podeGerir || !editando}
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setMensagem(null)
                setEmail(e.target.value.toLowerCase().trim())
              }}
              onBlur={() => {
                if (email && !emailValido(email)) {
                  setEmail('')
                  setMensagem('⚠️ O email não era válido e foi limpo. Volta a escrevê-lo.')
                }
              }}
              inputMode="email"
              placeholder="nome@empresa.pt"
              spellCheck={false}
              disabled={!podeGerir || !editando}
            />
            {email !== '' && !emailValido(email) && (
              <small className="aviso-duplicado">⚠️ Email inválido (ex: nome@empresa.pt).</small>
            )}
          </label>
          <label>
            Website
            <input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://…"
              disabled={!podeGerir || !editando}
            />
          </label>
        </div>

        {mensagem && <div className="mensagem">{mensagem}</div>}

        {podeGerir && editando && (
          <div className="form-botoes">
            <button type="submit" disabled={aGuardar}>
              {aGuardar ? 'A guardar…' : 'Guardar dados'}
            </button>
            <button type="button" className="botao-cancelar" onClick={cancelarEdicao}>
              Cancelar
            </button>
          </div>
        )}
      </form>

      {podeGerir && empresa && <GestaoColaboradores empresaId={empresa.id} />}

      {/* Confirmação antes de gravar as alterações */}
      {mostrarConfirmacao && (
        <div className="modal-fundo" onClick={() => setMostrarConfirmacao(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Guardar alterações?</h3>
            <p>Confirmas que queres guardar os novos dados da empresa?</p>
            <div className="modal-botoes">
              <button
                type="button"
                className="botao-secundario"
                onClick={() => setMostrarConfirmacao(false)}
              >
                Não
              </button>
              <button type="button" className="botao-primario" onClick={confirmarGuardar}>
                Sim, guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
