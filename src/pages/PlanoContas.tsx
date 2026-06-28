import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit, Trash2, ListTree } from 'lucide-react'
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
import {
  ComboboxFilter,
  ComboboxFilterState,
  ComboboxFilterColumn,
} from '@/components/ComboboxFilter'
import { PlanoConta } from '@/lib/types'
import { fetchAll, deleteRecord } from '@/services/crudService'
import { toast } from 'sonner'

const filterColumns: ComboboxFilterColumn[] = [
  { value: 'id', label: 'ID' },
  { value: 'classificacao', label: 'Classificação' },
  { value: 'descricao', label: 'Descrição' },
]

const PlanoContasPage = () => {
  const [data, setData] = useState<PlanoConta[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editItem, setEditItem] = useState<PlanoConta | null>(null)
  const [filters, setFilters] = useState<ComboboxFilterState>({
    column: '',
    value: '',
    dateRange: undefined,
  })

  const filteredData = data.filter((p) => {
    if (!filters.column || !filters.value) return true
    const fieldValue = String(p[filters.column as keyof PlanoConta] ?? '')
    return fieldValue.toLowerCase().includes(filters.value.toLowerCase())
  })

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const result = await fetchAll<PlanoConta>('plano_contas')
      setData(result)
    } catch {
      toast.error('Erro ao carregar plano de contas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plano de Contas</h1>
          <p className="text-gray-500">Gerencie seu plano de contas.</p>
        </div>
        <Button
          onClick={() => {
            setEditItem(null)
            setFormOpen(true)
          }}
        >
          <Plus className="w-4 h-4 mr-2" /> Nova Conta
        </Button>
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

          <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Classificação</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="w-[100px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-xs text-gray-400">
                      #{item.id}
                    </TableCell>
                    <TableCell className="font-mono text-gray-600">
                      {item.classificacao}
                    </TableCell>
                    <TableCell className="font-semibold text-gray-900">
                      {item.descricao}
                    </TableCell>
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
                              <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação excluirá permanentemente a conta.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-red-600 hover:bg-red-700"
                                onClick={async () => {
                                  await deleteRecord('plano_contas', item.id)
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
        </>
      )}

      <PlanoContasForm
        open={formOpen}
        onOpenChange={setFormOpen}
        editItem={editItem}
        onSuccess={loadData}
      />
    </div>
  )
}

export default PlanoContasPage
