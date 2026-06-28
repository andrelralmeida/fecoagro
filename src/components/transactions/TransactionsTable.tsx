import { format } from 'date-fns'
import { Edit, Eye, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Transacao, Atividade, CentroCusto, PlanoConta } from '@/lib/types'
import { cn } from '@/lib/utils'

interface TransactionsTableProps {
  data: Transacao[]
  onEdit: (transaction: Transacao) => void
  onView: (transaction: Transacao) => void
  onDelete: (transaction: Transacao) => void
  atividades: Atividade[]
  centroCustos: CentroCusto[]
  planoContas: PlanoConta[]
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(v)

const safeFormatDate = (value: string | null | undefined): string => {
  if (!value) return 'N/A'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'N/A'
  try {
    return format(parsed, 'dd/MM/yyyy')
  } catch {
    return 'N/A'
  }
}

export function TransactionsTable({
  data,
  onEdit,
  onView,
  onDelete,
  atividades,
  centroCustos,
  planoContas,
}: TransactionsTableProps) {
  const getAtividadeLabel = (id: number | null) => {
    if (!id) return '-'
    const a = atividades.find((x) => x.id === id)
    return a ? `${a.id} - ${a.atividade}` : '-'
  }

  const getCentroCustoLabel = (id: number | null) => {
    if (!id) return '-'
    const c = centroCustos.find((x) => x.id === id)
    return c ? `${c.id} - ${c.centro_de_custos}` : '-'
  }

  const getPlanoContaLabel = (id: number | null) => {
    if (!id) return '-'
    const p = planoContas.find((x) => x.id === id)
    return p ? `${p.id} - ${p.descricao || 'Sem descrição'}` : '-'
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-xl bg-white shadow-sm">
        <p className="text-gray-500">Nenhuma crítica encontrada.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/50">
            <TableHead className="w-[120px]">Data</TableHead>
            <TableHead>Histórico</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead>Atividade</TableHead>
            <TableHead>Centro de Custos</TableHead>
            <TableHead>Conta</TableHead>
            <TableHead className="w-[110px] text-center">Status</TableHead>
            <TableHead className="w-[120px] text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="text-gray-600 text-sm">
                {safeFormatDate(item.date)}
              </TableCell>
              <TableCell className="font-medium text-gray-900 text-sm">
                {item.historico || item.description}
              </TableCell>
              <TableCell className="text-right font-bold text-sm text-gray-900">
                {formatCurrency(item.amount)}
              </TableCell>
              <TableCell className="text-gray-600 text-sm">
                {getAtividadeLabel(item.atividade_id)}
              </TableCell>
              <TableCell className="text-gray-600 text-sm">
                {getCentroCustoLabel(item.centro_custo_id)}
              </TableCell>
              <TableCell className="text-gray-600 text-sm">
                {getPlanoContaLabel(item.plano_conta_id)}
              </TableCell>
              <TableCell className="text-center">
                {item.status ? (
                  <Badge
                    variant="secondary"
                    className={cn(
                      item.status === 'concluido'
                        ? 'bg-green-50 text-green-700'
                        : item.status === 'cancelado'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-amber-50 text-amber-700',
                    )}
                  >
                    {item.status}
                  </Badge>
                ) : item.reconciled ? (
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
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-500 hover:bg-gray-100"
                    onClick={() => onView(item)}
                    title="Visualizar"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-primary hover:bg-primary/10"
                    onClick={() => onEdit(item)}
                    title="Editar"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:bg-red-50"
                    onClick={() => onDelete(item)}
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
