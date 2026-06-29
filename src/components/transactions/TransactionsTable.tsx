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
  Filial,
} from '@/lib/types'
import {
  formatAtividade,
  formatCentroCusto,
  formatPlanoConta,
} from '@/lib/relational-format'
import { formatFilial } from '@/lib/filial-format'
import { cn } from '@/lib/utils'

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(v)

interface TransactionsTableProps {
  data: Transacao[]
  onEdit: (t: Transacao) => void
  onView: (t: Transacao) => void
  onDelete: (t: Transacao) => void
  atividades: Atividade[]
  centroCustos: CentroCusto[]
  planoContas: PlanoConta[]
  notasFiscais: NotaFiscal[]
  filiais: Filial[]
  visibleColumns: Record<string, boolean>
}

export function TransactionsTable({
  data,
  onEdit,
  onView,
  onDelete,
  atividades,
  centroCustos,
  planoContas,
  filiais,
  visibleColumns,
}: TransactionsTableProps) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-xl bg-white shadow-sm">
        <p className="text-gray-500 mb-2">Nenhuma crítica encontrada.</p>
        <p className="text-sm text-gray-400">
          Adicione uma nova crítica ou ajuste os filtros.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      <div className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              {visibleColumns.date && (
                <TableHead className="w-[110px]">Data</TableHead>
              )}
              {visibleColumns.historico && <TableHead>Histórico</TableHead>}
              {visibleColumns.amount && (
                <TableHead className="text-right">Valor</TableHead>
              )}
              {visibleColumns.lote && (
                <TableHead className="w-[80px]">Lote</TableHead>
              )}
              <TableHead>Atividade</TableHead>
              <TableHead>Centro de Custos</TableHead>
              <TableHead>Plano de Contas</TableHead>
              {visibleColumns.filial && <TableHead>Filial</TableHead>}
              {visibleColumns.status && (
                <TableHead className="w-[110px]">Status</TableHead>
              )}
              {visibleColumns.reconciled && (
                <TableHead className="w-[120px] text-center">
                  Reconciliado
                </TableHead>
              )}
              <TableHead className="w-[140px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.id}>
                {visibleColumns.date && (
                  <TableCell className="text-gray-600 text-sm">
                    {new Date(item.date).toLocaleDateString('pt-BR')}
                  </TableCell>
                )}
                {visibleColumns.historico && (
                  <TableCell className="text-gray-600">
                    {item.historico || '-'}
                  </TableCell>
                )}
                {visibleColumns.amount && (
                  <TableCell className="text-right font-bold text-gray-900">
                    {formatCurrency(item.amount)}
                  </TableCell>
                )}
                {visibleColumns.lote && (
                  <TableCell className="text-gray-600 text-sm">
                    {item.lote ?? '-'}
                  </TableCell>
                )}
                <TableCell className="text-gray-600 text-sm">
                  {formatAtividade(item.atividade_id, atividades)}
                </TableCell>
                <TableCell className="text-gray-600 text-sm">
                  {formatCentroCusto(item.centro_custo_id, centroCustos)}
                </TableCell>
                <TableCell className="text-gray-600 text-sm">
                  {formatPlanoConta(item.plano_conta_id, planoContas)}
                </TableCell>
                {visibleColumns.filial && (
                  <TableCell className="text-gray-600 text-sm">
                    {formatFilial(item.filial_id, filiais)}
                  </TableCell>
                )}
                {visibleColumns.status && (
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {item.status || '-'}
                    </Badge>
                  </TableCell>
                )}
                {visibleColumns.reconciled && (
                  <TableCell className="text-center">
                    <Badge
                      variant="secondary"
                      className={cn(
                        item.reconciled
                          ? 'bg-green-100 text-green-700'
                          : 'bg-amber-100 text-amber-700',
                      )}
                    >
                      {item.reconciled ? 'Sim' : 'Não'}
                    </Badge>
                  </TableCell>
                )}
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-blue-600 hover:bg-blue-50"
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
    </div>
  )
}
