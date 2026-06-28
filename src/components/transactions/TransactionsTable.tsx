import { format } from 'date-fns'
import { Edit, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
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
import { Transacao, TipoTransacao } from '@/lib/types'
import { cn } from '@/lib/utils'

interface TransactionsTableProps {
  data: Transacao[]
  onEdit: (transaction: Transacao) => void
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(v)

export function TransactionsTable({ data, onEdit }: TransactionsTableProps) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-xl bg-white shadow-sm">
        <p className="text-gray-500">Nenhuma transação encontrada.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/50">
            <TableHead className="w-[120px]">Data</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead className="w-[100px]">Tipo</TableHead>
            <TableHead>Observações</TableHead>
            <TableHead className="w-[100px] text-center">Status</TableHead>
            <TableHead className="w-[80px] text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="text-gray-600 text-sm">
                {format(item.data, 'dd/MM/yyyy')}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0',
                      item.tipo_id === TipoTransacao.Receita
                        ? 'bg-green-100 text-green-600'
                        : 'bg-red-100 text-red-600',
                    )}
                  >
                    {item.tipo_id === TipoTransacao.Receita ? (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <span className="font-medium text-gray-900 text-sm">
                    {item.descricao}
                  </span>
                </div>
              </TableCell>
              <TableCell
                className={cn(
                  'text-right font-bold text-sm',
                  item.tipo_id === TipoTransacao.Receita
                    ? 'text-green-600'
                    : 'text-gray-900',
                )}
              >
                {item.tipo_id === TipoTransacao.Receita ? '+' : '-'}
                {formatCurrency(item.valor)}
              </TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className={cn(
                    item.tipo_id === TipoTransacao.Receita
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-700',
                  )}
                >
                  {item.tipo_id || 'N/A'}
                </Badge>
              </TableCell>
              <TableCell className="text-gray-500 text-sm max-w-[200px] truncate">
                {item.observacoes || '-'}
              </TableCell>
              <TableCell className="text-center">
                {item.reconciled ? (
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
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-primary hover:bg-primary/10"
                  onClick={() => onEdit(item)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
