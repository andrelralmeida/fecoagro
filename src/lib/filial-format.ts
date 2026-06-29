import { Filial } from '@/lib/types'

export function formatFilial(
  id: number | null | undefined,
  list: Filial[],
): string {
  if (!id) return '-'
  const item = list.find((f) => f.id === id)
  return item ? item.filial : String(id)
}

export function filialOptions(
  list: Filial[],
): { value: string; label: string }[] {
  return list.map((f) => ({ value: String(f.id), label: f.filial }))
}
