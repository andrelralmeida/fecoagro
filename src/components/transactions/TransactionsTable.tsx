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
import {
  Transacao,
  Atividade,
  CentroCusto,
  PlanoConta,
  NotaFiscal,
} from '@/lib/types'
import {
  formatAtividade,
  formatCentroCusto,
  formatPlanoConta,
  formatNotaFiscal,
} from '@/lib/relational-format'

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(v)

const statusColors: Record<string, string> = {
  pendente: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  concluido: 'bg-green-50 text-green-700 border-green-200',
  cancelado: 'bg-red-50 text-red-700 border-red-200',
}

interface Props {
  data: Transacao[]
  onEdit: (t: Transacao) => void
  onView: (t: Transacao) => void
  onDelete: (t: Transacao) => void
  atividades: Atividade[]
  centroCustos: CentroCusto[]
  planoContas: PlanoConta[]
  notasFiscais: NotaFiscal[]
}

export function TransactionsTable({
  data,
  onEdit,
  onView,
  onDelete,
  atividades,
  centroCustos,
  planoContas,
  notasFiscais,
}: Props) {
  const getAtividade = (id: number | null) => formatAtividade(id, atividades)
  const getCentroCusto = (id: number | null) =>
    formatCentroCusto(id, centroCustos)
  const getPlanoConta = (id: number | null) => formatPlanoConta(id, planoContas)
  const getNotaFiscal = (id: number | null) =>
    formatNotaFiscal(id, notasFiscais)

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-xl bg-white shadow-sm">
        <p className="text-gray-500 mb-2">Nenhuma crítica encontrada.</p>
        <p className="text-sm text-gray-400">
          Adicione uma nova crítica ou importe via PDF.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/50">
            <TableHead>Data</TableHead>
            <TableHead>Histórico</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Atividade</TableHead>
            <TableHead>Centro de Custos</TableHead>
            <TableHead>Plano de Contas</TableHead>
            <TableHead>Nota Fiscal</TableHead>
            <TableHead className="w-[120px] text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="text-gray-600 whitespace-nowrap">
                {new Date(item.date).toLocaleDateString('pt-BR')}
              </TableCell>
              <TableCell className="font-medium text-gray-900 max-w-[200px] truncate">
                {item.historico || '-'}
              </TableCell>
              <TableCell className="text-right font-bold text-gray-900 whitespace-nowrap">
                {formatCurrency(item.amount)}
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={statusColors[item.status || ''] || ''}
                >
                  {item.status || '-'}
                </Badge>
              </TableCell>
              <TableCell className="text-gray-600 max-w-[150px] truncate">
                {getAtividade(item.atividade_id)}
              </TableCell>
              <TableCell className="text-gray-600 max-w-[150px] truncate">
                {getCentroCusto(item.centro_custo_id)}
              </TableCell>
              <TableCell className="text-gray-600 max-w-[150px] truncate">
                {getPlanoConta(item.plano_conta_id)}
              </TableCell>
              <TableCell className="text-gray-600 whitespace-nowrap">
                {getNotaFiscal(item.nota_fiscal_id)}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-500 hover:bg-gray-100"
                    onClick={() => onView(item)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-primary hover:bg-primary/10"
                    onClick={() => onEdit(item)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:bg-red-50"
                    onClick={() => onDelete(item)}
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
