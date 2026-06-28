import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarIcon, Loader2, ChevronsUpDown, Check } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Transacao, FormaPagamento, NotaFiscal } from '@/lib/types'
import useTransactionStore from '@/stores/useTransactionStore'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'

const formSchema = z.object({
  data: z.date({ required_error: 'Data é obrigatória' }),
  centro_custo_id: z.string().min(1, 'Centro de custo é obrigatório'),
  atividade_id: z.string().min(1, 'Atividade é obrigatória'),
  plano_conta_id: z.string().min(1, 'Descrição da conta é obrigatória'),
  descricao: z
    .string()
    .min(2, { message: 'A descrição deve ter pelo menos 2 caracteres.' }),
  valor: z.coerce
    .number()
    .min(0.01, { message: 'O valor deve ser maior que 0.' }),
  categoria_id: z.string({
    required_error: 'Por favor selecione uma categoria.',
  }),
  forma_pagamento_id: z.nativeEnum(FormaPagamento, {
    required_error: 'Por favor selecione uma forma de pagamento.',
  }),
  observacoes: z.string().optional(),
  nota_fiscal_id: z.string().optional(),
})

interface TransactionFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transactionToEdit?: Transacao | null
}

export function TransactionForm({
  open,
  onOpenChange,
  transactionToEdit,
}: TransactionFormProps) {
  const {
    categories,
    centroCustos,
    atividades,
    planoContas,
    addTransaction,
    updateTransaction,
  } = useTransactionStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notasFiscais, setNotasFiscais] = useState<NotaFiscal[]>([])

  useEffect(() => {
    const fetchNotas = async () => {
      const { data } = await supabase
        .from('notas_fiscais')
        .select('*')
        .order('created_at', { ascending: false })
      if (data) setNotasFiscais(data as NotaFiscal[])
    }
    fetchNotas()
  }, [])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      descricao: '',
      valor: 0,
      observacoes: '',
      categoria_id: '',
      centro_custo_id: '',
      atividade_id: '',
      plano_conta_id: '',
      forma_pagamento_id: FormaPagamento.CartaoCredito,
      data: new Date(),
      nota_fiscal_id: '',
    },
  })

  useEffect(() => {
    if (transactionToEdit) {
      form.reset({
        data: transactionToEdit.data,
        descricao: transactionToEdit.descricao,
        valor: transactionToEdit.valor,
        categoria_id: transactionToEdit.categoria_id,
        centro_custo_id: transactionToEdit.centro_custo_id || '',
        atividade_id: transactionToEdit.atividade_id || '',
        plano_conta_id: transactionToEdit.plano_conta_id || '',
        forma_pagamento_id: transactionToEdit.forma_pagamento_id,
        observacoes: transactionToEdit.observacoes || '',
        nota_fiscal_id: transactionToEdit.nota_fiscal_id || '',
      })
    } else {
      form.reset({
        descricao: '',
        valor: 0,
        observacoes: '',
        categoria_id: '',
        centro_custo_id: '',
        atividade_id: '',
        plano_conta_id: '',
        forma_pagamento_id: FormaPagamento.CartaoCredito,
        data: new Date(),
        nota_fiscal_id: '',
      })
    }
  }, [transactionToEdit, form, open])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true)
      if (transactionToEdit) {
        await updateTransaction(transactionToEdit.id, values)
        toast.success('Crítica atualizada com sucesso')
      } else {
        await addTransaction(values)
        toast.success('Crítica criada com sucesso')
      }
      onOpenChange(false)
      form.reset()
    } catch {
      toast.error('Falha ao salvar crítica')
    } finally {
      setIsSubmitting(false)
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
              ? 'Faça alterações na sua crítica aqui.'
              : 'Adicione uma nova crítica aos seus registros.'}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="data"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground',
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP', { locale: ptBR })
                          ) : (
                            <span>Selecione uma data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date('1900-01-01')
                        }
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="centro_custo_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Centro de Custo</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {centroCustos.map((cc) => (
                        <SelectItem key={cc.id} value={cc.id}>
                          {cc.centro_de_custos}
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
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {atividades.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.atividade}
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
                <FormItem className="flex flex-col">
                  <FormLabel>Descrição da Conta</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          role="combobox"
                          className={cn(
                            'w-full justify-between font-normal',
                            !field.value && 'text-muted-foreground',
                          )}
                        >
                          {field.value
                            ? planoContas.find((pc) => pc.id === field.value)
                                ?.descricao
                            : 'Buscar conta...'}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent
                      className="p-0"
                      align="start"
                      style={{ width: 'var(--radix-popover-trigger-width)' }}
                    >
                      <Command>
                        <CommandInput placeholder="Buscar conta..." />
                        <CommandList>
                          <CommandEmpty>Nenhuma conta encontrada.</CommandEmpty>
                          <CommandGroup>
                            {planoContas.map((pc) => (
                              <CommandItem
                                key={pc.id}
                                value={pc.descricao || ''}
                                onSelect={() => {
                                  form.setValue('plano_conta_id', pc.id, {
                                    shouldValidate: true,
                                  })
                                }}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    pc.id === field.value
                                      ? 'opacity-100'
                                      : 'opacity-0',
                                  )}
                                />
                                {pc.descricao}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
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
                    <Input placeholder="Compras de mercado..." {...field} />
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
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="categoria_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="forma_pagamento_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Forma de Pagamento</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o método" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(FormaPagamento).map((method) => (
                        <SelectItem key={method} value={method}>
                          {method}
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
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notas adicionais..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nota_fiscal_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nota Fiscal (Opcional)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma nota fiscal..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {notasFiscais.map((nf) => (
                        <SelectItem key={nf.id} value={nf.id}>
                          {nf.numero_nota} — {nf.emissor}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <SheetFooter>
              <Button
                type="submit"
                className="w-full sm:w-auto"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
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
