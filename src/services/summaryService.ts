import { supabase } from '@/lib/supabase/client'

export interface SummaryData {
  criticas: { count: number; totalValue: number }
  notasFiscais: { count: number; totalValue: number }
  razao: { count: number; totalDebito: number; totalCredito: number }
  extratos: { count: number; totalBalance: number }
}

export const summaryService = {
  async getSummary(): Promise<SummaryData> {
    const [criticas, notas, razao, bancos] = await Promise.all([
      supabase.from('transactions').select('amount'),
      supabase.from('notas_fiscais').select('valor_total, status'),
      supabase.from('razao').select('debito, credito'),
      supabase.from('bancos').select('saldo_atual'),
    ])

    const criticasData = criticas.data || []
    const criticasTotal = criticasData.reduce(
      (sum, t) => sum + Number(t.amount),
      0,
    )

    const notasData = (notas.data || []).filter((n) => n.status !== 'cancelada')
    const notasTotal = notasData.reduce(
      (sum, n) => sum + Number(n.valor_total),
      0,
    )

    const razaoData = razao.data || []
    const razaoDebito = razaoData.reduce((sum, r) => sum + Number(r.debito), 0)
    const razaoCredito = razaoData.reduce(
      (sum, r) => sum + Number(r.credito),
      0,
    )

    const bancosData = bancos.data || []
    const bancosTotal = bancosData.reduce(
      (sum, b) => sum + Number(b.saldo_atual),
      0,
    )

    return {
      criticas: { count: criticasData.length, totalValue: criticasTotal },
      notasFiscais: { count: notasData.length, totalValue: notasTotal },
      razao: {
        count: razaoData.length,
        totalDebito: razaoDebito,
        totalCredito: razaoCredito,
      },
      extratos: { count: bancosData.length, totalBalance: bancosTotal },
    }
  },
}
