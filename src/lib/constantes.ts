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
