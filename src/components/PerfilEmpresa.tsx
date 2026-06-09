// Tela de Perfil da Empresa: dados de identificação, morada, contactos e logótipo.
import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { agrupar3 } from '../lib/constantes'

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
  const inputLogoRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
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
    carregar()
  }, [empresa?.id])

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

  async function guardar(evento: FormEvent) {
    evento.preventDefault()
    if (!empresa) return
    setMensagem(null)
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
    setMensagem('✅ Dados da empresa guardados!')
    recarregarEmpresa()
  }

  if (carregando) return <div className="centro">A carregar…</div>

  return (
    <div className="pagina">
      <h2>Perfil da Empresa</h2>
      <p className="subtexto">Os dados da tua empresa no sistema.</p>

      <form className="cartao-form" onSubmit={guardar}>
        {/* Logótipo */}
        <div className="perfil-logo">
          <div className="perfil-logo-img">
            {logoUrl ? <img src={logoUrl} alt="Logótipo" /> : <span>{nome.charAt(0) || '🏗️'}</span>}
          </div>
          {podeGerir && (
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
            <input value={nome} onChange={(e) => setNome(e.target.value)} required disabled={!podeGerir} />
          </label>
          <label>
            NIF / NIPC *
            <input
              value={nif}
              onChange={(e) => setNif(agrupar3(e.target.value))}
              inputMode="numeric"
              placeholder="000 000 000"
              required
              disabled={!podeGerir}
            />
          </label>
          <label>
            Morada
            <input value={morada} onChange={(e) => setMorada(e.target.value)} disabled={!podeGerir} />
          </label>
          <label>
            Código Postal
            <input
              value={codigoPostal}
              onChange={(e) => setCodigoPostal(e.target.value)}
              placeholder="0000-000"
              disabled={!podeGerir}
            />
          </label>
          <label>
            Localidade
            <input
              value={localidade}
              onChange={(e) => setLocalidade(e.target.value)}
              disabled={!podeGerir}
            />
          </label>
          <label>
            Telefone / Telemóvel
            <input
              value={telefone}
              onChange={(e) => setTelefone(agrupar3(e.target.value))}
              inputMode="numeric"
              placeholder="000 000 000"
              disabled={!podeGerir}
            />
          </label>
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={!podeGerir} />
          </label>
          <label>
            Website
            <input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://…"
              disabled={!podeGerir}
            />
          </label>
        </div>

        {mensagem && <div className="mensagem">{mensagem}</div>}

        {podeGerir && (
          <div className="form-botoes">
            <button type="submit" disabled={aGuardar}>
              {aGuardar ? 'A guardar…' : 'Guardar dados'}
            </button>
          </div>
        )}
      </form>
    </div>
  )
}
