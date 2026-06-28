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
import { Razao } from '@/lib/types'
import { createRecord, updateRecord } from '@/services/crudService'
import { toast } from 'sonner'

const schema = z.object({
  data: z.string().min(1, 'Data é obrigatória'),
  conta: z.string().min(1, 'Conta é obrigatória'),
  descricao: z.string().min(2, 'Descrição é obrigatória'),
  debito: z.coerce.number().min(0, 'Débito deve ser >= 0'),
  credito: z.coerce.number().min(0, 'Crédito deve ser >= 0'),
  saldo: z.coerce.number(),
})

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  editItem?: Razao | null
  onSuccess: () => void
}

export function RazaoForm({ open, onOpenChange, editItem, onSuccess }: Props) {
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      data: new Date().toISOString().split('T')[0],
      conta: '',
      descricao: '',
      debito: 0,
      credito: 0,
      saldo: 0,
    },
  })

  useEffect(() => {
    if (editItem) {
      form.reset({
        data: editItem.data,
        conta: editItem.conta,
        descricao: editItem.descricao,
        debito: editItem.debito,
        credito: editItem.credito,
        saldo: editItem.saldo,
      })
    } else {
      form.reset({
        data: new Date().toISOString().split('T')[0],
        conta: '',
        descricao: '',
        debito: 0,
        credito: 0,
        saldo: 0,
      })
    }
  }, [editItem, form, open])

  async function onSubmit(values: z.infer<typeof schema>) {
    try {
      setSubmitting(true)
      if (editItem) {
        await updateRecord('razao', editItem.id, values)
        toast.success('Lançamento atualizado com sucesso')
      } else {
        await createRecord('razao', values)
        toast.success('Lançamento criado com sucesso')
      }
      onOpenChange(false)
      onSuccess()
    } catch {
      toast.error('Erro ao salvar lançamento')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md w-full">
        <SheetHeader className="mb-6">
          <SheetTitle>
            {editItem ? 'Editar Lançamento' : 'Novo Lançamento'}
          </SheetTitle>
          <SheetDescription>
            {editItem
              ? 'Edite os dados do lançamento contábil.'
              : 'Adicione um novo lançamento ao razão.'}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="data"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="conta"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conta</FormLabel>
                    <FormControl>
                      <Input placeholder="1.1.01.001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Descrição do lançamento..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="debito"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Débito</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="credito"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Crédito</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="saldo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Saldo</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
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
                  'Criar Lançamento'
                )}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
