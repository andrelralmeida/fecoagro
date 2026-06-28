import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import {
  Transacao,
  TipoTransacao,
  PlanoConta,
  CentroCusto,
  Atividade,
} from '@/lib/types'
import { auxiliaryService } from '@/services/auxiliaryService'
import { transactionService } from '@/services/transactionService'
import { toast } from 'sonner'
import { format } from 'date-fns'

const schema = z.object({
  data: z.string().min(1, 'Data é obrigatória'),
  descricao: z.string().min(2, 'Descrição é obrigatória'),
  valor: z.coerce.number().positive('Valor deve ser positivo'),
  tipo_id: z.enum(['Receita', 'Despesa']),
  observacoes: z.string().optional(),
  centro_custo_id: z.string().optional(),
  atividade_id: z.string().optional(),
  plano_conta_id: z.string().optional(),
})

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  transactionToEdit?: Transacao | null
  onSuccess?: () => void
}

export function TransactionForm({
  open,
  onOpenChange,
  transactionToEdit,
  onSuccess,
}: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [planoContas, setPlanoContas] = useState<PlanoConta[]>([])
  const [centroCustos, setCentroCustos] = useState<CentroCusto[]>([])
  const [atividades, setAtividades] = useState<Atividade[]>([])

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      data: format(new Date(), 'yyyy-MM-dd'),
      descricao: '',
      valor: 0,
      tipo_id: 'Receita',
      observacoes: '',
      centro_custo_id: '',
      atividade_id: '',
      plano_conta_id: '',
    },
  })

  useEffect(() => {
    if (open) {
      auxiliaryService
        .fetchPlanoContas()
        .then(setPlanoContas)
        .catch(() => {})
      auxiliaryService
        .fetchCentroCustos()
        .then(setCentroCustos)
        .catch(() => {})
      auxiliaryService
        .fetchAtividades()
        .then(setAtividades)
        .catch(() => {})
    }
  }, [open])

  useEffect(() => {
    if (transactionToEdit) {
      form.reset({
        data: format(transactionToEdit.data, 'yyyy-MM-dd'),
        descricao: transactionToEdit.descricao,
        valor: transactionToEdit.valor,
        tipo_id:
          (transactionToEdit.tipo_id as 'Receita' | 'Despesa') || 'Receita',
        observacoes: transactionToEdit.observacoes || '',
        centro_custo_id: transactionToEdit.centro_custo_id
          ? String(transactionToEdit.centro_custo_id)
          : '',
        atividade_id: transactionToEdit.atividade_id
          ? String(transactionToEdit.atividade_id)
          : '',
        plano_conta_id: transactionToEdit.plano_conta_id
          ? String(transactionToEdit.plano_conta_id)
          : '',
      })
    } else {
      form.reset({
        data: format(new Date(), 'yyyy-MM-dd'),
        descricao: '',
        valor: 0,
        tipo_id: 'Receita',
        observacoes: '',
        centro_custo_id: '',
        atividade_id: '',
        plano_conta_id: '',
      })
    }
  }, [transactionToEdit, form, open])

  async function onSubmit(values: z.infer<typeof schema>) {
    try {
      setSubmitting(true)
      const transaction: Omit<Transacao, 'id'> = {
        data: new Date(values.data),
        descricao: values.descricao,
        valor: values.valor,
        tipo_id: values.tipo_id as TipoTransacao,
        observacoes: values.observacoes,
        centro_custo_id: values.centro_custo_id
          ? Number(values.centro_custo_id)
          : undefined,
        atividade_id: values.atividade_id
          ? Number(values.atividade_id)
          : undefined,
        plano_conta_id: values.plano_conta_id
          ? Number(values.plano_conta_id)
          : undefined,
      }

      if (transactionToEdit) {
        await transactionService.updateTransaction(
          transactionToEdit.id,
          transaction,
        )
        toast.success('Transação atualizada')
      } else {
        await transactionService.createTransaction(transaction)
        toast.success('Transação criada')
      }
      onOpenChange(false)
      onSuccess?.()
    } catch {
      toast.error('Erro ao salvar transação')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md w-full">
        <SheetHeader className="mb-6">
          <SheetTitle>
            {transactionToEdit ? 'Editar Transação' : 'Nova Transação'}
          </SheetTitle>
          <SheetDescription>
            {transactionToEdit
              ? 'Edite os dados da transação.'
              : 'Adicione uma nova transação.'}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input placeholder="Descrição da transação..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="valor"
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
                name="tipo_id"
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
                        <SelectItem value="Receita">Receita</SelectItem>
                        <SelectItem value="Despesa">Despesa</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observações adicionais..."
                      {...field}
                    />
                  </FormControl>
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
                        <SelectValue placeholder="Selecionar..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {planoContas.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.classificacao} - {p.descricao}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="centro_custo_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Centro de Custos</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecionar..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {centroCustos.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.centro_de_custos}
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
                name="atividade_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Atividade</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecionar..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {atividades.map((a) => (
                          <SelectItem key={a.id} value={String(a.id)}>
                            {a.atividade}
                          </SelectItem>
                        ))}
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
                ) : transactionToEdit ? (
                  'Salvar Alterações'
                ) : (
                  'Criar Transação'
                )}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
