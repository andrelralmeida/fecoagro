import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Transacao, Atividade, CentroCusto, PlanoConta } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  formatAtividade,
  formatCentroCusto,
  formatPlanoConta,
} from '@/lib/relational-format'

interface TransactionViewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: Transacao | null
  atividades: Atividade[]
  centroCustos: CentroCusto[]
  planoContas: PlanoConta[]
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(v || 0)

const safeFormatDate = (value: string | null | undefined): string => {
  if (!value) return 'N/A'
  const datePart = value.split('T')[0]
  const parts = datePart.split('-')
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`
  return 'N/A'
}

export function TransactionViewDialog({
  open,
  onOpenChange,
  transaction,
  atividades,
  centroCustos,
  planoContas,
}: TransactionViewDialogProps) {
  if (!transaction) return null

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
                <p className="text-sm font-mono text-gray-900">
                  {transaction.id}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">
                  Data
                </label>
                <p className="text-sm text-gray-900">
                  {safeFormatDate(transaction.date)}
                </p>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">
                Histórico
              </label>
              <p className="text-sm text-gray-900">
                {transaction.historico || transaction.description || '-'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500">
                  Valor
                </label>
                <p className="text-sm font-bold text-gray-900">
                  {formatCurrency(transaction.amount)}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">
                  Lote
                </label>
                <p className="text-sm font-mono text-gray-900">
                  {transaction.lote || '-'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <label className="text-xs font-medium text-gray-500">
                  Atividade
                </label>
                <p className="text-sm text-gray-900">
                  {formatAtividade(transaction.atividade_id, atividades)}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">
                  Centro de Custos
                </label>
                <p className="text-sm text-gray-900">
                  {formatCentroCusto(transaction.centro_custo_id, centroCustos)}
                </p>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Conta</label>
              <p className="text-sm text-gray-900">
                {formatPlanoConta(transaction.plano_conta_id, planoContas)}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">
                Status
              </label>
              <div className="mt-1">
                {transaction.status ? (
                  <Badge
                    variant="secondary"
                    className={cn(
                      transaction.status === 'concluido'
                        ? 'bg-green-50 text-green-700'
                        : transaction.status === 'cancelado'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-amber-50 text-amber-700',
                    )}
                  >
                    {transaction.status}
                  </Badge>
                ) : transaction.reconciled ? (
                  <Badge
                    variant="secondary"
                    className="bg-green-50 text-green-700"
                  >
                    Reconciliado
                  </Badge>
                ) : (
                  <Badge
                    variant="secondary"
                    className="bg-amber-50 text-amber-700"
                  >
                    Pendente
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
