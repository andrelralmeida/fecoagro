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
import { Checkbox } from '@/components/ui/checkbox'
import {
  Transacao,
  Atividade,
  CentroCusto,
  PlanoConta,
  NotaFiscal,
} from '@/lib/types'
import { createRecord, updateRecord } from '@/services/crudService'
import { toast } from 'sonner'
import {
  atividadeOptions,
  centroCustoOptions,
  planoContaOptions,
  notaFiscalOptions,
} from '@/lib/relational-format'

const schema = z.object({
  date: z.string().min(1, 'Data é obrigatória'),
  historico: z.string().min(1, 'Histórico é obrigatório'),
  amount: z.coerce.number().min(0.01, 'Valor deve ser maior que 0'),
  status: z.string(),
  atividade_id: z.string().optional(),
  centro_custo_id: z.string().optional(),
  plano_conta_id: z.string().optional(),
  nota_fiscal_id: z.string().optional(),
  reconciled: z.boolean(),
})

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  transactionToEdit: Transacao | null
  onSuccess: () => void
  atividades: Atividade[]
  centroCustos: CentroCusto[]
  planoContas: PlanoConta[]
  notasFiscais: NotaFiscal[]
}

export function TransactionForm({
  open,
  onOpenChange,
  transactionToEdit,
  onSuccess,
  atividades,
  centroCustos,
  planoContas,
  notasFiscais,
}: Props) {
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      historico: '',
      amount: 0,
      status: 'pendente',
      atividade_id: '',
      centro_custo_id: '',
      plano_conta_id: '',
      nota_fiscal_id: '',
      reconciled: false,
    },
  })

  useEffect(() => {
    if (transactionToEdit) {
      form.reset({
        date: transactionToEdit.date,
        historico: transactionToEdit.historico || '',
        amount: transactionToEdit.amount,
        status: transactionToEdit.status || 'pendente',
        atividade_id: transactionToEdit.atividade_id
          ? String(transactionToEdit.atividade_id)
          : '',
        centro_custo_id: transactionToEdit.centro_custo_id
          ? String(transactionToEdit.centro_custo_id)
          : '',
        plano_conta_id: transactionToEdit.plano_conta_id
          ? String(transactionToEdit.plano_conta_id)
          : '',
        nota_fiscal_id: transactionToEdit.nota_fiscal_id
          ? String(transactionToEdit.nota_fiscal_id)
          : '',
        reconciled: transactionToEdit.reconciled,
      })
    } else {
      form.reset({
        date: new Date().toISOString().split('T')[0],
        historico: '',
        amount: 0,
        status: 'pendente',
        atividade_id: '',
        centro_custo_id: '',
        plano_conta_id: '',
        nota_fiscal_id: '',
        reconciled: false,
      })
    }
  }, [transactionToEdit, form, open])

  async function onSubmit(values: z.infer<typeof schema>) {
    try {
      setSubmitting(true)
      const payload = {
        date: values.date,
        historico: values.historico,
        amount: values.amount,
        status: values.status,
        atividade_id: values.atividade_id ? Number(values.atividade_id) : null,
        centro_custo_id: values.centro_custo_id
          ? Number(values.centro_custo_id)
          : null,
        plano_conta_id: values.plano_conta_id
          ? Number(values.plano_conta_id)
          : null,
        nota_fiscal_id: values.nota_fiscal_id
          ? Number(values.nota_fiscal_id)
          : null,
        reconciled: values.reconciled,
      }
      if (transactionToEdit) {
        await updateRecord('critica', transactionToEdit.id, payload)
        toast.success('Crítica atualizada com sucesso')
      } else {
        await createRecord('critica', payload)
        toast.success('Crítica criada com sucesso')
      }
      onOpenChange(false)
      onSuccess()
    } catch {
      toast.error('Erro ao salvar crítica')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md w-full">
        <SheetHeader className="mb-6">
          <SheetTitle>
            {transactionToEdit ? 'Editar Crítica' : 'Nova Crítica'}
          </SheetTitle>
          <SheetDescription>
            {transactionToEdit
              ? 'Edite os dados da crítica contábil.'
              : 'Adicione uma nova crítica contábil.'}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="date"
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
              name="historico"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Histórico</FormLabel>
                  <FormControl>
                    <Input placeholder="Descrição do histórico..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        {...field}
                      />
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
                        <SelectItem value="concluido">Concluído</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="atividade_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Atividade</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {atividadeOptions(atividades).map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="centro_custo_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Centro de Custos</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {centroCustoOptions(centroCustos).map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="plano_conta_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plano de Contas</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {planoContaOptions(planoContas).map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nota_fiscal_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nota Fiscal</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {notaFiscalOptions(notasFiscais).map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reconciled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Reconciliado</FormLabel>
                  </div>
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
                ) : transactionToEdit ? (
                  'Salvar Alterações'
                ) : (
                  'Criar Crítica'
                )}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
