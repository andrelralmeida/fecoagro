import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { NotaFiscal } from '@/lib/types'
import { createRecord, updateRecord } from '@/services/crudService'
import { toast } from 'sonner'

const schema = z.object({
  numero_nota: z.string().min(1, 'Número é obrigatório'),
  data_emissao: z.string().min(1, 'Data é obrigatória'),
  emissor: z.string().min(2, 'Emissor é obrigatório'),
  valor_total: z.coerce.number().min(0.01, 'Valor deve ser maior que 0'),
  status: z.string().min(1, 'Status é obrigatório'),
})

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  editItem?: NotaFiscal | null
  onSuccess: () => void
}

export function NotasFiscaisForm({
  open,
  onOpenChange,
  editItem,
  onSuccess,
}: Props) {
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      numero_nota: '',
      data_emissao: new Date().toISOString().split('T')[0],
      emissor: '',
      valor_total: 0,
      status: 'pendente',
    },
  })

  useEffect(() => {
    if (editItem) {
      form.reset({
        numero_nota: editItem.numero_nota,
        data_emissao: editItem.data_emissao,
        emissor: editItem.emissor,
        valor_total: editItem.valor_total,
        status: editItem.status,
      })
    } else {
      form.reset({
        numero_nota: '',
        data_emissao: new Date().toISOString().split('T')[0],
        emissor: '',
        valor_total: 0,
        status: 'pendente',
      })
    }
  }, [editItem, form, open])

  async function onSubmit(values: z.infer<typeof schema>) {
    try {
      setSubmitting(true)
      if (editItem) {
        await updateRecord('notas_fiscais', editItem.id, values)
        toast.success('Nota fiscal atualizada com sucesso')
      } else {
        await createRecord('notas_fiscais', values)
        toast.success('Nota fiscal criada com sucesso')
      }
      onOpenChange(false)
      onSuccess()
    } catch {
      toast.error('Erro ao salvar nota fiscal')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md w-full">
        <SheetHeader className="mb-6">
          <SheetTitle>
            {editItem ? 'Editar Nota Fiscal' : 'Nova Nota Fiscal'}
          </SheetTitle>
          <SheetDescription>
            {editItem
              ? 'Edite os dados da nota fiscal.'
              : 'Adicione uma nova nota fiscal.'}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="numero_nota"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número da Nota</FormLabel>
                  <FormControl>
                    <Input placeholder="NF-001234" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="data_emissao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Emissão</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="emissor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Emissor</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do emissor..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="valor_total"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Total</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="aprovada">Aprovada</SelectItem>
                        <SelectItem value="cancelada">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <SheetFooter>
              <Button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : editItem ? (
                  'Salvar Alterações'
                ) : (
                  'Criar Nota Fiscal'
                )}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
