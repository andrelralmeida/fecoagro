import { supabase } from '@/lib/supabase/client'
import { ComboboxFilterState } from '@/components/ComboboxFilter'
import { Transacao, TipoTransacao, FormaPagamento, Role } from '@/lib/types'
import { format } from 'date-fns'

const mapToTransacao = (row: any): Transacao => ({
  id: row.id,
  data: new Date(row.date),
  descricao: row.description,
  valor: Number(row.amount),
  categoria_id: row.category,
  tipo_id: row.type as TipoTransacao | undefined,
  forma_pagamento_id: row.payment_method as FormaPagamento,
  observacoes: row.notes,
  centro_custo_id: row.centro_custo_id || undefined,
  atividade_id: row.atividade_id || undefined,
  plano_conta_id: row.plano_conta_id || undefined,
  nota_fiscal_id: row.nota_fiscal_id || undefined,
  reconciled: row.reconciled || false,
})

const mapToRow = (transaction: Omit<Transacao, 'id'>, userId: string) => ({
  user_id: userId,
  date: format(transaction.data, 'yyyy-MM-dd'),
  description: transaction.descricao,
  amount: transaction.valor,
  category: transaction.categoria_id || 'Geral',
  type: transaction.tipo_id || null,
  payment_method: transaction.forma_pagamento_id || 'Conta Corrente',
  notes: transaction.observacoes,
  centro_custo_id: transaction.centro_custo_id || null,
  atividade_id: transaction.atividade_id || null,
  plano_conta_id: transaction.plano_conta_id || null,
  nota_fiscal_id: transaction.nota_fiscal_id || null,
})

const textColumns = ['description', 'notes', 'type']

export const transactionService = {
  async fetchTransactions(filters: ComboboxFilterState, role: Role) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    let query = supabase.from('critica').select('*')

    if (role === 'visitante') return []

    if (role === 'colaborador') {
      query = query
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(1)
    }

    if (role === 'admin') {
      if (filters.column && filters.value) {
        if (textColumns.includes(filters.column)) {
          query = query.ilike(filters.column, `%${filters.value}%`)
        } else {
          query = query.eq(filters.column, filters.value)
        }
      }
      if (filters.dateRange?.from) {
        query = query.gte('date', format(filters.dateRange.from, 'yyyy-MM-dd'))
        if (filters.dateRange.to) {
          query = query.lte('date', format(filters.dateRange.to, 'yyyy-MM-dd'))
        }
      }
      query = query.order('date', { ascending: false })
    }

    const { data, error } = await query
    if (error) throw error
    return data.map(mapToTransacao)
  },

  async createTransaction(transaction: Omit<Transacao, 'id'>) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const dbRow = mapToRow(transaction, user.id)
    const { data, error } = await supabase
      .from('critica')
      .insert(dbRow)
      .select()
      .single()
    if (error) throw error
    return mapToTransacao(data)
  },

  async updateTransaction(id: string, transaction: Partial<Transacao>) {
    const updates: any = {}
    if (transaction.data) updates.date = format(transaction.data, 'yyyy-MM-dd')
    if (transaction.descricao) updates.description = transaction.descricao
    if (transaction.valor !== undefined) updates.amount = transaction.valor
    if (transaction.categoria_id) updates.category = transaction.categoria_id
    if (transaction.tipo_id) updates.type = transaction.tipo_id
    if (transaction.forma_pagamento_id)
      updates.payment_method = transaction.forma_pagamento_id
    if (transaction.observacoes !== undefined)
      updates.notes = transaction.observacoes
    if (transaction.centro_custo_id !== undefined)
      updates.centro_custo_id = transaction.centro_custo_id || null
    if (transaction.atividade_id !== undefined)
      updates.atividade_id = transaction.atividade_id || null
    if (transaction.plano_conta_id !== undefined)
      updates.plano_conta_id = transaction.plano_conta_id || null
    if (transaction.nota_fiscal_id !== undefined)
      updates.nota_fiscal_id = transaction.nota_fiscal_id || null
    if (transaction.reconciled !== undefined)
      updates.reconciled = transaction.reconciled

    const { data, error } = await supabase
      .from('critica')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return mapToTransacao(data)
  },

  async deleteTransaction(id: string) {
    const { error } = await supabase.from('critica').delete().eq('id', id)
    if (error) throw error
  },
}
