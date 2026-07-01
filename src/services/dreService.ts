import { supabase } from '@/lib/supabase/client'
import { format } from 'date-fns'
import {
  buildAccountTree,
  filterTreeWithMovement,
  FinancialTreeNode,
} from '@/lib/account-utils'

export interface DREData {
  receitasTree: FinancialTreeNode[]
  despesasTree: FinancialTreeNode[]
  totalReceitas: number
  totalDespesas: number
  resultadoLiquido: number
}

interface AccountAggregate {
  id: number
  classificacao: string
  descricao: string
  natureza: string | null
  debito: number
  credito: number
  saldo: number
}

export const dreService = {
  async getDRE(
    dateFrom?: Date,
    dateTo?: Date,
    filialId?: string,
  ): Promise<DREData> {
    let query = supabase
      .from('razao')
      .select('conta, historico, debito, credito, saldo, plano_conta_id, data')

    if (filialId) query = query.eq('filial_id', filialId)
    if (dateFrom) query = query.gte('data', format(dateFrom, 'yyyy-MM-dd'))
    if (dateTo) query = query.lte('data', format(dateTo, 'yyyy-MM-dd'))

    const { data: razaoData, error } = await query
    if (error) throw error

    const { data: planoData, error: planoError } = await supabase
      .from('plano_contas')
      .select('id, classificacao, descricao, natureza')
    if (planoError) throw planoError

    const receitasMap = new Map<number, AccountAggregate>()
    const despesasMap = new Map<number, AccountAggregate>()

    for (const p of planoData || []) {
      const prefix = (p.classificacao || '').charAt(0)
      const acc: AccountAggregate = {
        id: p.id,
        classificacao: p.classificacao || '',
        descricao: p.descricao || '',
        natureza: p.natureza,
        debito: 0,
        credito: 0,
        saldo: 0,
      }
      if (prefix === '3') receitasMap.set(p.id, acc)
      else if (prefix === '4') despesasMap.set(p.id, acc)
    }

    for (const r of razaoData || []) {
      if (!r.plano_conta_id) continue
      const recAcc = receitasMap.get(r.plano_conta_id)
      const desAcc = despesasMap.get(r.plano_conta_id)
      if (recAcc) {
        recAcc.debito += Number(r.debito)
        recAcc.credito += Number(r.credito)
        recAcc.saldo += Number(r.credito) - Number(r.debito)
      }
      if (desAcc) {
        desAcc.debito += Number(r.debito)
        desAcc.credito += Number(r.credito)
        desAcc.saldo += Number(r.credito) - Number(r.debito)
      }
    }

    const receitasTree = filterTreeWithMovement(
      buildAccountTree(Array.from(receitasMap.values())),
    )
    const despesasTree = filterTreeWithMovement(
      buildAccountTree(Array.from(despesasMap.values())),
    )

    const totalReceitas = receitasTree.reduce((s, n) => s + n.saldo, 0)
    const totalDespesasRaw = despesasTree.reduce((s, n) => s + n.saldo, 0)
    const totalDespesas = Math.abs(totalDespesasRaw)

    return {
      receitasTree,
      despesasTree,
      totalReceitas,
      totalDespesas,
      resultadoLiquido: totalReceitas - totalDespesas,
    }
  },
}
