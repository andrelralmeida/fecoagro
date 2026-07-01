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
import { PlanoConta } from '@/lib/types'
import { createRecord, updateRecord } from '@/services/crudService'
import { suggestNatureza } from '@/lib/account-utils'
import { getErrorMessage } from '@/lib/error-utils'
import { toast } from 'sonner'

const schema = z.object({
  classificacao: z.string().min(1, 'Classificação é obrigatória'),
  descricao: z.string().min(2, 'Descrição é obrigatória'),
  tipo: z.enum(['analitica', 'sintetica']),
  natureza: z.enum(['Devedora', 'Credora']),
})

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  editItem?: PlanoConta | null
  onSuccess: () => void
}

export function PlanoContasForm({
  open,
  onOpenChange,
  editItem,
  onSuccess,
}: Props) {
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      classificacao: '',
      descricao: '',
      tipo: 'analitica',
      natureza: 'Devedora',
    },
  })

  const watchedClassificacao = form.watch('classificacao')

  useEffect(() => {
    if (editItem) {
      const suggested = suggestNatureza(editItem.classificacao || '')
      form.reset({
        classificacao: editItem.classificacao || '',
        descricao: editItem.descricao || '',
        tipo: (editItem.tipo as 'analitica' | 'sintetica') || 'analitica',
        natureza:
          (editItem.natureza as 'Devedora' | 'Credora') ||
          ((suggested || 'Devedora') as 'Devedora' | 'Credora'),
      })
    } else {
      form.reset({
        classificacao: '',
        descricao: '',
        tipo: 'analitica',
        natureza: 'Devedora',
      })
    }
  }, [editItem, form, open])

  useEffect(() => {
    const suggested = suggestNatureza(watchedClassificacao)
    if (suggested) {
      form.setValue('natureza', suggested)
    }
  }, [watchedClassificacao, form])

  async function onSubmit(values: z.infer<typeof schema>) {
    try {
      setSubmitting(true)
      if (editItem) {
        await updateRecord('plano_contas', editItem.id, values)
        toast.success('Conta atualizada')
      } else {
        await createRecord('plano_contas', values)
        toast.success('Conta criada')
      }
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      toast.error(getErrorMessage(error, 'Erro ao salvar conta'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md w-full">
        <SheetHeader className="mb-6">
          <SheetTitle>{editItem ? 'Editar Conta' : 'Nova Conta'}</SheetTitle>
          <SheetDescription>
            {editItem ? 'Edite os dados.' : 'Adicione uma nova conta ao plano.'}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="classificacao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Classificação</FormLabel>
                  <FormControl>
                    <Input placeholder="1.1.01.001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input placeholder="Receitas de Vendas..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="analitica">Analítica</SelectItem>
                      <SelectItem value="sintetica">Sintética</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="natureza"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Natureza (auto-sugerida)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Devedora">Devedora</SelectItem>
                      <SelectItem value="Credora">Credora</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                  'Criar Conta'
                )}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
