// Listas fixas usadas no sistema (decisões M4 e M5).

// Setores dos materiais
export const SETORES = [
  'Elétrica',
  'Hidráulica',
  'Pintura',
  'Construção Civil',
  'Gesso Cartonado',
  'Carpintaria',
  'Capoto',
  'Cobertura/Impermeabilização',
  'Ar Condicionado',
  'Demolição',
  'Ferramentas',
  'Diversos',
] as const

// Unidades de medida
export const UNIDADES = ['Uni', 'M', 'M²', 'M³', 'Kg', 'Lt', 'Rolo', 'Saco'] as const

// Agrupa dígitos de 3 em 3 com espaços (ex: 123456789 -> "123 456 789")
export function agrupar3(texto: string): string {
  const digitos = texto.replace(/\D/g, '')
  return digitos.replace(/(\d{3})(?=\d)/g, '$1 ')
}

// Põe a 1ª letra de cada palavra em maiúscula (ex: "ponte de lima" -> "Ponte De Lima")
export function capitalizarPalavras(texto: string): string {
  return texto
    .toLowerCase()
    .replace(/(^|\s)\p{L}/gu, (letra) => letra.toUpperCase())
}

// Formata o código postal português: 4 dígitos + "-" + 3 dígitos (ex: 1234-567)
export function formatarCodigoPostal(texto: string): string {
  const digitos = texto.replace(/\D/g, '').slice(0, 7)
  if (digitos.length <= 4) return digitos
  return digitos.slice(0, 4) + '-' + digitos.slice(4)
}

// Verifica se um email tem um formato válido (ex: nome@empresa.pt).
// O domínio são "etiquetas" separadas por UM ponto — não permite pontos seguidos (empresa..pt).
export function emailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(email.trim())
}

// Valida a palavra-passe provisória. Devolve uma mensagem de erro, ou null se estiver boa.
// Regra: exatamente 8 números (pode ser a data de nascimento, ex: 01012000).
export function validarPasswordProvisoria(password: string): string | null {
  if (!/^[0-9]{8}$/.test(password))
    return 'A palavra-passe provisória tem de ter exatamente 8 números (ex: a data de nascimento, 01012000).'
  return null
}

// Cargos por nível de acesso (1 a 9)
export const CARGOS: Record<number, string> = {
  1: 'Colaborador Básico',
  2: 'Colaborador Completo',
  3: 'Encarregado',
  4: 'Assistente Administrativo',
  5: 'Gestor de Obra',
  6: 'Gestor Financeiro',
  7: 'Diretor / Sócio',
  8: 'Admin Empresa',
  9: 'Super Admin',
}

// Explicação de cada nível DISPONÍVEL AGORA (para o quadro ilustrativo dos colaboradores).
// Mostramos só os níveis necessários para os módulos já construídos.
// À medida que o projeto evolui, acrescentamos aqui os que faltam:
//   5 Gestor de Obra, 6 Gestor Financeiro, 7 Diretor/Sócio (ver CARGOS).
// O nível 9 (Super Admin) é só o dono do SaaS e não entra nesta lista.
export const NIVEIS_INFO: { nivel: number; descricao: string; exemplo: string }[] = [
  { nivel: 1, descricao: 'Só marca o ponto (entrada e saída). Sem acesso aos outros módulos.', exemplo: 'Ajudante, servente' },
  { nivel: 2, descricao: 'Além do ponto: solicita materiais e cria produtos no catálogo.', exemplo: 'Oficial, pedreiro' },
  { nivel: 3, descricao: 'Aprova ou rejeita os pedidos de material.', exemplo: 'Encarregado, chefe de equipa' },
  { nivel: 4, descricao: 'Escritório: valida as compras antes do financeiro.', exemplo: 'Administrativo' },
  { nivel: 8, descricao: 'Gere os utilizadores e os dados da empresa.', exemplo: 'Dono da empresa' },
]
