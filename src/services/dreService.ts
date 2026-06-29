import { supabase } from '@/lib/supabase/client'
import { format } from 'date-fns'

export interface DREItem {
  classificacao: string
  descricao: string
  valor: number
}

export interface DREData {
  receitas: DREItem[]
  despesas: DREItem[]
  totalReceitas: number
  totalDespesas: number
  resultadoLiquido: number
}

export const dreService = {
  async getDRE(
    dateFrom?: Date,
    dateTo?: Date,
    filialId?: string,
  ): Promise<DREData> {
    let query = supabase
      .from('razao')
      .select('conta, historico, debito, credito, plano_conta_id, data')

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

    const receitasMap = new Map<number, DREItem>()
    const despesasMap = new Map<number, DREItem>()

    for (const r of razaoData || []) {
      const pcId = r.plano_conta_id
      if (!pcId) continue
      const plano = planoMap.get(pcId) || {
        classificacao: r.conta,
        descricao: r.conta,
      }
      const credito = Number(r.credito)
      const debito = Number(r.debito)

      if (credito > 0) {
        const existing = receitasMap.get(pcId) || {
          classificacao: plano.classificacao,
          descricao: plano.descricao,
          valor: 0,
        }
        existing.valor += credito
        receitasMap.set(pcId, existing)
      }
      if (debito > 0) {
        const existing = despesasMap.get(pcId) || {
          classificacao: plano.classificacao,
          descricao: plano.descricao,
          valor: 0,
        }
        existing.valor += debito
        despesasMap.set(pcId, existing)
      }
    }

    const receitas = Array.from(receitasMap.values()).sort((a, b) =>
      a.classificacao.localeCompare(b.classificacao, undefined, {
        numeric: true,
      }),
    )
    const despesas = Array.from(despesasMap.values()).sort((a, b) =>
      a.classificacao.localeCompare(b.classificacao, undefined, {
        numeric: true,
      }),
    )

    const totalReceitas = receitas.reduce((s, i) => s + i.valor, 0)
    const totalDespesas = despesas.reduce((s, i) => s + i.valor, 0)

    return {
      receitas,
      despesas,
      totalReceitas,
      totalDespesas,
      resultadoLiquido: totalReceitas - totalDespesas,
    }
  },
}
