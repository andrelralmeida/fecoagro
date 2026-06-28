import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Transacao, Atividade, CentroCusto, PlanoConta } from '@/lib/types'

interface TransactionViewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: Transacao | null
  atividades: Atividade[]
  centroCustos: CentroCusto[]
  planoContas: PlanoConta[]
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(v)

export function TransactionViewDialog({
  open,
  onOpenChange,
  item,
  atividades,
  centroCustos,
  planoContas,
}: TransactionViewDialogProps) {
  if (!item) return null

  const getLabel = (
    id: number | null,
    list: { id: number }[],
    field: string,
  ) => {
    if (!id) return '-'
    const found = list.find((x) => x.id === id) as any
    return found ? `${found.id} - ${found[field] || 'Sem descrição'}` : '-'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Visualização de Crítica</DialogTitle>
          <DialogDescription>Detalhes da crítica contábil</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[400px]">
          <div className="space-y-4 p-1">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500">ID</label>
                <p className="text-sm font-mono text-gray-900">{item.id}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">
                  Data
                </label>
                <p className="text-sm text-gray-900">
                  {format(new Date(item.date), 'dd/MM/yyyy')}
                </p>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">
                Histórico
              </label>
              <p className="text-sm text-gray-900">
                {item.historico || item.description}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500">
                  Valor
                </label>
                <p className="text-sm font-bold text-gray-900">
                  {formatCurrency(item.amount)}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">
                  Lote
                </label>
                <p className="text-sm font-mono text-gray-900">
                  {item.lote || '-'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <label className="text-xs font-medium text-gray-500">
                  Atividade
                </label>
                <p className="text-sm text-gray-900">
                  {getLabel(item.atividade_id, atividades, 'atividade')}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">
                  Centro de Custos
                </label>
                <p className="text-sm text-gray-900">
                  {getLabel(
                    item.centro_custo_id,
                    centroCustos,
                    'centro_de_custos',
                  )}
                </p>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Conta</label>
              <p className="text-sm text-gray-900">
                {getLabel(item.plano_conta_id, planoContas, 'descricao')}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">
                Status
              </label>
              <p className="text-sm text-gray-900">
                {item.status || (item.reconciled ? 'Reconciliado' : 'Pendente')}
              </p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
