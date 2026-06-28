import { supabase } from '@/lib/supabase/client'
import { Transacao } from '@/lib/types'
import { ComboboxFilterState } from '@/components/ComboboxFilter'
import { format } from 'date-fns'

export async function fetchTransactions(
  filters: ComboboxFilterState,
): Promise<Transacao[]> {
  let query = supabase.from('critica').select('*')

  if (filters.column && filters.value) {
    if (filters.column === 'historico') {
      query = query.or(
        `historico.ilike.%${filters.value}%,description.ilike.%${filters.value}%`,
      )
    } else if (filters.column === 'status') {
      query = query.eq('status', filters.value)
    } else {
      query = query.ilike(filters.column, `%${filters.value}%`)
    }
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
