// Ecrã do Super Admin: ver todas as empresas registadas no sistema (SaaS).
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { agrupar3 } from '../lib/constantes'

type EmpresaRegistada = {
  id: string
  nome: string
  segmento: string | null
  nif: string | null
  localidade: string | null
  telefone: string | null
  email: string | null
  website: string | null
  logo_url: string | null
  criado_em: string
  // Contagem de utilizadores (vem da relação com a tabela "perfis")
  perfis?: { count: number }[]
}

export function GestaoEmpresas() {
  const [empresas, setEmpresas] = useState<EmpresaRegistada[]>([])
  const [carregando, setCarregando] = useState(true)
  const [filtroTexto, setFiltroTexto] = useState('')

  async function carregar() {
    setCarregando(true)
    const { data, error } = await supabase
      .from('empresas')
      .select('id, nome, segmento, nif, localidade, telefone, email, website, logo_url, criado_em, perfis(count)')
      .order('criado_em', { ascending: false })
    if (!error && data) setEmpresas(data as EmpresaRegistada[])
    setCarregando(false)
  }

  useEffect(() => {
    carregar()
  }, [])

  function numUtilizadores(e: EmpresaRegistada): number {
    return e.perfis?.[0]?.count ?? 0
  }

  function dataPt(iso: string): string {
    return new Date(iso).toLocaleDateString('pt-PT')
  }

  const empresasFiltradas = empresas.filter((e) =>
    e.nome.toLowerCase().includes(filtroTexto.trim().toLowerCase()),
  )

  return (
    <div className="pagina pagina-larga">
      <h2>Empresas Registadas</h2>
      <p className="subtexto">Todas as empresas que usam o sistema.</p>

      <div className="lista">
        <div className="lista-cabecalho">
          <h3>
            Empresas ({empresasFiltradas.length}
            {empresasFiltradas.length !== empresas.length ? ` de ${empresas.length}` : ''})
          </h3>
          <div className="filtros">
            <input
              className="filtro-texto"
              placeholder="🔍 Procurar empresa…"
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
            />
          </div>
        </div>

        {carregando ? (
          <p>A carregar…</p>
        ) : empresas.length === 0 ? (
          <p className="vazio">Ainda não há empresas registadas.</p>
        ) : empresasFiltradas.length === 0 ? (
          <p className="vazio">Nenhuma empresa corresponde ao filtro.</p>
        ) : (
          <div className="tabela-scroll">
          <table className="tabela">
            <thead>
              <tr>
                <th>Logótipo</th>
                <th>Empresa</th>
                <th>Segmento</th>
                <th>NIF / NIPC</th>
                <th>Localidade</th>
                <th>Telefone</th>
                <th>Email</th>
                <th>Website</th>
                <th>Utilizadores</th>
                <th>Registada em</th>
              </tr>
            </thead>
            <tbody>
              {empresasFiltradas.map((e) => (
                <tr key={e.id}>
                  <td>
                    {e.logo_url ? (
                      <img className="miniatura" src={e.logo_url} alt={e.nome} />
                    ) : (
                      <span className="miniatura-vazia">{e.nome.charAt(0)}</span>
                    )}
                  </td>
                  <td>
                    <strong>{e.nome}</strong>
                  </td>
                  <td>{e.segmento ?? '—'}</td>
                  <td>{e.nif ? agrupar3(e.nif) : '—'}</td>
                  <td>{e.localidade ?? '—'}</td>
                  <td>{e.telefone ? agrupar3(e.telefone) : '—'}</td>
                  <td>{e.email ?? '—'}</td>
                  <td>
                    {e.website ? (
                      <a href={e.website} target="_blank" rel="noreferrer" className="ligacao-mini">
                        {e.website.replace(/^https?:\/\//, '')}
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>{numUtilizadores(e)}</td>
                  <td>{dataPt(e.criado_em)}</td>
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
