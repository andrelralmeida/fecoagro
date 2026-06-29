import { supabase } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { Transacao } from '@/lib/types'
import { CriticaFilterState } from '@/components/critica/CriticaFilters'

export async function fetchTransactions(
  filters: CriticaFilterState,
): Promise<Transacao[]> {
  let query = supabase.from('critica').select('*')

  if (filters.historico) {
    query = query.ilike('historico', `%${filters.historico}%`)
  }
  if (filters.atividade_id) {
    query = query.eq('atividade_id', Number(filters.atividade_id))
  }
  if (filters.centro_custo_id) {
    query = query.eq('centro_custo_id', Number(filters.centro_custo_id))
  }
  if (filters.plano_conta_id) {
    query = query.eq('plano_conta_id', Number(filters.plano_conta_id))
  }
  if (filters.nota_fiscal_id) {
    query = query.eq('nota_fiscal_id', Number(filters.nota_fiscal_id))
  }
  if (filters.filial_id) {
    query = query.eq('filial_id', Number(filters.filial_id))
  }
  if (filters.status) {
    query = query.eq('status', filters.status)
  }
  if (filters.dateRange?.from) {
    query = query.gte('date', format(filters.dateRange.from, 'yyyy-MM-dd'))
  }
  if (filters.dateRange?.to) {
    query = query.lte('date', format(filters.dateRange.to, 'yyyy-MM-dd'))
  }

  query = query.order('created_at', { ascending: false })

  const { data, error } = await query
  if (error) throw error
  return (data || []) as Transacao[]
}
