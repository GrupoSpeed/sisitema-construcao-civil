// Seletor de Cliente (mini-CRM): escolher um cliente existente ou criar um novo (NIG + nome).
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { capitalizarPalavras } from '../lib/constantes'

type Cliente = { id: string; nig: string | null; nome: string }

type Props = {
  empresaId: string | null
  valor: string // cliente_id selecionado (ou '')
  aoMudar: (clienteId: string) => void
  desativado?: boolean
}

export function SeletorCliente({ empresaId, valor, aoMudar, desativado = false }: Props) {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [aCriarNovo, setACriarNovo] = useState(false)
  const [novoNome, setNovoNome] = useState('')
  const [novoNig, setNovoNig] = useState('')
  const [aGuardar, setAGuardar] = useState(false)

  async function carregar() {
    const { data } = await supabase.from('clientes').select('id, nig, nome').order('nome')
    if (data) setClientes(data as Cliente[])
  }

  useEffect(() => {
    carregar()
  }, [])

  async function adicionarNovo() {
    const nome = capitalizarPalavras(novoNome.trim())
    if (!nome) return
    setAGuardar(true)
    const { data, error } = await supabase
      .from('clientes')
      .insert({ empresa_id: empresaId, nome, nig: novoNig.trim() || null })
      .select('id, nig, nome')
      .single()
    setAGuardar(false)
    if (!error && data) {
      await carregar()
      aoMudar(data.id)
      setNovoNome('')
      setNovoNig('')
      setACriarNovo(false)
    }
  }

  return (
    <label>
      Cliente
      {aCriarNovo ? (
        <div className="cliente-novo">
          <input
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            placeholder="Nome do cliente"
            spellCheck={false}
            autoFocus
          />
          <input
            value={novoNig}
            onChange={(e) => setNovoNig(e.target.value)}
            placeholder="NIG (opcional)"
            className="cliente-novo-nig"
          />
          <button type="button" className="botao-mini" onClick={adicionarNovo} disabled={aGuardar}>
            {aGuardar ? '…' : 'Adicionar'}
          </button>
          <button type="button" className="botao-mini-cinza" onClick={() => setACriarNovo(false)}>
            ✕
          </button>
        </div>
      ) : (
        <select
          value={valor}
          disabled={desativado}
          onChange={(e) => {
            if (e.target.value === '__novo__') setACriarNovo(true)
            else aoMudar(e.target.value)
          }}
        >
          <option value="">(escolher)</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
              {c.nig ? ` (${c.nig})` : ''}
            </option>
          ))}
          <option value="__novo__">➕ Novo cliente…</option>
        </select>
      )}
    </label>
  )
}
