import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Landmark,
  FileUp,
  Download,
  CheckCircle2,
  Clock,
  Link2,
  Search,
  X,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Banco, ExtratoBancario } from '@/lib/types'
import { fetchAll } from '@/services/crudService'
import { fetchExtratos } from '@/services/extratoService'
import { formatCurrency } from '@/lib/format'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { PdfImportModal } from '@/components/pdf/PdfImportModal'
import { ReconciliationSheet } from '@/components/ReconciliationSheet'
import { PdfExportButton } from '@/components/PdfExportButton'
import { ColumnVisibility } from '@/components/ColumnVisibility'
import { useColumnVisibility } from '@/hooks/use-column-visibility'
import {
  exportToCsv,
  buildExportFilename,
  formatCurrencyNumber,
  formatDateBR,
} from '@/lib/export'

const extratoColumns = [
  { key: 'data', label: 'Data' },
  { key: 'descricao', label: 'Descrição' },
  { key: 'valor', label: 'Valor' },
  { key: 'tipo', label: 'Tipo' },
  { key: 'reconciled', label: 'Reconciliado' },
]

export default function Extratos() {
  const [bancos, setBancos] = useState<Banco[]>([])
  const [extratos, setExtratos] = useState<ExtratoBancario[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBancoId, setSelectedBancoId] = useState<number | null>(null)
  const [pdfOpen, setPdfOpen] = useState(false)
  const [reconcileItem, setReconcileItem] = useState<ExtratoBancario | null>(
    null,
  )
  const [reconcileOpen, setReconcileOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const { visibleColumns, toggleColumn } = useColumnVisibility(
    'extratos',
    extratoColumns.map((c) => c.key),
  )

  const loadBancos = useCallback(async () => {
    try {
      const data = await fetchAll<Banco>('bancos')
      setBancos(data)
      if (data.length > 0 && selectedBancoId === null)
        setSelectedBancoId(data[0].id)
    } catch {
      toast.error('Erro ao carregar contas bancárias')
    }
  }, [selectedBancoId])

  const loadExtratos = useCallback(async () => {
    if (!selectedBancoId) return
    try {
      setLoading(true)
      const data = await fetchExtratos(selectedBancoId)
      setExtratos(data)
    } catch {
      toast.error('Erro ao carregar extratos')
    } finally {
      setLoading(false)
    }
  }, [selectedBancoId])

  useEffect(() => {
    loadBancos()
  }, [loadBancos])
  useEffect(() => {
    if (selectedBancoId) loadExtratos()
  }, [selectedBancoId, loadExtratos])

  const filteredBancos = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return bancos
    return bancos.filter(
      (b) =>
        String(b.id).includes(term) || b.banco.toLowerCase().includes(term),
    )
  }, [bancos, searchTerm])

  const selectedBanco = bancos.find((b) => b.id === selectedBancoId)
  const reconciledCount = extratos.filter((e) => e.reconciled).length
  const pendingCount = extratos.length - reconciledCount

  const handleReconcile = (item: ExtratoBancario) => {
    setReconcileItem(item)
    setReconcileOpen(true)
  }

  const hasActiveFilters = searchTerm !== ''

  const clearFilters = () => {
    setSearchTerm('')
  }

  const handleExport = () => {
    if (extratos.length === 0) {
      toast.error('Nenhum dado para exportar')
      return
    }
    const headers = [
      'Data',
      'Descrição',
      'Valor',
      'Tipo',
      'Banco (ID - Nome)',
      'Status (Reconciliado)',
    ]
    const rows = extratos.map((e) => [
      formatDateBR(e.data),
      e.descricao,
      formatCurrencyNumber(e.valor),
      e.tipo === 'credit' ? 'Crédito' : 'Débito',
      selectedBanco
        ? `${selectedBanco.id} - ${selectedBanco.banco}`
        : String(e.banco_id),
      e.reconciled ? 'Reconciliado' : 'Pendente',
    ])
    exportToCsv(buildExportFilename('extratos'), headers, rows)
    toast.success('CSV exportado com sucesso')
  }

  if (loading && extratos.length === 0 && !selectedBancoId) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Extratos Bancários
          </h1>
          <p className="text-gray-500">
            Gerencie extratos e reconciliação bancária.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setPdfOpen(true)}>
            <FileUp className="w-4 h-4 mr-2" /> Importar PDF
          </Button>
          <PdfExportButton
            title="Extratos Bancários"
            columns={[
              { header: 'Data', key: 'data' },
              { header: 'Descrição', key: 'descricao' },
              { header: 'Valor', key: 'valor' },
              { header: 'Tipo', key: 'tipo' },
              { header: 'Status', key: 'status' },
            ]}
            data={extratos.map((e) => ({
              data: formatDateBR(e.data),
              descricao: e.descricao,
              valor: formatCurrencyNumber(e.valor),
              tipo: e.tipo === 'credit' ? 'Crédito' : 'Débito',
              status: e.reconciled ? 'Reconciliado' : 'Pendente',
            }))}
          />
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" /> Exportar CSV
          </Button>
          <ColumnVisibility
            columns={extratoColumns}
            visibleColumns={visibleColumns}
            onToggle={toggleColumn}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Contas Bancárias
          </h2>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por ID ou nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-9 mb-3 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="mr-2 h-3 w-3" /> Limpar Filtros
            </Button>
          )}
          <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1">
            {filteredBancos.map((banco) => (
              <button
                key={banco.id}
                onClick={() => setSelectedBancoId(banco.id)}
                className={cn(
                  'text-left rounded-xl border p-4 transition-all duration-200',
                  selectedBancoId === banco.id
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm',
                )}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Landmark className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 truncate">
                      {banco.id} - {banco.banco}
                    </h3>
                    <p className="text-xs text-gray-400 font-mono">
                      Ag: {banco.agencia} | CC: {banco.conta_corrente}
                    </p>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                  <span className="text-xs text-gray-500">Saldo Atual</span>
                  <span
                    className={cn(
                      'text-sm font-bold',
                      banco.saldo_atual >= 0 ? 'text-gray-900' : 'text-red-600',
                    )}
                  >
                    {formatCurrency(banco.saldo_atual)}
                  </span>
                </div>
              </button>
            ))}
            {filteredBancos.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-gray-500 text-sm">
                  Nenhuma conta encontrada com este filtro.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-6">
          {selectedBanco && (
            <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {selectedBanco.id} - {selectedBanco.banco}
                </p>
                <p className="text-xs text-gray-400">
                  Ag: {selectedBanco.agencia} | CC:{' '}
                  {selectedBanco.conta_corrente}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Saldo Atual</p>
                <p className="text-xl font-bold text-primary">
                  {formatCurrency(selectedBanco.saldo_atual)}
                </p>
              </div>
            </div>
          )}

          <Card className="rounded-xl border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center justify-between">
                <span>Extratos</span>
                <div className="flex gap-2">
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-700 font-normal"
                  >
                    <CheckCircle2 className="w-3 h-3 mr-1" /> {reconciledCount}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="bg-amber-100 text-amber-700 font-normal"
                  >
                    <Clock className="w-3 h-3 mr-1" /> {pendingCount}
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : extratos.length > 0 ? (
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/50">
                        {visibleColumns.data && (
                          <TableHead className="w-[100px]">Data</TableHead>
                        )}
                        {visibleColumns.descricao && (
                          <TableHead>Descrição</TableHead>
                        )}
                        {visibleColumns.tipo && (
                          <TableHead className="w-[80px]">Tipo</TableHead>
                        )}
                        {visibleColumns.valor && (
                          <TableHead className="text-right">Valor</TableHead>
                        )}
                        {visibleColumns.reconciled && (
                          <TableHead className="w-[120px] text-center">
                            Status
                          </TableHead>
                        )}
                        <TableHead className="w-[140px] text-center">
                          Ação
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {extratos.map((e) => (
                        <TableRow key={e.id}>
                          {visibleColumns.data && (
                            <TableCell className="text-gray-600 text-sm">
                              {format(new Date(e.data), 'dd/MM/yyyy')}
                            </TableCell>
                          )}
                          {visibleColumns.descricao && (
                            <TableCell className="font-medium text-gray-900 text-sm">
                              {e.descricao}
                            </TableCell>
                          )}
                          {visibleColumns.tipo && (
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className={cn(
                                  e.tipo === 'credit'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700',
                                )}
                              >
                                {e.tipo === 'credit' ? 'Crédito' : 'Débito'}
                              </Badge>
                            </TableCell>
                          )}
                          {visibleColumns.valor && (
                            <TableCell
                              className={cn(
                                'text-right font-bold text-sm',
                                e.tipo === 'credit'
                                  ? 'text-green-600'
                                  : 'text-red-600',
                              )}
                            >
                              {formatCurrency(e.valor)}
                            </TableCell>
                          )}
                          {visibleColumns.reconciled && (
                            <TableCell className="text-center">
                              <Badge
                                variant="secondary"
                                className={cn(
                                  e.reconciled
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-amber-100 text-amber-700',
                                )}
                              >
                                {e.reconciled ? 'Reconciliado' : 'Pendente'}
                              </Badge>
                            </TableCell>
                          )}
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-primary hover:bg-primary/10"
                              onClick={() => handleReconcile(e)}
                            >
                              <Link2 className="h-4 w-4 mr-1" />
                              {e.reconciled ? 'Ver' : 'Vincular'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-gray-500 text-sm">
                    Nenhum extrato encontrado para esta conta.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ReconciliationSheet
        open={reconcileOpen}
        onOpenChange={setReconcileOpen}
        extrato={reconcileItem}
        onSuccess={loadExtratos}
      />
      <PdfImportModal
        open={pdfOpen}
        onOpenChange={setPdfOpen}
        entityType="extratos_bancarios"
        onSuccess={loadExtratos}
      />
    </div>
  )
}
