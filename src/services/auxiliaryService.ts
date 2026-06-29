import { fetchAll } from '@/services/crudService'
import {
  PlanoConta,
  CentroCusto,
  Atividade,
  NotaFiscal,
  Filial,
} from '@/lib/types'

export const auxiliaryService = {
  async fetchPlanoContas(): Promise<PlanoConta[]> {
    return fetchAll<PlanoConta>('plano_contas')
  },
  async fetchCentroCustos(): Promise<CentroCusto[]> {
    return fetchAll<CentroCusto>('centro_custos')
  },
  async fetchAtividades(): Promise<Atividade[]> {
    return fetchAll<Atividade>('atividades')
  },
  async fetchNotasFiscais(): Promise<NotaFiscal[]> {
    return fetchAll<NotaFiscal>('notas_fiscais')
  },
  async fetchFiliais(): Promise<Filial[]> {
    return fetchAll<Filial>('filiais')
  },
}
