// Ecrã do Catálogo de Materiais: listar, adicionar, editar e eliminar produtos (com foto).
import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Perfil } from '../contexts/AuthContext'
import { CampoListaInteligente } from './CampoListaInteligente'
import { SeletorFornecedores, type FornecedorSel } from './SeletorFornecedores'
import { formatarValor, valorParaNumero, numeroParaValor } from '../lib/constantes'

type Produto = {
  id: string
  nome: string
  setor: string
  unidade: string
  categoria: string | null
  marca: string | null
  valor_referencia: number | null
  foto_url: string | null
  estado: string
  criado_em: string
  produto_fornecedores?: { valor: number | null; fornecedores: { id: string; nome: string } | null }[]
}

// Nome do "armazém" de imagens no Supabase Storage
const BUCKET_FOTOS = 'produtos'

export function CatalogoProdutos({ perfil }: { perfil: Perfil }) {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [carregando, setCarregando] = useState(true)
  const [aGuardar, setAGuardar] = useState(false)
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false)
  // Modo "adicionar vários": mantém setor/categoria/unidade/marca para o próximo produto
  const [continuarAdicionando, setContinuarAdicionando] = useState(false)

  // Edição e eliminação
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [produtoParaEliminar, setProdutoParaEliminar] = useState<Produto | null>(null)
  const [aEliminar, setAEliminar] = useState(false)

  // Campos do formulário
  const [nome, setNome] = useState('')
  const [setor, setSetor] = useState<string>('')
  const [unidade, setUnidade] = useState<string>('')
  const [categoria, setCategoria] = useState('')
  const [marca, setMarca] = useState('')
  const [valorRef, setValorRef] = useState('')
  const [estado, setEstado] = useState('aprovado')
  const [fornecedoresSel, setFornecedoresSel] = useState<FornecedorSel[]>([])
  const [foto, setFoto] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [fotoUrlExistente, setFotoUrlExistente] = useState<string | null>(null)
  const inputFotoRef = useRef<HTMLInputElement>(null)

  // Filtros da lista
  const [filtroTexto, setFiltroTexto] = useState('')
  const [filtroSetor, setFiltroSetor] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')

  // Sugestões no campo "Produto" (para evitar duplicados)
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false)

  // Quem pode validar o catálogo (escritório nível 4+ ou Super Admin)
  const podeValidar = perfil.nivel_acesso >= 4 || perfil.is_super_admin

  async function carregar() {
    setCarregando(true)
    const { data, error } = await supabase
      .from('produtos')
      .select('*, produto_fornecedores(valor, fornecedores(id, nome))')
      .order('criado_em', { ascending: false })
    if (!error && data) setProdutos(data as Produto[])
    setCarregando(false)
  }

  useEffect(() => {
    carregar()
  }, [])

  // Ao submeter o formulário (já com os campos obrigatórios validados), pedimos confirmação
  function adicionar(evento: FormEvent) {
    evento.preventDefault()
    setMensagem(null)
    if (!setor) {
      setMensagem('⚠️ Escolhe o setor antes de continuar.')
      return
    }
    if (!unidade) {
      setMensagem('⚠️ Escolhe a unidade antes de continuar.')
      return
    }
    if (!categoria) {
      setMensagem('⚠️ Escolhe uma categoria antes de continuar.')
      return
    }
    const termoNome = nome.trim().toLowerCase()
    if (!editandoId && produtos.some((p) => p.nome.trim().toLowerCase() === termoNome)) {
      setMensagem('⚠️ Já existe um produto com este nome. Edita o existente em vez de criar um duplicado.')
      return
    }
    setMostrarConfirmacao(true)
  }

  // Só grava mesmo depois de o utilizador confirmar com "Sim"
  async function guardarProduto() {
    setMostrarConfirmacao(false)
    setAGuardar(true)

    // Por defeito, mantém a foto atual (importante na edição)
    let fotoUrl: string | null = fotoUrlExistente

    // Se foi escolhida uma foto nova, carrega-a para o armazém
    if (foto) {
      const extensao = foto.name.split('.').pop() || 'jpg'
      const caminho = `${perfil.empresa_id}/${crypto.randomUUID()}.${extensao}`
      const { error: erroUpload } = await supabase.storage
        .from(BUCKET_FOTOS)
        .upload(caminho, foto)

      if (erroUpload) {
        setAGuardar(false)
        setMensagem('❌ Não foi possível enviar a foto: ' + erroUpload.message)
        return
      }
      fotoUrl = supabase.storage.from(BUCKET_FOTOS).getPublicUrl(caminho).data.publicUrl
    }

    const dados = {
      nome,
      setor,
      unidade,
      categoria: categoria || null,
      marca: marca || null,
      valor_referencia: valorParaNumero(valorRef),
      foto_url: fotoUrl,
      // Só o escritório pode mudar o estado (validação), e só ao editar
      ...(editandoId && podeValidar ? { estado } : {}),
    }

    let erro = null
    let produtoId: string | null = editandoId
    if (editandoId) {
      // EDITAR produto existente
      const res = await supabase.from('produtos').update(dados).eq('id', editandoId)
      erro = res.error
    } else {
      // ADICIONAR novo produto: escritório aprova logo; colaborador fica pendente
      const res = await supabase
        .from('produtos')
        .insert({
          ...dados,
          empresa_id: perfil.empresa_id,
          estado: podeValidar ? 'aprovado' : 'pendente',
          criado_por: perfil.id,
        })
        .select('id')
        .single()
      erro = res.error
      produtoId = res.data?.id ?? null
    }

    // Sincroniza os fornecedores do produto (relação muitos-para-muitos)
    if (!erro && produtoId) {
      if (editandoId) {
        await supabase.from('produto_fornecedores').delete().eq('produto_id', produtoId)
      }
      if (fornecedoresSel.length > 0) {
        await supabase.from('produto_fornecedores').insert(
          fornecedoresSel.map((s) => ({
            produto_id: produtoId,
            fornecedor_id: s.fornecedor_id,
            empresa_id: perfil.empresa_id,
            valor: s.valor ? Number(s.valor) : null,
          })),
        )
      }
    }

    setAGuardar(false)
    if (erro) {
      setMensagem('❌ Não foi possível guardar: ' + erro.message)
      return
    }

    if (!editandoId && continuarAdicionando) {
      // Lançamento em lote: mantém setor/categoria/unidade/marca; limpa o resto
      setMensagem('✅ Produto adicionado! Pronto para o próximo (mesmo setor/categoria).')
      limparParcial()
    } else {
      setMensagem(editandoId ? '✅ Produto atualizado!' : '✅ Produto adicionado ao catálogo!')
      limparFormulario()
    }
    carregar()
  }

  // Limpeza parcial para lançar vários produtos seguidos no mesmo setor/categoria
  function limparParcial() {
    setNome('')
    setValorRef('')
    setFornecedoresSel([])
    setFotoUrlExistente(null)
    limparFoto()
  }

  function aoEscolherFoto(evento: ChangeEvent<HTMLInputElement>) {
    const ficheiro = evento.target.files?.[0] ?? null
    setFoto(ficheiro)
    setPreviewUrl((anterior) => {
      if (anterior) URL.revokeObjectURL(anterior)
      return ficheiro ? URL.createObjectURL(ficheiro) : null
    })
  }

  function limparFoto() {
    setFoto(null)
    setPreviewUrl((anterior) => {
      if (anterior) URL.revokeObjectURL(anterior)
      return null
    })
    if (inputFotoRef.current) inputFotoRef.current.value = ''
  }

  function limparFormulario() {
    setNome('')
    setSetor('')
    setUnidade('')
    setCategoria('')
    setMarca('')
    setValorRef('')
    setEstado('aprovado')
    setFornecedoresSel([])
    setEditandoId(null)
    setFotoUrlExistente(null)
    limparFoto()
  }

  function iniciarEdicao(p: Produto) {
    setEditandoId(p.id)
    setNome(p.nome)
    setSetor(p.setor)
    setUnidade(p.unidade)
    setCategoria(p.categoria ?? '')
    setMarca(p.marca ?? '')
    setValorRef(numeroParaValor(p.valor_referencia))
    setEstado(p.estado)
    setFornecedoresSel(
      (p.produto_fornecedores ?? [])
        .filter((pf) => pf.fornecedores)
        .map((pf) => ({
          fornecedor_id: pf.fornecedores!.id,
          valor: pf.valor != null ? String(pf.valor) : '',
        })),
    )
    setFotoUrlExistente(p.foto_url)
    limparFoto()
    setMensagem(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function eliminarProduto() {
    if (!produtoParaEliminar) return
    setAEliminar(true)
    const { error } = await supabase.from('produtos').delete().eq('id', produtoParaEliminar.id)
    setAEliminar(false)
    if (error) {
      setMensagem('❌ Não foi possível eliminar: ' + error.message)
      setProdutoParaEliminar(null)
      return
    }
    setMensagem('🗑️ Produto eliminado.')
    if (editandoId === produtoParaEliminar.id) limparFormulario()
    setProdutoParaEliminar(null)
    carregar()
  }

  function escolherSugestao(p: Produto) {
    setMostrarSugestoes(false)
    iniciarEdicao(p)
  }

  // Foto a mostrar na pré-visualização: a nova (se escolhida) ou a já existente (na edição)
  const fotoPreview = previewUrl ?? fotoUrlExistente

  // Categorias e setores existentes (para os filtros)
  const categoriasDistintas = [
    ...new Set(produtos.map((p) => p.categoria).filter(Boolean)),
  ] as string[]
  const setoresDistintos = [...new Set(produtos.map((p) => p.setor).filter(Boolean))] as string[]

  // Só se pode ativar o modo "adicionar vários" com setor, categoria e unidade preenchidos
  const podeLote = !!setor && !!categoria && !!unidade

  // Produtos depois de aplicar os filtros
  const produtosFiltrados = produtos.filter((p) => {
    const okTexto = p.nome.toLowerCase().includes(filtroTexto.trim().toLowerCase())
    const okSetor = !filtroSetor || p.setor === filtroSetor
    const okCategoria = !filtroCategoria || p.categoria === filtroCategoria
    return okTexto && okSetor && okCategoria
  })

  // Sugestões enquanto se escreve o nome do produto
  const termo = nome.trim().toLowerCase()
  const sugestoes = termo
    ? produtos.filter((p) => p.id !== editandoId && p.nome.toLowerCase().includes(termo)).slice(0, 6)
    : []
  const duplicado =
    !editandoId && termo !== '' && produtos.some((p) => p.nome.trim().toLowerCase() === termo)

  return (
    <div className="pagina">
      <h2>Catálogo de Materiais</h2>
      <p className="subtexto">Os produtos que a tua empresa usa nas obras.</p>

      <form className="cartao-form" onSubmit={adicionar}>
        <h3>{editandoId ? 'Editar produto' : 'Adicionar produto'}</h3>
        <div className="grelha-form">
          {/* 1 - Setor */}
          <CampoListaInteligente
            rotulo="Setor"
            tabela="setores"
            empresaId={perfil.empresa_id}
            valor={setor}
            aoMudar={(v) => {
              setSetor(v)
              setCategoria('') // a categoria depende do setor; ao mudar de setor, limpa
            }}
            desativado={continuarAdicionando}
            realce={continuarAdicionando}
            obrigatorio
          />

          {/* 2 - Categoria */}
          <CampoListaInteligente
            rotulo="Categoria"
            tabela="categorias"
            empresaId={perfil.empresa_id}
            valor={categoria}
            aoMudar={setCategoria}
            filtroColuna="setor"
            filtroValor={setor}
            desativado={continuarAdicionando}
            realce={continuarAdicionando}
            exemplo="Cabos"
            obrigatorio
          />

          {/* 3 - Unidade */}
          <CampoListaInteligente
            rotulo="Unidade"
            tabela="unidades"
            empresaId={perfil.empresa_id}
            valor={unidade}
            aoMudar={setUnidade}
            desativado={continuarAdicionando}
            realce={continuarAdicionando}
            obrigatorio
          />

          {/* 4 - Marca */}
          <CampoListaInteligente
            rotulo="Marca"
            tabela="marcas"
            empresaId={perfil.empresa_id}
            valor={marca}
            aoMudar={setMarca}
            desativado={continuarAdicionando}
            realce={continuarAdicionando}
            exemplo="Sika"
          />

          {/* 5 - Produto (nome) com sugestões para evitar duplicados */}
          <label>
            Produto *
            <div className="campo-autocomplete">
              <input
                value={nome}
                onChange={(e) => {
                  setNome(e.target.value)
                  setMostrarSugestoes(true)
                }}
                onFocus={() => setMostrarSugestoes(true)}
                onBlur={() => setTimeout(() => setMostrarSugestoes(false), 150)}
                required
                autoComplete="off"
                placeholder="Ex: Saco de cimento 25kg"
              />
              {mostrarSugestoes && sugestoes.length > 0 && (
                <ul className="sugestoes">
                  {sugestoes.map((s) => (
                    <li key={s.id} onMouseDown={() => escolherSugestao(s)}>
                      {s.foto_url ? (
                        <img className="sugestao-foto" src={s.foto_url} alt="" />
                      ) : (
                        <span className="sugestao-foto sugestao-foto-vazia">—</span>
                      )}
                      <span className="sugestao-nome">{s.nome}</span>
                      <small className="sugestao-setor">{s.setor}</small>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {duplicado && (
              <small className="aviso-duplicado">
                ⚠️ Já existe um produto com este nome.
              </small>
            )}
          </label>

          {/* 6 - Imagem */}
          <div className="campo-foto">
            <span className="rotulo-campo">
              Foto do produto {editandoId ? '(opcional ao editar)' : '*'}
            </span>
            <div className="foto-controlo">
              <label className="botao-foto">
                📷 Escolher / Tirar foto
                <input
                  ref={inputFotoRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  required={!editandoId}
                  className="input-foto-escondido"
                  onChange={aoEscolherFoto}
                />
              </label>
              {fotoPreview ? (
                <img className="previsualizacao-foto" src={fotoPreview} alt="Pré-visualização" />
              ) : (
                <span className="nome-foto">Nenhuma foto escolhida</span>
              )}
            </div>
          </div>

          {/* 7 - Valor */}
          <label>
            Valor de referência (€)
            <input
              value={valorRef}
              onChange={(e) => setValorRef(formatarValor(e.target.value))}
              inputMode="numeric"
              placeholder="Ex: 4,50 (escreve só números)"
            />
          </label>

          {/* 8 - Fornecedores (vários) */}
          <SeletorFornecedores
            empresaId={perfil.empresa_id}
            selecionados={fornecedoresSel}
            aoMudar={setFornecedoresSel}
          />
        </div>

        {/* Caixa de validação — só para quem pode aprovar, ao editar */}
        {editandoId && podeValidar && (
          <div className="caixa-validacao">
            <div className="caixa-validacao-texto">
              <strong>Validação do escritório</strong>
              <span>Marca como aprovado para o produto ficar disponível no catálogo.</span>
            </div>
            <label className="campo-checkbox">
              <input
                type="checkbox"
                checked={estado === 'aprovado'}
                onChange={(e) => setEstado(e.target.checked ? 'aprovado' : 'pendente')}
              />
              Aprovar este produto
            </label>
          </div>
        )}
        {!editandoId && (
          <label
            className={'campo-checkbox campo-checkbox-lote' + (podeLote ? '' : ' campo-lote-inativo')}
          >
            <input
              type="checkbox"
              checked={continuarAdicionando}
              disabled={!podeLote}
              onChange={(e) => setContinuarAdicionando(e.target.checked)}
            />
            Adicionar vários — manter setor, categoria, unidade e marca para o próximo
            {!podeLote && (
              <small> (escolhe primeiro o setor, a categoria e a unidade)</small>
            )}
          </label>
        )}
        {mensagem && <div className="mensagem">{mensagem}</div>}
        <div className="form-botoes">
          <button type="submit" disabled={aGuardar}>
            {aGuardar
              ? 'A guardar…'
              : editandoId
                ? 'Guardar alterações'
                : continuarAdicionando
                  ? 'Adicionar e continuar'
                  : 'Adicionar ao catálogo'}
          </button>
          {editandoId && (
            <button type="button" className="botao-cancelar" onClick={limparFormulario}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="lista">
        <div className="lista-cabecalho">
          <h3>
            Produtos no catálogo ({produtosFiltrados.length}
            {produtosFiltrados.length !== produtos.length ? ` de ${produtos.length}` : ''})
          </h3>
          <div className="filtros">
            <input
              className="filtro-texto"
              placeholder="🔍 Procurar produto…"
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
            />
            <select value={filtroSetor} onChange={(e) => setFiltroSetor(e.target.value)}>
              <option value="">Todos os setores</option>
              {setoresDistintos.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}>
              <option value="">Todas as categorias</option>
              {categoriasDistintas.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
        {carregando ? (
          <p>A carregar…</p>
        ) : produtos.length === 0 ? (
          <p className="vazio">Ainda não há produtos. Adiciona o primeiro acima! 👆</p>
        ) : produtosFiltrados.length === 0 ? (
          <p className="vazio">Nenhum produto corresponde ao filtro.</p>
        ) : (
          <div className="tabela-scroll">
          <table className="tabela">
            <thead>
              <tr>
                <th>Foto</th>
                <th>Produto</th>
                <th>Unidade</th>
                <th>Marca</th>
                <th>Fornecedores</th>
                <th>Valor</th>
                <th>Categoria</th>
                <th>Setor</th>
                <th>Estado</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {produtosFiltrados.map((p) => (
                <tr key={p.id}>
                  <td>
                    {p.foto_url ? (
                      <img className="miniatura" src={p.foto_url} alt={p.nome} />
                    ) : (
                      <span className="miniatura-vazia">—</span>
                    )}
                  </td>
                  <td>{p.nome}</td>
                  <td>{p.unidade}</td>
                  <td>{p.marca ?? '—'}</td>
                  <td>
                    {(p.produto_fornecedores ?? [])
                      .filter((pf) => pf.fornecedores)
                      .map((pf) =>
                        pf.valor != null
                          ? `${pf.fornecedores!.nome} (${pf.valor} €)`
                          : pf.fornecedores!.nome,
                      )
                      .join(', ') || '—'}
                  </td>
                  <td>{p.valor_referencia != null ? `${p.valor_referencia} €` : '—'}</td>
                  <td>{p.categoria ?? '—'}</td>
                  <td>{p.setor}</td>
                  <td>
                    <span className={'badge badge-' + p.estado}>{p.estado}</span>
                  </td>
                  <td>
                    <div className="acoes-celula">
                      <button
                        type="button"
                        className="botao-acao"
                        onClick={() => iniciarEdicao(p)}
                      >
                        ✏️ Editar
                      </button>
                      <button
                        type="button"
                        className="botao-acao botao-acao-perigo"
                        onClick={() => setProdutoParaEliminar(p)}
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Confirmação de adicionar/editar */}
      {mostrarConfirmacao && (
        <div className="modal-fundo" onClick={() => setMostrarConfirmacao(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editandoId ? 'Guardar alterações?' : 'Adicionar este produto?'}</h3>
            <p>
              {editandoId ? (
                <>
                  Confirmas que queres guardar as alterações a <strong>{nome}</strong>?
                </>
              ) : (
                <>
                  Confirmas que queres adicionar <strong>{nome}</strong> ao catálogo?
                </>
              )}
            </p>
            <div className="modal-botoes">
              <button
                type="button"
                className="botao-secundario"
                onClick={() => setMostrarConfirmacao(false)}
              >
                Não
              </button>
              <button type="button" className="botao-primario" onClick={guardarProduto}>
                {editandoId ? 'Sim, guardar' : 'Sim, adicionar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmação de eliminar */}
      {produtoParaEliminar && (
        <div className="modal-fundo" onClick={() => setProdutoParaEliminar(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Eliminar produto?</h3>
            <p>
              Tens a certeza que queres eliminar <strong>{produtoParaEliminar.nome}</strong>? Esta
              ação não pode ser desfeita.
            </p>
            <div className="modal-botoes">
              <button
                type="button"
                className="botao-secundario"
                onClick={() => setProdutoParaEliminar(null)}
              >
                Não
              </button>
              <button
                type="button"
                className="botao-perigo"
                onClick={eliminarProduto}
                disabled={aEliminar}
              >
                {aEliminar ? 'A eliminar…' : 'Sim, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
