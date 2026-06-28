import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { ExtratoBancario, Banco } from '@/lib/types'
import { updateExtrato } from '@/services/extratoService'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  editItem: ExtratoBancario | null
  bancos: Banco[]
  onSuccess: () => void
}

export function ExtratoForm({
  open,
  onOpenChange,
  editItem,
  bancos,
  onSuccess,
}: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [data, setData] = useState('')
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('0')
  const [tipo, setTipo] = useState('debit')
  const [bancoId, setBancoId] = useState('')

  useEffect(() => {
    if (editItem) {
      setData(editItem.data)
      setDescricao(editItem.descricao)
      setValor(String(editItem.valor))
      setTipo(editItem.tipo)
      setBancoId(editItem.banco_id.toString())
    } else {
      setData(new Date().toISOString().split('T')[0])
      setDescricao('')
      setValor('0')
      setTipo('debit')
      setBancoId('')
    }
  }, [editItem, open])

  const handleSubmit = async () => {
    if (!editItem) return
    try {
      setSubmitting(true)
      if (!data || !descricao) {
        toast.error('Preencha os campos obrigatórios')
        return
      }
      const numValor = Number(valor)
      if (isNaN(numValor) || numValor <= 0) {
        toast.error('Valor deve ser maior que zero')
        return
      }
      await updateExtrato(editItem.id, {
        data,
        descricao,
        valor: numValor,
        tipo,
      })
      toast.success('Extrato atualizado com sucesso')
      onOpenChange(false)
      onSuccess()
    } catch {
      toast.error('Erro ao salvar extrato')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md w-full">
        <SheetHeader className="mb-6">
          <SheetTitle>Editar Extrato</SheetTitle>
          <SheetDescription>
            Edite os dados do extrato bancário.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4">
          <div>
            <Label className="mb-1.5 block text-sm font-medium">Data</Label>
            <Input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
            />
          </div>
          <div>
            <Label className="mb-1.5 block text-sm font-medium">
              Descrição
            </Label>
            <Input
              placeholder="Descrição..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-1.5 block text-sm font-medium">Valor</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-sm font-medium">Tipo</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="debit">Débito</SelectItem>
                  <SelectItem value="credit">Crédito</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block text-sm font-medium">Banco</Label>
            <Input
              value={
                bancos.find((b) => b.id.toString() === bancoId)?.banco || '-'
              }
              disabled
            />
          </div>
          <SheetFooter>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}
