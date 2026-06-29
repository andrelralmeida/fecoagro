import { supabase } from '@/lib/supabase/client'

export interface SearchResult {
  id: string | number
  type: 'critica' | 'notas_fiscais' | 'razao' | 'extratos_bancarios'
  title: string
  subtitle: string
  amount: number | null
  date: string | null
  route: string
}

export async function globalSearch(query: string): Promise<SearchResult[]> {
  if (!query || query.trim().length < 2) return []

  const term = query.trim()
  const results: SearchResult[] = []

  const [criticaRes, notasRes, razaoRes, extratosRes] = await Promise.all([
    supabase
      .from('critica')
      .select('id, historico, amount, date, status')
      .ilike('historico', `%${term}%`)
      .limit(10),
    supabase
      .from('notas_fiscais')
      .select('id, fornecedor, numero_nota, data_emissao, valor_total, status')
      .ilike('fornecedor', `%${term}%`)
      .limit(10),
    supabase
      .from('razao')
      .select('id, historico, conta, data, debito, credito')
      .or(`historico.ilike.%${term}%,conta.ilike.%${term}%`)
      .limit(10),
    supabase
      .from('extratos_bancarios')
      .select('id, descricao, valor, data, tipo')
      .ilike('descricao', `%${term}%`)
      .limit(10),
  ])

  if (criticaRes.data) {
    for (const row of criticaRes.data) {
      results.push({
        id: row.id,
        type: 'critica',
        title: row.historico || 'Sem histórico',
        subtitle: 'Crítica Contábil',
        amount: row.amount,
        date: row.date,
        route: '/critica',
      })
    }
  }

  if (notasRes.data) {
    for (const row of notasRes.data) {
      results.push({
        id: row.id,
        type: 'notas_fiscais',
        title: row.fornecedor || 'Sem fornecedor',
        subtitle: `Nota Fiscal #${row.numero_nota}`,
        amount: row.valor_total,
        date: row.data_emissao,
        route: '/notas-fiscais',
      })
    }
  }

  if (razaoRes.data) {
    for (const row of razaoRes.data) {
      results.push({
        id: row.id,
        type: 'razao',
        title: row.historico || row.conta || 'Sem histórico',
        subtitle: `Razão — ${row.conta}`,
        amount: row.debito || row.credito || null,
        date: row.data,
        route: '/razao',
      })
    }
  }

  if (extratosRes.data) {
    for (const row of extratosRes.data) {
      results.push({
        id: row.id,
        type: 'extratos_bancarios',
        title: row.descricao || 'Sem descrição',
        subtitle: 'Extrato Bancário',
        amount: row.valor,
        date: row.data,
        route: '/extratos',
      })
    }
  }

  return results
}
