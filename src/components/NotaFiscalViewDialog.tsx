import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { NotaFiscal, Filial } from '@/lib/types'
import { cn } from '@/lib/utils'
import { formatFilial } from '@/lib/filial-format'

interface NotaFiscalViewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: NotaFiscal | null
  filiais: Filial[]
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

const statusColors: Record<string, string> = {
  pendente: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  aprovada: 'bg-green-50 text-green-700 border-green-200',
  cancelada: 'bg-red-50 text-red-700 border-red-200',
}

export function NotaFiscalViewDialog({
  open,
  onOpenChange,
  item,
  filiais,
}: NotaFiscalViewDialogProps) {
  if (!item) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Detalhes da Nota Fiscal</DialogTitle>
          <DialogDescription>
            Informações completas do documento fiscal
          </DialogDescription>
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
                  Número da Nota
                </label>
                <p className="text-sm font-semibold text-gray-900">
                  {item.numero_nota}
                </p>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">
                Fornecedor
              </label>
              <p className="text-sm text-gray-900">{item.emissor}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <label className="text-xs font-medium text-gray-500">
                  Data de Emissão
                </label>
                <p className="text-sm text-gray-900">
                  {safeFormatDate(item.data_emissao)}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">
                  Valor Total
                </label>
                <p className="text-sm font-bold text-gray-900">
                  {formatCurrency(item.valor_total)}
                </p>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">
                Status
              </label>
              <div className="mt-1">
                <Badge
                  variant="outline"
                  className={cn(statusColors[item.status] || '')}
                >
                  {item.status}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">
                Filial
              </label>
              <p className="text-sm text-gray-900">
                {formatFilial(item.filial_id, filiais)}
              </p>
            </div>
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
