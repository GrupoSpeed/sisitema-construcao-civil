// Rodapé fixo e discreto: direitos + botões de ícone (proteção de dados abre uma janela).
import { useState } from 'react'

export function RodaPe() {
  const ano = new Date().getFullYear()
  const [mostrarPrivacidade, setMostrarPrivacidade] = useState(false)

  return (
    <>
      <footer className="rodape">
        <span className="rodape-marca">🏗️ Sistema Grupo Speed · © {ano}</span>
        <div className="rodape-acoes">
          <button
            type="button"
            className="rodape-icone"
            title="Proteção de dados (RGPD)"
            aria-label="Proteção de dados"
            onClick={() => setMostrarPrivacidade(true)}
          >
            🔒
          </button>
        </div>
      </footer>

      {mostrarPrivacidade && (
        <div className="modal-fundo" onClick={() => setMostrarPrivacidade(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>🔒 Proteção de dados (RGPD)</h3>
            <p>
              O Sistema Grupo Speed trata os dados pessoais de acordo com o <strong>RGPD</strong>
              (Regulamento Geral de Proteção de Dados). Em resumo:
            </p>
            <ul className="lista-legal">
              <li>Os dados são usados apenas para o funcionamento do sistema (gestão da empresa, obras e materiais).</li>
              <li>Cada empresa só acede aos seus próprios dados.</li>
              <li>Os dados não são partilhados com terceiros sem autorização.</li>
              <li>Pode pedir a consulta, correção ou eliminação dos seus dados a qualquer momento.</li>
            </ul>
            <div className="modal-botoes">
              <button
                type="button"
                className="botao-primario"
                onClick={() => setMostrarPrivacidade(false)}
              >
                Percebi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
