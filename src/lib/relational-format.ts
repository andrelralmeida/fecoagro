import { Atividade, CentroCusto, PlanoConta, NotaFiscal } from '@/lib/types'

export function formatAtividade(
  id: number | null | undefined,
  list: Atividade[],
): string {
  if (!id) return '-'
  const item = list.find((a) => a.id === id)
  return item ? `${item.id} - ${item.atividade}` : String(id)
}

export function atividadeOptions(
  list: Atividade[],
): { value: string; label: string }[] {
  return list.map((a) => ({
    value: String(a.id),
    label: `${a.id} - ${a.atividade}`,
  }))
}

export function formatCentroCusto(
  id: number | null | undefined,
  list: CentroCusto[],
): string {
  if (!id) return '-'
  const item = list.find((c) => c.id === id)
  return item ? `${item.id} - ${item.centro_de_custos}` : String(id)
}

export function centroCustoOptions(
  list: CentroCusto[],
): { value: string; label: string }[] {
  return list.map((c) => ({
    value: String(c.id),
    label: `${c.id} - ${c.centro_de_custos}`,
  }))
}

export function formatPlanoConta(
  id: number | null | undefined,
  list: PlanoConta[],
): string {
  if (!id) return '-'
  const item = list.find((p) => p.id === id)
  return item ? `${item.id} - ${item.descricao}` : String(id)
}

export function planoContaOptions(
  list: PlanoConta[],
): { value: string; label: string }[] {
  return list.map((p) => ({
    value: String(p.id),
    label: `${p.id} - ${p.descricao}`,
  }))
}

export function formatNotaFiscal(
  id: number | null | undefined,
  list: NotaFiscal[],
): string {
  if (!id) return '-'
  const item = list.find((n) => n.id === id)
  return item ? `${item.id} - ${item.fornecedor}` : String(id)
}

export function notaFiscalOptions(
  list: NotaFiscal[],
): { value: string; label: string }[] {
  return list.map((n) => ({
    value: String(n.id),
    label: `${n.id} - ${n.fornecedor}`,
  }))
}
