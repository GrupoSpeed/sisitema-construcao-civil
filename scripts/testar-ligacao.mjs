// Teste rápido de ligação ao Supabase.
// Lê os códigos do .env e tenta ler a tabela "empresas".
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

// Lê o ficheiro .env (este teste corre fora do Vite, por isso lemos à mão)
const env = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split('\n')
    .filter((linha) => linha.includes('=') && !linha.trim().startsWith('#'))
    .map((linha) => {
      const i = linha.indexOf('=')
      return [linha.slice(0, i).trim(), linha.slice(i + 1).trim()]
    }),
)

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)

const { data, error } = await supabase.from('empresas').select('*').limit(1)

if (error) {
  console.error('❌ Falhou a ligação ou a tabela não existe. Detalhe:', error.message)
  process.exit(1)
}

console.log('✅ Ligação OK! A tabela "empresas" existe e respondeu.')
console.log(`   Linhas devolvidas: ${data.length} (0 é o esperado — está vazia e protegida pela segurança).`)
