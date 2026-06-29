import { supabase } from '@/lib/supabase/client'
import { format } from 'date-fns'

export interface BalanceteItem {
  classificacao: string
  descricao: string
  debito: number
  credito: number
  saldo: number
}

export interface BalanceteData {
  items: BalanceteItem[]
  totalDebito: number
  totalCredito: number
  totalSaldo: number
}

export const balanceteService = {
  async getTrialBalance(
    dateFrom?: Date,
    dateTo?: Date,
    filialId?: string,
  ): Promise<BalanceteData> {
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
      .select('id, classificacao, descricao')

    if (planoError) throw planoError

    const planoMap = new Map<
      number,
      { classificacao: string; descricao: string }
    >()
    for (const p of planoData || []) {
      planoMap.set(p.id, {
        classificacao: p.classificacao || '',
        descricao: p.descricao || p.classificacao || 'Sem descrição',
      })
    }

    const groupMap = new Map<number, BalanceteItem>()
    for (const r of razaoData || []) {
      const pcId = r.plano_conta_id
      if (!pcId) continue
      const plano = planoMap.get(pcId) || {
        classificacao: r.conta,
        descricao: r.conta,
      }
      const existing = groupMap.get(pcId) || {
        classificacao: plano.classificacao,
        descricao: plano.descricao,
        debito: 0,
        credito: 0,
        saldo: 0,
      }
      existing.debito += Number(r.debito)
      existing.credito += Number(r.credito)
      existing.saldo += Number(r.credito) - Number(r.debito)
      groupMap.set(pcId, existing)
    }

    const items = Array.from(groupMap.values()).sort((a, b) =>
      a.classificacao.localeCompare(b.classificacao, undefined, {
        numeric: true,
      }),
    )

    return {
      items,
      totalDebito: items.reduce((s, i) => s + i.debito, 0),
      totalCredito: items.reduce((s, i) => s + i.credito, 0),
      totalSaldo: items.reduce((s, i) => s + i.saldo, 0),
    }
  },
}
