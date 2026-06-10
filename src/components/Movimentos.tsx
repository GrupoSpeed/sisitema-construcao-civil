// Movimentos — lançamento de faturas (contas a pagar). Baseado no modelo do cliente.
// Lançamento independente (qualquer despesa). Classificações = listas inteligentes.
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Perfil } from '../contexts/AuthContext'
import { CampoListaInteligente } from './CampoListaInteligente'

type Projeto = { id: string; nome: string; nr_projeto: string | null; clientes: { nome: string; nig: string | null } | null }
type Fornecedor = { id: string; nome: string }
type Movimento = {
  id: string
  criado_em: string
  numero_fatura: string | null
  centro_custo: string | null
  valor_bruto: number | null
  conta_bancaria: string | null
  fornecedores: { nome: string } | null
  projetos: { nome: string; nr_projeto: string | null } | null
}

const FORM_VAZIO = {
  numero_fatura: '',
  fornecedor_id: '',
  centro_custo: '',
  movimento: '', // Entrada / Saída
  tipo_custo: '', // Fixo / Variável
  projeto_id: '',
  categoria: '',
  tipo_documento: '',
  fornecedor_obs: '',
  data_emissao: '',
  data_vencimento: '',
  valor_liquido: '',
  iva: '',
  metodo_pagamento: '',
  conta_bancaria: '',
  obs: '',
}

function dataPt(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-PT')
}

export function Movimentos({ perfil }: { perfil: Perfil }) {
  const podeUsar = perfil.nivel_acesso >= 4 || perfil.is_super_admin

  const [projetos, setProjetos] = useState<Projeto[]>([])
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [movimentos, setMovimentos] = useState<Movimento[]>([])
  const [carregando, setCarregando] = useState(true)
  const [aGuardar, setAGuardar] = useState(false)
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [form, setForm] = useState({ ...FORM_VAZIO })

  function mudar<K extends keyof typeof FORM_VAZIO>(campo: K, valor: string) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  async function carregar() {
    setCarregando(true)
    const [resProj, resForn, resMov] = await Promise.all([
      supabase.from('projetos').select('id, nome, nr_projeto, clientes(nome, nig)').order('nome'),
      supabase.from('fornecedores').select('id, nome').order('nome'),
      supabase
        .from('movimentos')
        .select(
          'id, criado_em, numero_fatura, centro_custo, valor_bruto, conta_bancaria, fornecedores(nome), projetos(nome, nr_projeto)',
        )
        .order('criado_em', { ascending: false }),
    ])
    if (resProj.data) setProjetos(resProj.data as unknown as Projeto[])
    if (resForn.data) setFornecedores(resForn.data as Fornecedor[])
    if (resMov.data) setMovimentos(resMov.data as unknown as Movimento[])
    setCarregando(false)
  }

  useEffect(() => {
    carregar()
  }, [])

  // Valor Bruto = Líquido + IVA(%)
  const liquido = Number(form.valor_liquido) || 0
  const ivaPct = Number(form.iva) || 0
  const valorBruto = liquido > 0 ? liquido * (1 + ivaPct / 100) : 0

  const projetoSel = projetos.find((p) => p.id === form.projeto_id)

  async function guardar(evento: FormEvent) {
    evento.preventDefault()
    setMensagem(null)
    if (!form.numero_fatura.trim()) {
      setMensagem('⚠️ Indica o número da fatura.')
      return
    }
    setAGuardar(true)
    const { error } = await supabase.from('movimentos').insert({
      empresa_id: perfil.empresa_id,
      criado_por: perfil.id,
      numero_fatura: form.numero_fatura || null,
      fornecedor_id: form.fornecedor_id || null,
      centro_custo: form.centro_custo || null,
      movimento: form.movimento || null,
      tipo_custo: form.tipo_custo || null,
      projeto_id: form.projeto_id || null,
      categoria: form.categoria || null,
      tipo_documento: form.tipo_documento || null,
      fornecedor_obs: form.fornecedor_obs || null,
      data_emissao: form.data_emissao || null,
      data_vencimento: form.data_vencimento || null,
      valor_liquido: form.valor_liquido ? Number(form.valor_liquido) : null,
      iva: form.iva ? Number(form.iva) : null,
      valor_bruto: valorBruto || null,
      obs: form.obs || null,
      metodo_pagamento: form.metodo_pagamento || null,
      conta_bancaria: form.conta_bancaria || null,
    })
    setAGuardar(false)
    if (error) {
      setMensagem('❌ Não foi possível guardar: ' + error.message)
      return
    }
    setMensagem('✅ Movimento guardado!')
    setForm({ ...FORM_VAZIO })
    carregar()
  }

  if (!podeUsar) {
    return (
      <div className="pagina">
        <h2>Movimentos</h2>
        <p className="vazio">Sem acesso — esta área é do escritório (nível 4+).</p>
      </div>
    )
  }

  return (
    <div className="pagina pagina-larga">
      <h2>Movimentos</h2>
      <p className="subtexto">Lançamento de faturas e despesas.</p>

      <form className="cartao-form" onSubmit={guardar}>
        {/* Colaborador */}
        <h3>Colaborador</h3>
        <div className="grelha-form">
          <label>
            Data de registo
            <input value={new Date().toLocaleDateString('pt-PT')} disabled />
          </label>
          <label>
            Colaborador
            <input value={perfil.nome ?? '—'} disabled />
          </label>
        </div>

        {/* Dados da Fatura */}
        <h3 className="seccao-form">Dados da fatura</h3>
        <div className="grelha-form">
          <label>
            Número da fatura *
            <input value={form.numero_fatura} onChange={(e) => mudar('numero_fatura', e.target.value)} required />
          </label>
          <label>
            Fornecedor
            <select value={form.fornecedor_id} onChange={(e) => mudar('fornecedor_id', e.target.value)}>
              <option value="">(escolher)</option>
              {fornecedores.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Dados Contabilísticos */}
        <h3 className="seccao-form">Dados contabilísticos</h3>
        <div className="grelha-form">
          <CampoListaInteligente rotulo="Centro de custo" tabela="centros_custo" empresaId={perfil.empresa_id} valor={form.centro_custo} aoMudar={(v) => mudar('centro_custo', v)} />
          <label>
            Movimento
            <select value={form.movimento} onChange={(e) => mudar('movimento', e.target.value)}>
              <option value="">(escolher)</option>
              <option value="Entrada">Entrada</option>
              <option value="Saída">Saída</option>
            </select>
          </label>
          <label>
            Tipo de custo
            <select
              value={form.tipo_custo}
              onChange={(e) => {
                mudar('tipo_custo', e.target.value)
                mudar('categoria', '') // a categoria depende do tipo de custo
              }}
            >
              <option value="">(escolher)</option>
              <option value="Fixo">Fixo</option>
              <option value="Variável">Variável</option>
            </select>
          </label>
        </div>

        {/* Lançamento do Documento */}
        <h3 className="seccao-form">Lançamento do documento</h3>
        <div className="grelha-form">
          <label>
            Projeto
            <select value={form.projeto_id} onChange={(e) => mudar('projeto_id', e.target.value)}>
              <option value="">(escolher)</option>
              {projetos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nr_projeto ? `${p.nr_projeto} — ${p.nome}` : p.nome}
                </option>
              ))}
            </select>
          </label>
          <label>
            Cliente do projeto
            <input value={projetoSel?.clientes?.nome ?? '—'} disabled />
          </label>
          <CampoListaInteligente rotulo="Categoria" tabela="categorias_mov" empresaId={perfil.empresa_id} valor={form.categoria} aoMudar={(v) => mudar('categoria', v)} filtroColuna="tipo" filtroValor={form.tipo_custo} />
          <CampoListaInteligente rotulo="Tipo de documento" tabela="tipos_documento" empresaId={perfil.empresa_id} valor={form.tipo_documento} aoMudar={(v) => mudar('tipo_documento', v)} />
          <label>
            Fornecedor / Obs
            <input value={form.fornecedor_obs} onChange={(e) => mudar('fornecedor_obs', e.target.value)} />
          </label>
          <label>
            Data de emissão
            <input type="date" value={form.data_emissao} onChange={(e) => mudar('data_emissao', e.target.value)} />
          </label>
          <label>
            Data de vencimento
            <input type="date" value={form.data_vencimento} onChange={(e) => mudar('data_vencimento', e.target.value)} />
          </label>
          <label>
            Valor líquido (€)
            <input type="number" step="0.01" value={form.valor_liquido} onChange={(e) => mudar('valor_liquido', e.target.value)} />
          </label>
          <label>
            IVA (%)
            <input type="number" step="0.01" value={form.iva} onChange={(e) => mudar('iva', e.target.value)} placeholder="Ex: 23" />
          </label>
          <label>
            Valor bruto (€)
            <input value={valorBruto ? valorBruto.toFixed(2) : ''} disabled placeholder="(automático)" />
          </label>
        </div>

        {/* Pagamento (os pagamentos — total/parcial e "pronto pagamento" — entram na próxima etapa) */}
        <h3 className="seccao-form">Pagamento</h3>
        <div className="grelha-form">
          <label>
            Método de pagamento
            <select value={form.metodo_pagamento} onChange={(e) => mudar('metodo_pagamento', e.target.value)}>
              <option value="">(escolher)</option>
              <option value="Dinheiro">Dinheiro</option>
              <option value="Cartão">Cartão</option>
              <option value="Transferência">Transferência</option>
              <option value="Outros">Outros</option>
            </select>
          </label>
          <CampoListaInteligente rotulo="Conta bancária" tabela="contas_bancarias" empresaId={perfil.empresa_id} valor={form.conta_bancaria} aoMudar={(v) => mudar('conta_bancaria', v)} />
          <label>
            Observação
            <input value={form.obs} onChange={(e) => mudar('obs', e.target.value)} />
          </label>
        </div>

        {mensagem && <div className="mensagem">{mensagem}</div>}
        <div className="form-botoes">
          <button type="submit" disabled={aGuardar}>
            {aGuardar ? 'A guardar…' : 'Guardar movimento'}
          </button>
          <button type="button" className="botao-cancelar" onClick={() => setForm({ ...FORM_VAZIO })}>
            Limpar
          </button>
        </div>
      </form>

      {/* Lista de movimentos */}
      <div className="lista">
        <div className="lista-cabecalho">
          <h3>Movimentos ({movimentos.length})</h3>
        </div>
        {carregando ? (
          <p>A carregar…</p>
        ) : movimentos.length === 0 ? (
          <p className="vazio">Ainda não há movimentos lançados.</p>
        ) : (
          <div className="tabela-scroll">
            <table className="tabela">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Nº Fatura</th>
                  <th>Fornecedor</th>
                  <th>Projeto</th>
                  <th>Centro de Custo</th>
                  <th>Valor Bruto</th>
                  <th>Conta</th>
                </tr>
              </thead>
              <tbody>
                {movimentos.map((m) => (
                  <tr key={m.id}>
                    <td>{dataPt(m.criado_em)}</td>
                    <td>{m.numero_fatura ?? '—'}</td>
                    <td>{m.fornecedores?.nome ?? '—'}</td>
                    <td>
                      {m.projetos
                        ? m.projetos.nr_projeto
                          ? `${m.projetos.nr_projeto} — ${m.projetos.nome}`
                          : m.projetos.nome
                        : '—'}
                    </td>
                    <td>{m.centro_custo ?? '—'}</td>
                    <td>{m.valor_bruto != null ? `${m.valor_bruto} €` : '—'}</td>
                    <td>{m.conta_bancaria ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
