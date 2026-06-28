import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Plus,
  FileUp,
  Download,
  Edit,
  Trash2,
  Landmark,
  Search,
  Hash,
  X,
} from 'lucide-react'
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
import { BancosForm } from '@/components/forms/BancosForm'
import { PdfImportModal } from '@/components/pdf/PdfImportModal'
import { PdfExportButton } from '@/components/PdfExportButton'
import { ColumnVisibility } from '@/components/ColumnVisibility'
import { useColumnVisibility } from '@/hooks/use-column-visibility'
import { Banco } from '@/lib/types'
import { fetchAll, deleteRecord } from '@/services/crudService'
import { exportToCsv, formatCurrencyNumber } from '@/lib/export'
import { toast } from 'sonner'

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    v,
  )

const bancoColumns = [
  { key: 'banco', label: 'Banco' },
  { key: 'agencia', label: 'Agência' },
  { key: 'conta_corrente', label: 'Conta Corrente' },
  { key: 'saldo_atual', label: 'Saldo Atual' },
]

const BancosPage = () => {
  const [data, setData] = useState<Banco[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [pdfOpen, setPdfOpen] = useState(false)
  const [editItem, setEditItem] = useState<Banco | null>(null)
  const [idFilter, setIdFilter] = useState('')
  const [bankNameFilter, setBankNameFilter] = useState('')
  const { visibleColumns, toggleColumn } = useColumnVisibility(
    'bancos',
    bancoColumns.map((c) => c.key),
  )

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchesId =
        idFilter.trim() === '' || String(item.id) === idFilter.trim()
      const matchesBankName =
        bankNameFilter.trim() === '' ||
        item.banco.toLowerCase().includes(bankNameFilter.trim().toLowerCase())
      return matchesId && matchesBankName
    })
  }, [data, idFilter, bankNameFilter])

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const result = await fetchAll<Banco>('bancos')
      setData(result)
    } catch {
      toast.error('Erro ao carregar contas bancárias')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleCreate = () => {
    setEditItem(null)
    setFormOpen(true)
  }
  const handleEdit = (item: Banco) => {
    setEditItem(item)
    setFormOpen(true)
  }

  const handleExport = () => {
    if (filteredData.length === 0) {
      toast.error('Nenhum dado para exportar')
      return
    }
    const headers = ['ID', 'Banco', 'Agência', 'Conta Corrente', 'Saldo Atual']
    const rows = filteredData.map((item) => [
      item.id,
      item.banco,
      item.agencia,
      item.conta_corrente,
      formatCurrencyNumber(item.saldo_atual),
    ])
    exportToCsv('bancos_data.csv', headers, rows)
    toast.success('CSV exportado com sucesso')
  }

  const totalSaldo = data.reduce((sum, b) => sum + b.saldo_atual, 0)

  const hasActiveFilters = idFilter !== '' || bankNameFilter !== ''

  const clearFilters = () => {
    setIdFilter('')
    setBankNameFilter('')
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bancos</h1>
          <p className="text-gray-500">
            Gerencie suas contas bancárias e saldos.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setPdfOpen(true)}>
            <FileUp className="w-4 h-4 mr-2" /> Importar PDF
          </Button>
          <PdfExportButton
            title="Bancos"
            columns={[
              { header: 'ID', key: 'id' },
              { header: 'Banco', key: 'banco' },
              { header: 'Agência', key: 'agencia' },
              { header: 'Conta Corrente', key: 'conta_corrente' },
              { header: 'Saldo Atual', key: 'saldo_atual' },
            ]}
            data={filteredData.map((item) => ({
              id: item.id,
              banco: item.banco,
              agencia: item.agencia,
              conta_corrente: item.conta_corrente,
              saldo_atual: formatCurrencyNumber(item.saldo_atual),
            }))}
          />
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" /> Exportar CSV
          </Button>
          <ColumnVisibility
            columns={bancoColumns}
            visibleColumns={visibleColumns}
            onToggle={toggleColumn}
          />
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" /> Nova Conta
          </Button>
        </div>
      </div>

      {data.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 sm:max-w-[180px]">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="number"
              placeholder="Filtrar por ID..."
              value={idFilter}
              onChange={(e) => setIdFilter(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>
          <div className="relative flex-1 sm:max-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Filtrar por banco..."
              value={bankNameFilter}
              onChange={(e) => setBankNameFilter(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-9 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="mr-2 h-3 w-3" /> Limpar Filtros
            </Button>
          )}
        </div>
      )}

      {data.length > 0 && (
        <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">
            Saldo Total Consolidado
          </span>
          <span className="text-2xl font-bold text-primary">
            {formatCurrency(totalSaldo)}
          </span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-xl bg-white shadow-sm">
          <Landmark className="w-12 h-12 text-gray-300 mb-3" />
          <p className="text-gray-500 mb-2">
            Nenhuma conta bancária encontrada.
          </p>
          <p className="text-sm text-gray-400">
            Adicione uma nova conta ou importe via PDF.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead className="w-[100px]">ID</TableHead>
                  {visibleColumns.banco && <TableHead>Banco</TableHead>}
                  {visibleColumns.agencia && <TableHead>Agência</TableHead>}
                  {visibleColumns.conta_corrente && (
                    <TableHead>Conta Corrente</TableHead>
                  )}
                  {visibleColumns.saldo_atual && (
                    <TableHead className="text-right">Saldo Atual</TableHead>
                  )}
                  <TableHead className="w-[100px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-xs text-gray-400">
                      #{item.id}
                    </TableCell>
                    {visibleColumns.banco && (
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Landmark className="w-4 h-4 text-primary" />
                          </div>
                          <span className="font-semibold text-gray-900">
                            {item.banco}
                          </span>
                        </div>
                      </TableCell>
                    )}
                    {visibleColumns.agencia && (
                      <TableCell className="text-gray-600 font-mono text-sm">
                        {item.agencia}
                      </TableCell>
                    )}
                    {visibleColumns.conta_corrente && (
                      <TableCell className="text-gray-600 font-mono text-sm">
                        {item.conta_corrente}
                      </TableCell>
                    )}
                    {visibleColumns.saldo_atual && (
                      <TableCell
                        className={`text-right font-bold ${item.saldo_atual >= 0 ? 'text-gray-900' : 'text-red-600'}`}
                      >
                        {formatCurrency(item.saldo_atual)}
                      </TableCell>
                    )}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
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
                                Esta ação excluirá permanentemente a conta
                                bancária.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-red-600 hover:bg-red-700"
                                onClick={async () => {
                                  await deleteRecord('bancos', item.id)
                                  setData((prev) =>
                                    prev.filter((i) => i.id !== item.id),
                                  )
                                  toast.success('Conta excluída')
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

      <BancosForm
        open={formOpen}
        onOpenChange={setFormOpen}
        editItem={editItem}
        onSuccess={loadData}
      />
      <PdfImportModal
        open={pdfOpen}
        onOpenChange={setPdfOpen}
        entityType="bancos"
        onSuccess={loadData}
      />
    </div>
  )
}

export default BancosPage
