import { Atividade, CentroCusto, PlanoConta, NotaFiscal } from '@/lib/types'

export function formatAtividade(
  id: number | null | undefined,
  list: Atividade[],
): string {
  if (!id) return '-'
  const item = list.find((a) => a.id === id)
  return item ? `${item.id} - ${item.atividade}` : '-'
}

export function formatCentroCusto(
  id: number | null | undefined,
  list: CentroCusto[],
): string {
  if (!id) return '-'
  const item = list.find((c) => c.id === id)
  return item ? `${item.id} - ${item.centro_de_custos}` : '-'
}

export function formatPlanoConta(
  id: number | null | undefined,
  list: PlanoConta[],
): string {
  if (!id) return '-'
  const item = list.find((p) => p.id === id)
  return item
    ? `${item.id} - ${item.descricao || item.classificacao || 'Sem descrição'}`
    : '-'
}

export function formatNotaFiscal(
  id: number | null | undefined,
  list: NotaFiscal[],
): string {
  if (!id) return 'N/A'
  const item = list.find((nf) => nf.id === id)
  return item ? `${item.id} - ${item.numero_nota}` : 'N/A'
}

export function atividadeOptions(
  list: Atividade[],
): { value: string; label: string }[] {
  return list.map((a) => ({
    value: String(a.id),
    label: `${a.id} - ${a.atividade}`,
  }))
}

export function centroCustoOptions(
  list: CentroCusto[],
): { value: string; label: string }[] {
  return list.map((c) => ({
    value: String(c.id),
    label: `${c.id} - ${c.centro_de_custos}`,
  }))
}

export function planoContaOptions(
  list: PlanoConta[],
): { value: string; label: string }[] {
  return list.map((p) => ({
    value: String(p.id),
    label: `${p.id} - ${p.descricao || p.classificacao || 'Sem descrição'}`,
  }))
}

export function notaFiscalOptions(
  list: NotaFiscal[],
): { value: string; label: string }[] {
  return list.map((nf) => ({
    value: String(nf.id),
    label: `${nf.id} - ${nf.numero_nota}`,
  }))
}
