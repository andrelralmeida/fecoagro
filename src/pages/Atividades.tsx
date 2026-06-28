import { useState, useEffect, useCallback } from 'react'
import { Plus, FileUp, Edit, Trash2, Briefcase } from 'lucide-react'
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
import { AtividadesForm } from '@/components/forms/AtividadesForm'
import { PdfImportModal } from '@/components/pdf/PdfImportModal'
import { Atividade } from '@/lib/types'
import { fetchAll, deleteRecord } from '@/services/crudService'
import { toast } from 'sonner'

const AtividadesPage = () => {
  const [data, setData] = useState<Atividade[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [pdfOpen, setPdfOpen] = useState(false)
  const [editItem, setEditItem] = useState<Atividade | null>(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const result = await fetchAll<Atividade>('atividades')
      setData(result)
    } catch {
      toast.error('Erro ao carregar atividades')
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
          <h1 className="text-2xl font-bold text-gray-900">Atividades</h1>
          <p className="text-gray-500">Gerencie suas atividades.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setPdfOpen(true)}>
            <FileUp className="w-4 h-4 mr-2" /> Importar PDF
          </Button>
          <Button
            onClick={() => {
              setEditItem(null)
              setFormOpen(true)
            }}
          >
            <Plus className="w-4 h-4 mr-2" /> Nova Atividade
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-xl bg-white shadow-sm">
          <Briefcase className="w-12 h-12 text-gray-300 mb-3" />
          <p className="text-gray-500 mb-2">Nenhuma atividade encontrada.</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50">
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead>Atividade</TableHead>
                <TableHead className="w-[100px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-xs text-gray-400">
                    {item.id.substring(0, 8)}
                  </TableCell>
                  <TableCell className="font-semibold text-gray-900">
                    {item.atividade}
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
                              Esta ação excluirá permanentemente a atividade.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-600 hover:bg-red-700"
                              onClick={async () => {
                                await deleteRecord('atividades', item.id)
                                setData((prev) =>
                                  prev.filter((i) => i.id !== item.id),
                                )
                                toast.success('Atividade excluída')
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

      <AtividadesForm
        open={formOpen}
        onOpenChange={setFormOpen}
        editItem={editItem}
        onSuccess={loadData}
      />
      <PdfImportModal
        open={pdfOpen}
        onOpenChange={setPdfOpen}
        entityType="atividades"
        onSuccess={loadData}
      />
    </div>
  )
}

export default AtividadesPage
