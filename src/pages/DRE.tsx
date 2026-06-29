import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar as CalendarIcon } from 'lucide-react'
import { DateRange } from 'react-day-picker'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PdfExportButton } from '@/components/PdfExportButton'
import { cn } from '@/lib/utils'
import {
  exportToCsv,
  buildExportFilename,
  formatCurrencyNumber,
} from '@/lib/export'
import { filialOptions } from '@/lib/filial-format'
import { auxiliaryService } from '@/services/auxiliaryService'
import { dreService, DREData } from '@/services/dreService'
import { Filial } from '@/lib/types'
import { toast } from 'sonner'

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    v,
  )

const DRE = () => {
  const now = new Date()
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(now.getFullYear(), now.getMonth(), 1),
    to: now,
  })
  const [filialId, setFilialId] = useState('all')
  const [filiais, setFiliais] = useState<Filial[]>([])
  const [data, setData] = useState<DREData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    auxiliaryService
      .fetchFiliais()
      .then(setFiliais)
      .catch(() => {})
  }, [])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const eff = filialId !== 'all' ? filialId : undefined
      const result = await dreService.getDRE(
        dateRange?.from,
        dateRange?.to,
        eff,
      )
      setData(result)
    } catch {
      toast.error('Erro ao carregar DRE')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [dateRange?.from?.getTime(), dateRange?.to?.getTime(), filialId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleExportCsv = () => {
    if (!data) {
      toast.error('Nenhum dado para exportar')
      return
    }
    const headers = ['Tipo', 'Classificação', 'Descrição', 'Valor']
    const rows: (string | number)[][] = []
    data.receitas.forEach((r) =>
      rows.push([
        'Receita',
        r.classificacao,
        r.descricao,
        formatCurrencyNumber(r.valor),
      ]),
    )
    rows.push([
      '',
      '',
      'Total Receitas',
      formatCurrencyNumber(data.totalReceitas),
    ])
    data.despesas.forEach((d) =>
      rows.push([
        'Despesa',
        d.classificacao,
        d.descricao,
        formatCurrencyNumber(d.valor),
      ]),
    )
    rows.push([
      '',
      '',
      'Total Despesas',
      formatCurrencyNumber(data.totalDespesas),
    ])
    rows.push([
      '',
      '',
      'Resultado Líquido',
      formatCurrencyNumber(data.resultadoLiquido),
    ])
    exportToCsv(buildExportFilename('dre'), headers, rows)
    toast.success('CSV exportado com sucesso')
  }

  const pdfData = data
    ? [
        ...data.receitas.map((r) => ({
          tipo: 'Receita',
          classificacao: r.classificacao,
          descricao: r.descricao,
          valor: formatCurrencyNumber(r.valor),
        })),
        ...data.despesas.map((d) => ({
          tipo: 'Despesa',
          classificacao: d.classificacao,
          descricao: d.descricao,
          valor: formatCurrencyNumber(d.valor),
        })),
      ]
    : []

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">DRE</h1>
          <p className="text-gray-500">
            Demonstração do Resultado do Exercício
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <PdfExportButton
            title="DRE"
            columns={[
              { header: 'Tipo', key: 'tipo' },
              { header: 'Classificação', key: 'classificacao' },
              { header: 'Descrição', key: 'descricao' },
              { header: 'Valor', key: 'valor' },
            ]}
            data={pdfData}
            disabled={loading || !data}
          />
          <Button
            variant="outline"
            onClick={handleExportCsv}
            disabled={loading}
          >
            Exportar CSV
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 flex-wrap">
        <Select value={filialId} onValueChange={setFilialId}>
          <SelectTrigger className="w-full md:w-[220px] bg-white">
            <SelectValue placeholder="Todas as Filiais" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Filiais</SelectItem>
            {filialOptions(filiais).map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full md:w-[300px] justify-start text-left font-normal bg-white',
                !dateRange && 'text-muted-foreground',
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, 'dd/MM/yyyy')} -{' '}
                    {format(dateRange.to, 'dd/MM/yyyy')}
                  </>
                ) : (
                  format(dateRange.from, 'dd/MM/yyyy')
                )
              ) : (
                <span>Filtrar por data</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={2}
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>
      </div>

      {loading ? (
        <Skeleton className="h-[400px] rounded-3xl" />
      ) : !data ||
        (data.receitas.length === 0 && data.despesas.length === 0) ? (
        <Card className="rounded-3xl border-none shadow-sm">
          <CardContent className="py-12 text-center text-gray-500">
            Nenhum dado encontrado para o período selecionado.
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-3xl border-none shadow-sm overflow-hidden">
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead className="w-[120px]">Classificação</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="bg-green-50/50">
                  <TableCell colSpan={3} className="font-bold text-green-700">
                    RECEITAS
                  </TableCell>
                </TableRow>
                {data.receitas.map((item, i) => (
                  <TableRow key={`r-${i}`}>
                    <TableCell className="font-mono text-sm">
                      {item.classificacao}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {item.descricao}
                    </TableCell>
                    <TableCell className="text-right text-green-600 font-medium">
                      {formatCurrency(item.valor)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-green-50 font-bold">
                  <TableCell colSpan={2} className="text-green-700">
                    Total Receitas
                  </TableCell>
                  <TableCell className="text-right text-green-700">
                    {formatCurrency(data.totalReceitas)}
                  </TableCell>
                </TableRow>
                <TableRow className="bg-red-50/50">
                  <TableCell colSpan={3} className="font-bold text-red-700">
                    DESPESAS
                  </TableCell>
                </TableRow>
                {data.despesas.map((item, i) => (
                  <TableRow key={`d-${i}`}>
                    <TableCell className="font-mono text-sm">
                      {item.classificacao}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {item.descricao}
                    </TableCell>
                    <TableCell className="text-right text-red-600 font-medium">
                      {formatCurrency(item.valor)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-red-50 font-bold">
                  <TableCell colSpan={2} className="text-red-700">
                    Total Despesas
                  </TableCell>
                  <TableCell className="text-right text-red-700">
                    {formatCurrency(data.totalDespesas)}
                  </TableCell>
                </TableRow>
                <TableRow className="bg-gray-100 font-bold text-base">
                  <TableCell colSpan={2} className="text-gray-900">
                    RESULTADO LÍQUIDO
                  </TableCell>
                  <TableCell
                    className={cn(
                      'text-right',
                      data.resultadoLiquido >= 0
                        ? 'text-green-700'
                        : 'text-red-700',
                    )}
                  >
                    {formatCurrency(data.resultadoLiquido)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  )
}

export default DRE
