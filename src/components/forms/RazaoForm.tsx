import { useEffect, useMemo, useState } from 'react'
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
import { Razao, PlanoConta, Filial, Atividade, CentroCusto } from '@/lib/types'
import { createRecord, updateRecord } from '@/services/crudService'
import { auxiliaryService } from '@/services/auxiliaryService'
import { toast } from 'sonner'
import { filialOptions } from '@/lib/filial-format'
import { atividadeOptions, centroCustoOptions } from '@/lib/relational-format'
import { isAnalyticalAccount } from '@/lib/account-utils'
import { getErrorMessage } from '@/lib/error-utils'

const schema = z.object({
  data: z.string().min(1, 'Data é obrigatória'),
  historico: z.string().min(2, 'Histórico é obrigatório'),
  debito: z.coerce.number().min(0, 'Débito deve ser >= 0'),
  credito: z.coerce.number().min(0, 'Crédito deve ser >= 0'),
  saldo: z.coerce.number(),
  plano_conta_id: z.string().min(1, 'Conta é obrigatória'),
  lote: z.coerce.number().int().optional().nullable(),
  filial_id: z.string().optional(),
  atividade_id: z.string().optional(),
  centro_custo_id: z.string().optional(),
})

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  editItem?: Razao | null
  onSuccess: () => void
  filiais: Filial[]
}

export function RazaoForm({
  open,
  onOpenChange,
  editItem,
  onSuccess,
  filiais,
}: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [planoContas, setPlanoContas] = useState<PlanoConta[]>([])
  const [atividades, setAtividades] = useState<Atividade[]>([])
  const [centroCustos, setCentroCustos] = useState<CentroCusto[]>([])

  useEffect(() => {
    auxiliaryService
      .fetchPlanoContas()
      .then(setPlanoContas)
      .catch(() => {})
    auxiliaryService
      .fetchAtividades()
      .then(setAtividades)
      .catch(() => {})
    auxiliaryService
      .fetchCentroCustos()
      .then(setCentroCustos)
      .catch(() => {})
  }, [])

  const analyticalPlanoContas = useMemo(() => {
    const allClassifications = planoContas.map((p) => p.classificacao ?? '')
    return planoContas.filter((p) =>
      isAnalyticalAccount(p.classificacao ?? '', allClassifications),
    )
  }, [planoContas])

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      data: new Date().toISOString().split('T')[0],
      historico: '',
      debito: 0,
      credito: 0,
      saldo: 0,
      plano_conta_id: '',
      lote: null,
      filial_id: '',
      atividade_id: '',
      centro_custo_id: '',
    },
  })

  useEffect(() => {
    if (editItem) {
      form.reset({
        data: editItem.data,
        historico: editItem.historico || editItem.descricao,
        debito: editItem.debito,
        credito: editItem.credito,
        saldo: editItem.saldo,
        plano_conta_id: editItem.plano_conta_id
          ? String(editItem.plano_conta_id)
          : '',
        lote: editItem.lote ?? null,
        filial_id: editItem.filial_id ? String(editItem.filial_id) : '',
        atividade_id: editItem.atividade_id
          ? String(editItem.atividade_id)
          : '',
        centro_custo_id: editItem.centro_custo_id
          ? String(editItem.centro_custo_id)
          : '',
      })
    } else {
      form.reset({
        data: new Date().toISOString().split('T')[0],
        historico: '',
        debito: 0,
        credito: 0,
        saldo: 0,
        plano_conta_id: '',
        lote: null,
        filial_id: '',
        atividade_id: '',
        centro_custo_id: '',
      })
    }
  }, [editItem, form, open])

  async function onSubmit(values: z.infer<typeof schema>) {
    try {
      setSubmitting(true)
      const selected = planoContas.find(
        (p) => String(p.id) === values.plano_conta_id,
      )
      const payload = {
        data: values.data,
        conta: selected?.classificacao || '',
        historico: values.historico,
        debito: values.debito,
        credito: values.credito,
        saldo: values.saldo,
        plano_conta_id: Number(values.plano_conta_id),
        lote: values.lote || null,
        filial_id: values.filial_id ? Number(values.filial_id) : null,
        atividade_id: values.atividade_id ? Number(values.atividade_id) : null,
        centro_custo_id: values.centro_custo_id
          ? Number(values.centro_custo_id)
          : null,
      }
      if (editItem) {
        await updateRecord('razao', editItem.id, payload)
        toast.success('Lançamento atualizado com sucesso')
      } else {
        await createRecord('razao', payload)
        toast.success('Lançamento criado com sucesso')
      }
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      toast.error(getErrorMessage(error, 'Erro ao salvar lançamento'))
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
            <FormField
              control={form.control}
              name="plano_conta_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conta</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma conta..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {analyticalPlanoContas.map((pc) => (
                        <SelectItem key={pc.id} value={String(pc.id)}>
                          {pc.id} - {pc.descricao}
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
              name="historico"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Histórico</FormLabel>
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
            <FormField
              control={form.control}
              name="lote"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lote</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="1"
                      placeholder="Número do lote"
                      value={field.value ?? ''}
                      onChange={(e) => {
                        const val = e.target.value
                        field.onChange(val === '' ? null : parseInt(val, 10))
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="filial_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Filial</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma filial..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filialOptions(filiais).map((opt) => (
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
                        <SelectValue placeholder="Selecione uma atividade..." />
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
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um centro de custos..." />
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
