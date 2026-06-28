import { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  FileUp,
  Download,
  Edit,
  Trash2,
  Eye,
  Calendar as CalendarIcon,
  X,
  Filter,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { DateRange } from 'react-day-picker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { RazaoForm } from '@/components/forms/RazaoForm'
import { PdfImportModal } from '@/components/pdf/PdfImportModal'
import { StatementViewDialog } from '@/components/StatementViewDialog'
import { SearchableFilter } from '@/components/SearchableFilter'
import { PdfExportButton } from '@/components/PdfExportButton'
import { ColumnVisibility } from '@/components/ColumnVisibility'
import { useColumnVisibility } from '@/hooks/use-column-visibility'
import { Razao, PlanoConta } from '@/lib/types'
import { fetchWithFilters, deleteRecord } from '@/services/crudService'
import { auxiliaryService } from '@/services/auxiliaryService'
import {
  exportToCsv,
  buildExportFilename,
  formatCurrencyNumber,
  formatDateBR,
} from '@/lib/export'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface RazaoFilters {
  dateRange: DateRange | undefined
  conta: string
  valorMin: string
  valorMax: string
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    v,
  )

const razaoColumns = [
  { key: 'data', label: 'Data' },
  { key: 'conta', label: 'Conta' },
  { key: 'historico', label: 'Histórico' },
  { key: 'debito', label: 'Débito' },
  { key: 'credito', label: 'Crédito' },
  { key: 'saldo', label: 'Saldo' },
  { key: 'lote', label: 'Lote' },
]

const RazaoPage = () => {
  const [data, setData] = useState<Razao[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [pdfOpen, setPdfOpen] = useState(false)
  const [editItem, setEditItem] = useState<Razao | null>(null)
  const [viewItem, setViewItem] = useState<Razao | null>(null)
  const [viewOpen, setViewOpen] = useState(false)
  const [planoContas, setPlanoContas] = useState<PlanoConta[]>([])
  const [filters, setFilters] = useState<RazaoFilters>({
    dateRange: undefined,
    conta: 'all',
    valorMin: '',
    valorMax: '',
  })
  const { visibleColumns, toggleColumn } = useColumnVisibility(
    'razao',
    razaoColumns.map((c) => c.key),
  )

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const result = await fetchWithFilters<Razao>('razao', {
        dateColumn: 'data',
        dateFrom: filters.dateRange?.from,
        dateTo: filters.dateRange?.to,
        eqColumn: filters.conta !== 'all' ? 'plano_conta_id' : undefined,
        eqValue: filters.conta !== 'all' ? filters.conta : undefined,
      })
      let filtered = result
      const minVal = parseFloat(filters.valorMin)
      const maxVal = parseFloat(filters.valorMax)
      if (!isNaN(minVal)) {
        filtered = filtered.filter(
          (r) => r.debito >= minVal || r.credito >= minVal,
        )
      }
      if (!isNaN(maxVal)) {
        filtered = filtered.filter(
          (r) => r.debito <= maxVal || r.credito <= maxVal,
        )
      }
      setData(filtered)
    } catch {
      toast.error('Erro ao carregar lançamentos')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    const timer = setTimeout(() => loadData(), 300)
    return () => clearTimeout(timer)
  }, [loadData])

  useEffect(() => {
    auxiliaryService
      .fetchPlanoContas()
      .then(setPlanoContas)
      .catch(() => {})
  }, [])

  const hasActiveFilters =
    filters.dateRange !== undefined ||
    filters.conta !== 'all' ||
    filters.valorMin !== '' ||
    filters.valorMax !== ''

  const clearFilters = () => {
    setFilters({
      dateRange: undefined,
      conta: 'all',
      valorMin: '',
      valorMax: '',
    })
  }

  const handleCreate = () => {
    setEditItem(null)
    setFormOpen(true)
  }
  const handleEdit = (item: Razao) => {
    setEditItem(item)
    setFormOpen(true)
  }
  const handleView = (item: Razao) => {
    setViewItem(item)
    setViewOpen(true)
  }

  const handleExport = () => {
    if (data.length === 0) {
      toast.error('Nenhum dado para exportar')
      return
    }
    const headers = [
      'Data',
      'Conta',
      'Descrição',
      'Débito',
      'Crédito',
      'Saldo',
      'Lote',
    ]
    const rows = data.map((item) => [
      formatDateBR(item.data),
      getContaLabel(item.plano_conta_id),
      item.descricao,
      formatCurrencyNumber(item.debito),
      formatCurrencyNumber(item.credito),
      formatCurrencyNumber(item.saldo),
      item.lote ?? '',
    ])
    exportToCsv(buildExportFilename('razao'), headers, rows)
    toast.success('CSV exportado com sucesso')
  }

  const contaOptions = planoContas.map((p) => ({
    value: String(p.id),
    label: `${p.id} - ${p.descricao}`,
  }))

  const getContaLabel = (planoContaId: number | null | undefined) => {
    if (!planoContaId) return '-'
    const pc = planoContas.find((p) => p.id === planoContaId)
    return pc ? `${pc.id} - ${pc.descricao}` : String(planoContaId)
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Razão Contábil</h1>
          <p className="text-gray-500">
            Controle de débitos, créditos e saldos por conta.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setPdfOpen(true)}>
            <FileUp className="w-4 h-4 mr-2" /> Importar PDF
          </Button>
          <PdfExportButton
            title="Razão Contábil"
            columns={[
              { header: 'Data', key: 'data' },
              { header: 'Conta', key: 'conta' },
              { header: 'Descrição', key: 'descricao' },
              { header: 'Débito', key: 'debito' },
              { header: 'Crédito', key: 'credito' },
              { header: 'Saldo', key: 'saldo' },
            ]}
            data={data.map((item) => ({
              data: formatDateBR(item.data),
              conta: getContaLabel(item.plano_conta_id),
              descricao: item.descricao,
              debito: formatCurrencyNumber(item.debito),
              credito: formatCurrencyNumber(item.credito),
              saldo: formatCurrencyNumber(item.saldo),
            }))}
          />
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" /> Exportar CSV
          </Button>
          <ColumnVisibility
            columns={razaoColumns}
            visibleColumns={visibleColumns}
            onToggle={toggleColumn}
          />
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" /> Novo Lançamento
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 flex-wrap">
        <div className="flex gap-2 items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full md:w-[260px] justify-start text-left font-normal bg-white',
                  !filters.dateRange && 'text-muted-foreground',
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateRange?.from ? (
                  filters.dateRange.to ? (
                    <>
                      {format(filters.dateRange.from, 'dd/MM/yyyy')} -{' '}
                      {format(filters.dateRange.to, 'dd/MM/yyyy')}
                    </>
                  ) : (
                    format(filters.dateRange.from, 'dd/MM/yyyy')
                  )
                ) : (
                  <span>Filtrar por data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={filters.dateRange?.from}
                selected={filters.dateRange}
                onSelect={(range) =>
                  setFilters((prev) => ({ ...prev, dateRange: range }))
                }
                numberOfMonths={2}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
          {filters.dateRange && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={() =>
                setFilters((prev) => ({ ...prev, dateRange: undefined }))
              }
              title="Limpar filtro de data"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <SearchableFilter
          options={contaOptions}
          value={filters.conta}
          onValueChange={(val) =>
            setFilters((prev) => ({ ...prev, conta: val }))
          }
          placeholder="Filtrar por conta"
        />
        <div className="flex gap-2 items-center">
          <Input
            type="number"
            placeholder="Valor mín."
            value={filters.valorMin}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, valorMin: e.target.value }))
            }
            className="w-full md:w-[120px] bg-white"
          />
          <Input
            type="number"
            placeholder="Valor máx."
            value={filters.valorMax}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, valorMax: e.target.value }))
            }
            className="w-full md:w-[120px] bg-white"
          />
        </div>
      </div>
      {hasActiveFilters && (
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-gray-500" />
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="mr-2 h-3 w-3" /> Limpar Filtros
          </Button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-xl bg-white shadow-sm">
          <p className="text-gray-500 mb-2">Nenhum lançamento encontrado.</p>
          <p className="text-sm text-gray-400">
            Adicione um novo lançamento ou importe via PDF.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  {visibleColumns.data && (
                    <TableHead className="w-[120px]">Data</TableHead>
                  )}
                  {visibleColumns.conta && <TableHead>Conta</TableHead>}
                  {visibleColumns.historico && <TableHead>Histórico</TableHead>}
                  {visibleColumns.debito && (
                    <TableHead className="text-right">Débito</TableHead>
                  )}
                  {visibleColumns.credito && (
                    <TableHead className="text-right">Crédito</TableHead>
                  )}
                  {visibleColumns.saldo && (
                    <TableHead className="text-right">Saldo</TableHead>
                  )}
                  {visibleColumns.lote && (
                    <TableHead className="w-[100px]">Lote</TableHead>
                  )}
                  <TableHead className="w-[140px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => (
                  <TableRow key={item.id}>
                    {visibleColumns.data && (
                      <TableCell className="text-gray-600">
                        {new Date(item.data).toLocaleDateString('pt-BR')}
                      </TableCell>
                    )}
                    {visibleColumns.conta && (
                      <TableCell className="font-mono text-sm font-semibold text-gray-900">
                        {getContaLabel(item.plano_conta_id)}
                      </TableCell>
                    )}
                    {visibleColumns.historico && (
                      <TableCell className="text-gray-600">
                        {item.descricao}
                      </TableCell>
                    )}
                    {visibleColumns.debito && (
                      <TableCell className="text-right text-red-600 font-medium">
                        {item.debito > 0 ? formatCurrency(item.debito) : '-'}
                      </TableCell>
                    )}
                    {visibleColumns.credito && (
                      <TableCell className="text-right text-green-600 font-medium">
                        {item.credito > 0 ? formatCurrency(item.credito) : '-'}
                      </TableCell>
                    )}
                    {visibleColumns.saldo && (
                      <TableCell className="text-right font-bold text-gray-900">
                        {formatCurrency(item.saldo)}
                      </TableCell>
                    )}
                    {visibleColumns.lote && (
                      <TableCell className="text-gray-600 text-sm">
                        {item.lote ?? '-'}
                      </TableCell>
                    )}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-500 hover:bg-gray-100"
                          onClick={() => handleView(item)}
                          title="Visualização de Extrato"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-primary hover:bg-primary/10"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação excluirá permanentemente o lançamento.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-red-600 hover:bg-red-700"
                                onClick={async () => {
                                  await deleteRecord('razao', item.id)
                                  setData((prev) =>
                                    prev.filter((i) => i.id !== item.id),
                                  )
                                  toast.success('Lançamento excluído')
                                }}
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <RazaoForm
        open={formOpen}
        onOpenChange={setFormOpen}
        editItem={editItem}
        onSuccess={loadData}
      />
      <PdfImportModal
        open={pdfOpen}
        onOpenChange={setPdfOpen}
        entityType="razao"
        onSuccess={loadData}
      />
      <StatementViewDialog
        open={viewOpen}
        onOpenChange={setViewOpen}
        item={viewItem}
      />
    </div>
  )
}

export default RazaoPage
