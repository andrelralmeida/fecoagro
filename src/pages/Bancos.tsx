import { useState, useEffect, useCallback } from 'react'
import { Plus, FileUp, Edit, Trash2, Landmark } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { Banco } from '@/lib/types'
import { fetchAll, deleteRecord } from '@/services/crudService'
import { toast } from 'sonner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    v,
  )

const BancosPage = () => {
  const [data, setData] = useState<Banco[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [pdfOpen, setPdfOpen] = useState(false)
  const [editItem, setEditItem] = useState<Banco | null>(null)
  const [bankFilter, setBankFilter] = useState('all')

  const filteredData =
    bankFilter === 'all' ? data : data.filter((b) => b.banco === bankFilter)

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

  const totalSaldo = data.reduce((sum, b) => sum + b.saldo_atual, 0)

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bancos</h1>
          <p className="text-gray-500">
            Gerencie suas contas bancárias e saldos.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setPdfOpen(true)}>
            <FileUp className="w-4 h-4 mr-2" /> Importar PDF
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" /> Nova Conta
          </Button>
        </div>
      </div>

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
        {data.length > 0 && (
          <Select value={bankFilter} onValueChange={setBankFilter}>
            <SelectTrigger className="w-[200px] bg-white">
              <SelectValue placeholder="Filtrar por banco" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Bancos</SelectItem>
              {[...new Set(data.map((b) => b.banco))].map((b) => (
                <SelectItem key={b} value={b}>
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50">
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead>Banco</TableHead>
                <TableHead>Agência</TableHead>
                <TableHead>Conta Corrente</TableHead>
                <TableHead className="text-right">Saldo Atual</TableHead>
                <TableHead className="w-[100px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-xs text-gray-400">
                    {item.id.substring(0, 8)}
                  </TableCell>
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
                  <TableCell className="text-gray-600 font-mono text-sm">
                    {item.agencia}
                  </TableCell>
                  <TableCell className="text-gray-600 font-mono text-sm">
                    {item.conta_corrente}
                  </TableCell>
                  <TableCell
                    className={`text-right font-bold ${item.saldo_atual >= 0 ? 'text-gray-900' : 'text-red-600'}`}
                  >
                    {formatCurrency(item.saldo_atual)}
                  </TableCell>
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
