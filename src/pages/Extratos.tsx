import { useState, useEffect, useCallback } from 'react'
import {
  Landmark,
  FileUp,
  CheckCircle2,
  Circle,
  Loader2,
  Zap,
  Eye,
  Search,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Banco, Razao, TipoTransacao } from '@/lib/types'
import { fetchAll } from '@/services/crudService'
import { reconciliationService } from '@/services/reconciliationService'
import { supabase } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { PdfImportModal } from '@/components/pdf/PdfImportModal'
import { StatementViewDialog } from '@/components/StatementViewDialog'

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(v)

export default function Extratos() {
  const [bancos, setBancos] = useState<Banco[]>([])
  const [razaoEntries, setRazaoEntries] = useState<Razao[]>([])
  const [loading, setLoading] = useState(true)
  const [pdfOpen, setPdfOpen] = useState(false)
  const [reconciling, setReconciling] = useState<string | null>(null)
  const [autoReconciling, setAutoReconciling] = useState(false)
  const [selectedBancoId, setSelectedBancoId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewItem, setViewItem] = useState<Razao | null>(null)
  const [viewOpen, setViewOpen] = useState(false)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [bancosData, razaoData] = await Promise.all([
        fetchAll<Banco>('bancos'),
        fetchAll<Razao>('razao'),
      ])
      setBancos(bancosData)
      setRazaoEntries(razaoData)
    } catch {
      toast.error('Erro ao carregar extratos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const totalBalance = bancos.reduce((sum, b) => sum + b.saldo_atual, 0)

  const filteredRazao = razaoEntries.filter((r) => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      r.descricao.toLowerCase().includes(term) ||
      r.conta.toLowerCase().includes(term)
    )
  })

  const handleReconcile = async (id: string) => {
    try {
      setReconciling(id)
      const { error } = await supabase
        .from('critica')
        .update({ reconciled: true })
        .eq('id', id)
      if (error) throw error
      toast.success('Transação reconciliada com sucesso')
      await loadData()
    } catch {
      toast.error('Erro ao reconciliar transação')
    } finally {
      setReconciling(null)
    }
  }

  const handleAutoReconcile = async () => {
    try {
      setAutoReconciling(true)
      toast.info('Iniciando reconciliação automática...')
      const result = await reconciliationService.autoReconcile()
      if (result.matched > 0) {
        toast.success(
          `${result.matched} de ${result.total} transações reconciliadas automaticamente!`,
        )
      } else {
        toast.info(
          `Nenhuma correspondência encontrada para ${result.total} transações pendentes.`,
        )
      }
      await loadData()
    } catch {
      toast.error('Erro na reconciliação automática')
    } finally {
      setAutoReconciling(false)
    }
  }

  const handleView = (item: Razao) => {
    setViewItem(item)
    setViewOpen(true)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Extratos Bancários
          </h1>
          <p className="text-gray-500">
            Acompanhe movimentações, saldos e reconciliação.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleAutoReconcile}
            disabled={autoReconciling}
          >
            {autoReconciling ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Zap className="w-4 h-4 mr-2" />
            )}
            Auto Reconciliação
          </Button>
          <Button variant="outline" onClick={() => setPdfOpen(true)}>
            <FileUp className="w-4 h-4 mr-2" /> Importar Extrato PDF
          </Button>
        </div>
      </div>

      <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-600">
          Saldo Total Consolidado
        </span>
        <span className="text-2xl font-bold text-primary">
          {formatCurrency(totalBalance)}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Contas Bancárias
          </h2>
          <div className="flex flex-col gap-3">
            {bancos.map((banco) => (
              <button
                key={banco.id}
                onClick={() => setSelectedBancoId(banco.id)}
                className={cn(
                  'text-left rounded-xl border p-4 transition-all duration-200',
                  selectedBancoId === banco.id
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm',
                )}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Landmark className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 truncate">
                      {banco.banco}
                    </h3>
                    <p className="text-xs text-gray-400 font-mono">
                      ID: {banco.id}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 font-mono mb-2">
                  Ag: {banco.agencia} | CC: {banco.conta_corrente}
                </p>
                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                  <span className="text-xs text-gray-500">Saldo Atual</span>
                  <span
                    className={cn(
                      'text-sm font-bold',
                      banco.saldo_atual >= 0 ? 'text-gray-900' : 'text-red-600',
                    )}
                  >
                    {formatCurrency(banco.saldo_atual)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="rounded-xl border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center justify-between">
                <span>Lançamentos Contábeis</span>
                <Badge
                  variant="secondary"
                  className="bg-primary/10 text-primary font-normal"
                >
                  {filteredRazao.length} registros
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="px-4 pb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por descrição ou conta..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-white"
                  />
                </div>
              </div>
              {filteredRazao.length > 0 ? (
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/50">
                        <TableHead className="w-[100px]">Data</TableHead>
                        <TableHead>Conta</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="text-right text-green-600">
                          Crédito
                        </TableHead>
                        <TableHead className="text-right text-red-600">
                          Débito
                        </TableHead>
                        <TableHead className="text-right">Saldo</TableHead>
                        <TableHead className="w-[80px] text-center">
                          Ação
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRazao.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="text-gray-600 text-sm">
                            {format(new Date(r.data), 'dd/MM/yyyy')}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-gray-500">
                            {r.conta}
                          </TableCell>
                          <TableCell className="font-medium text-gray-900 text-sm">
                            {r.descricao}
                          </TableCell>
                          <TableCell className="text-right font-bold text-sm text-green-600">
                            {r.credito > 0 ? formatCurrency(r.credito) : '-'}
                          </TableCell>
                          <TableCell className="text-right font-bold text-sm text-red-600">
                            {r.debito > 0 ? formatCurrency(r.debito) : '-'}
                          </TableCell>
                          <TableCell className="text-right font-bold text-sm text-gray-900">
                            {formatCurrency(r.saldo)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-primary hover:bg-primary/10"
                              onClick={() => handleView(r)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-gray-500 text-sm">
                    Nenhum lançamento encontrado.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-xl border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                Reconciliação
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-auto">
              {reconciling ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <CheckCircle2 className="w-10 h-10 text-green-500 mb-2" />
                  <p className="text-gray-500 text-sm">
                    Use o botão "Auto Reconciliação" para processar transações
                    pendentes.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <StatementViewDialog
        open={viewOpen}
        onOpenChange={setViewOpen}
        item={viewItem}
      />

      <PdfImportModal
        open={pdfOpen}
        onOpenChange={setPdfOpen}
        entityType="transactions"
        onSuccess={loadData}
      />
    </div>
  )
}
