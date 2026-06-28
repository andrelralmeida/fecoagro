import { supabase } from '@/lib/supabase/client'
import { format } from 'date-fns'

export interface ExecutiveKPIs {
  totalNotasFiscais: number
  countNotasFiscais: number
  totalCriticas: number
  countCriticas: number
  totalDebito: number
  totalCredito: number
  countRazao: number
  saldoBancario: number
  countBancos: number
}

export interface MonthlyNotaData {
  month: string
  total: number
  count: number
}

export interface SupplierVolumeData {
  fornecedor: string
  total: number
  count: number
  percentage: number
}

export const executiveDashboardService = {
  async getKPIs(dateFrom?: Date, dateTo?: Date): Promise<ExecutiveKPIs> {
    const fromStr = dateFrom ? format(dateFrom, 'yyyy-MM-dd') : undefined
    const toStr = dateTo ? format(dateTo, 'yyyy-MM-dd') : undefined

    let notasQuery = supabase.from('notas_fiscais').select('valor_total')
    if (fromStr) notasQuery = notasQuery.gte('data_emissao', fromStr)
    if (toStr) notasQuery = notasQuery.lte('data_emissao', toStr)

    let criticasQuery = supabase.from('critica').select('amount')
    if (fromStr) criticasQuery = criticasQuery.gte('date', fromStr)
    if (toStr) criticasQuery = criticasQuery.lte('date', toStr)

    let razaoQuery = supabase.from('razao').select('debito, credito')
    if (fromStr) razaoQuery = razaoQuery.gte('data', fromStr)
    if (toStr) razaoQuery = razaoQuery.lte('data', toStr)

    const bancosQuery = supabase.from('bancos').select('saldo_atual')

    const [notas, criticas, razao, bancos] = await Promise.all([
      notasQuery,
      criticasQuery,
      razaoQuery,
      bancosQuery,
    ])

    const notasData = notas.data || []
    const criticasData = criticas.data || []
    const razaoData = razao.data || []
    const bancosData = bancos.data || []

    return {
      totalNotasFiscais: notasData.reduce(
        (s, n) => s + Number(n.valor_total),
        0,
      ),
      countNotasFiscais: notasData.length,
      totalCriticas: criticasData.reduce((s, c) => s + Number(c.amount), 0),
      countCriticas: criticasData.length,
      totalDebito: razaoData.reduce((s, r) => s + Number(r.debito), 0),
      totalCredito: razaoData.reduce((s, r) => s + Number(r.credito), 0),
      countRazao: razaoData.length,
      saldoBancario: bancosData.reduce((s, b) => s + Number(b.saldo_atual), 0),
      countBancos: bancosData.length,
    }
  },

  async getMonthlyNotas(
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<MonthlyNotaData[]> {
    const fromStr = dateFrom ? format(dateFrom, 'yyyy-MM-dd') : undefined
    const toStr = dateTo ? format(dateTo, 'yyyy-MM-dd') : undefined

    let query = supabase
      .from('notas_fiscais')
      .select('data_emissao, valor_total')
      .order('data_emissao', { ascending: true })
    if (fromStr) query = query.gte('data_emissao', fromStr)
    if (toStr) query = query.lte('data_emissao', toStr)

    const { data, error } = await query
    if (error) throw error

    const monthMap = new Map<string, { total: number; count: number }>()
    for (const row of data || []) {
      const monthKey = (row.data_emissao as string).substring(0, 7)
      const existing = monthMap.get(monthKey) || { total: 0, count: 0 }
      existing.total += Number(row.valor_total)
      existing.count += 1
      monthMap.set(monthKey, existing)
    }

    const monthNames = [
      'Jan',
      'Fev',
      'Mar',
      'Abr',
      'Mai',
      'Jun',
      'Jul',
      'Ago',
      'Set',
      'Out',
      'Nov',
      'Dez',
    ]
    return Array.from(monthMap.entries()).map(([key, val]) => {
      const [year, month] = key.split('-')
      const monthIdx = parseInt(month) - 1
      return {
        month: `${monthNames[monthIdx]}/${year.substring(2)}`,
        total: val.total,
        count: val.count,
      }
    })
  },

  async getSupplierVolumes(
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<SupplierVolumeData[]> {
    const fromStr = dateFrom ? format(dateFrom, 'yyyy-MM-dd') : undefined
    const toStr = dateTo ? format(dateTo, 'yyyy-MM-dd') : undefined

    let query = supabase.from('notas_fiscais').select('fornecedor, valor_total')
    if (fromStr) query = query.gte('data_emissao', fromStr)
    if (toStr) query = query.lte('data_emissao', toStr)

    const { data, error } = await query
    if (error) throw error

    const supplierMap = new Map<string, { total: number; count: number }>()
    const grandTotal = (data || []).reduce(
      (s, n) => s + Number(n.valor_total),
      0,
    )

    for (const row of data || []) {
      const fornecedor = row.fornecedor || 'Sem Fornecedor'
      const existing = supplierMap.get(fornecedor) || { total: 0, count: 0 }
      existing.total += Number(row.valor_total)
      existing.count += 1
      supplierMap.set(fornecedor, existing)
    }

    return Array.from(supplierMap.entries())
      .map(([fornecedor, val]) => ({
        fornecedor,
        total: val.total,
        count: val.count,
        percentage: grandTotal > 0 ? (val.total / grandTotal) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total)
  },
}
