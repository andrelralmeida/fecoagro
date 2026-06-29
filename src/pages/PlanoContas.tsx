import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Plus,
  FileUp,
  Download,
  Edit,
  Trash2,
  ListTree,
  FolderTree,
  List,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
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
import { PlanoContasForm } from '@/components/forms/PlanoContasForm'
import { PdfImportModal } from '@/components/pdf/PdfImportModal'
import { PlanoContasTree } from '@/components/PlanoContasTree'
import { PdfExportButton } from '@/components/PdfExportButton'
import { ColumnVisibility } from '@/components/ColumnVisibility'
import { useColumnVisibility } from '@/hooks/use-column-visibility'
import {
  ComboboxFilter,
  ComboboxFilterState,
  ComboboxFilterColumn,
} from '@/components/ComboboxFilter'
import { PlanoConta } from '@/lib/types'
import { fetchAll, deleteRecord } from '@/services/crudService'
import { exportToCsv } from '@/lib/export'
import { toast } from 'sonner'

const filterColumns: ComboboxFilterColumn[] = [
  { value: 'id', label: 'ID' },
  { value: 'classificacao', label: 'Classificação' },
  { value: 'descricao', label: 'Descrição' },
]

const planoColumns = [
  { key: 'classificacao', label: 'Classificação' },
  { key: 'descricao', label: 'Descrição' },
  { key: 'tipo', label: 'Tipo' },
]

type SortColumn = 'classificacao' | 'descricao' | 'tipo'
type SortDirection = 'asc' | 'desc'

const PlanoContasPage = () => {
  const [data, setData] = useState<PlanoConta[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [pdfOpen, setPdfOpen] = useState(false)
  const [editItem, setEditItem] = useState<PlanoConta | null>(null)
  const [tipoFilter, setTipoFilter] = useState<
    'all' | 'analitica' | 'sintetica'
  >('all')
  const [viewMode, setViewMode] = useState<'tree' | 'table'>('tree')
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [filters, setFilters] = useState<ComboboxFilterState>({
    column: '',
    value: '',
    dateRange: undefined,
  })
  const { visibleColumns, toggleColumn } = useColumnVisibility(
    'plano-contas',
    planoColumns.map((c) => c.key),
  )

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) return <ArrowUpDown className="w-3 h-3 ml-1" />
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3 h-3 ml-1" />
    ) : (
      <ArrowDown className="w-3 h-3 ml-1" />
    )
  }

  const filteredData = useMemo(() => {
    const filtered = data
      .filter((p) => {
        if (!filters.column || !filters.value) return true
        const fieldValue = String(p[filters.column as keyof PlanoConta] ?? '')
        return fieldValue.toLowerCase().includes(filters.value.toLowerCase())
      })
      .filter((p) => tipoFilter === 'all' || p.tipo === tipoFilter)

    if (!sortColumn) {
      return [...filtered].sort((a, b) =>
        (a.classificacao ?? '').localeCompare(
          b.classificacao ?? '',
          undefined,
          { numeric: true },
        ),
      )
    }

    return [...filtered].sort((a, b) => {
      const aVal = String(a[sortColumn] ?? '').toLowerCase()
      const bVal = String(b[sortColumn] ?? '').toLowerCase()
      const result =
        sortColumn === 'classificacao'
          ? aVal.localeCompare(bVal, undefined, { numeric: true })
          : aVal.localeCompare(bVal)
      return sortDirection === 'asc' ? result : -result
    })
  }, [data, filters, tipoFilter, sortColumn, sortDirection])

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const result = await fetchAll<PlanoConta>('plano_contas')
      const sorted = [...result].sort((a, b) =>
        (a.classificacao ?? '').localeCompare(
          b.classificacao ?? '',
          undefined,
          {
            numeric: true,
          },
        ),
      )
      setData(sorted)
    } catch {
      toast.error('Erro ao carregar plano de contas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleExport = () => {
    if (filteredData.length === 0) {
      toast.error('Nenhum dado para exportar')
      return
    }
    const headers = ['ID', 'Classificação', 'Descrição', 'Tipo']
    const rows = filteredData.map((item) => [
      item.id,
      item.classificacao,
      item.descricao,
      item.tipo,
    ])
    exportToCsv('plano_contas_data.csv', headers, rows)
    toast.success('CSV exportado com sucesso')
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plano de Contas</h1>
          <p className="text-gray-500">Gerencie seu plano de contas.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setPdfOpen(true)}>
            <FileUp className="w-4 h-4 mr-2" /> Importar PDF
          </Button>
          <PdfExportButton
            title="Plano de Contas"
            columns={[
              { header: 'ID', key: 'id' },
              { header: 'Classificação', key: 'classificacao' },
              { header: 'Descrição', key: 'descricao' },
              { header: 'Tipo', key: 'tipo' },
            ]}
            data={filteredData.map((item) => ({
              id: item.id,
              classificacao: item.classificacao ?? '',
              descricao: item.descricao ?? '',
              tipo: item.tipo ?? '',
            }))}
          />
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" /> Exportar CSV
          </Button>
          <ColumnVisibility
            columns={planoColumns}
            visibleColumns={visibleColumns}
            onToggle={toggleColumn}
          />
          <Button
            onClick={() => {
              setEditItem(null)
              setFormOpen(true)
            }}
          >
            <Plus className="w-4 h-4 mr-2" /> Nova Conta
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-xl bg-white shadow-sm">
          <ListTree className="w-12 h-12 text-gray-300 mb-3" />
          <p className="text-gray-500 mb-2">Nenhuma conta encontrada.</p>
        </div>
      ) : (
        <>
          <ComboboxFilter
            columns={filterColumns}
            filters={filters}
            setFilters={setFilters}
            showDateRange={false}
          />
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 mr-2 border rounded-lg p-1">
              <Button
                variant={viewMode === 'tree' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('tree')}
              >
                <FolderTree className="w-4 h-4 mr-1" /> Árvore
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                <List className="w-4 h-4 mr-1" /> Lista
              </Button>
            </div>
            <span className="text-sm text-gray-500">Tipo:</span>
            {(['all', 'analitica', 'sintetica'] as const).map((t) => (
              <Button
                key={t}
                variant={tipoFilter === t ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTipoFilter(t)}
              >
                {t === 'all'
                  ? 'Todos'
                  : t === 'analitica'
                    ? 'Analítica'
                    : 'Sintética'}
              </Button>
            ))}
            <Badge variant="secondary" className="ml-2">
              {filteredData.length} contas
            </Badge>
          </div>
          {viewMode === 'tree' ? (
            <PlanoContasTree data={filteredData} />
          ) : (
            <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50">
                      <TableHead className="w-[100px]">ID</TableHead>
                      {visibleColumns.classificacao && (
                        <TableHead>
                          <button
                            className="flex items-center hover:text-primary transition-colors font-semibold"
                            onClick={() => handleSort('classificacao')}
                          >
                            Classificação
                            {getSortIcon('classificacao')}
                          </button>
                        </TableHead>
                      )}
                      {visibleColumns.descricao && (
                        <TableHead>
                          <button
                            className="flex items-center hover:text-primary transition-colors font-semibold"
                            onClick={() => handleSort('descricao')}
                          >
                            Descrição
                            {getSortIcon('descricao')}
                          </button>
                        </TableHead>
                      )}
                      {visibleColumns.tipo && (
                        <TableHead>
                          <button
                            className="flex items-center hover:text-primary transition-colors font-semibold"
                            onClick={() => handleSort('tipo')}
                          >
                            Tipo
                            {getSortIcon('tipo')}
                          </button>
                        </TableHead>
                      )}
                      <TableHead className="w-[100px] text-right">
                        Ações
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-xs text-gray-400">
                          #{item.id}
                        </TableCell>
                        {visibleColumns.classificacao && (
                          <TableCell className="font-mono text-gray-600">
                            <span
                              style={{
                                paddingLeft: `${Math.max(0, (item.classificacao?.split('.').length ?? 1) - 1) * 16}px`,
                              }}
                              className={
                                (item.classificacao?.split('.').length ?? 1) ===
                                1
                                  ? 'font-bold uppercase'
                                  : ''
                              }
                            >
                              {item.classificacao}
                            </span>
                          </TableCell>
                        )}
                        {visibleColumns.descricao && (
                          <TableCell
                            className={
                              (item.classificacao?.split('.').length ?? 1) === 1
                                ? 'font-bold uppercase text-gray-900'
                                : 'font-semibold text-gray-900'
                            }
                          >
                            <span
                              style={{
                                paddingLeft: `${Math.max(0, (item.classificacao?.split('.').length ?? 1) - 1) * 16}px`,
                              }}
                            >
                              {item.descricao}
                            </span>
                          </TableCell>
                        )}{' '}
                        {visibleColumns.tipo && (
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={
                                item.tipo === 'analitica'
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'bg-purple-50 text-purple-700'
                              }
                            >
                              {item.tipo}
                            </Badge>
                          </TableCell>
                        )}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-primary hover:bg-primary/10"
                              onClick={() => {
                                setEditItem(item)
                                setFormOpen(true)
                              }}
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
                                  <AlertDialogTitle>
                                    Tem certeza?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta ação excluirá permanentemente a conta.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>
                                    Cancelar
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-red-600 hover:bg-red-700"
                                    onClick={async () => {
                                      await deleteRecord(
                                        'plano_contas',
                                        item.id,
                                      )
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
        </>
      )}

      <PlanoContasForm
        open={formOpen}
        onOpenChange={setFormOpen}
        editItem={editItem}
        onSuccess={loadData}
      />
      <PdfImportModal
        open={pdfOpen}
        onOpenChange={setPdfOpen}
        entityType="plano_contas"
        onSuccess={loadData}
      />
    </div>
  )
}

export default PlanoContasPage
