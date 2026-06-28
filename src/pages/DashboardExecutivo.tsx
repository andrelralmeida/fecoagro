import { useState, useMemo, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { DateRange } from 'react-day-picker'
import {
  Calendar as CalendarIcon,
  X,
  FileText,
  AlertCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  Landmark,
} from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ChartContainer } from '@/components/ui/chart'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/format'
import {
  executiveDashboardService,
  ExecutiveKPIs,
  MonthlyNotaData,
  SupplierVolumeData,
} from '@/services/executiveDashboardService'
import { SupplierRanking } from '@/components/dashboard/SupplierRanking'
import { SupplierVolumeList } from '@/components/dashboard/SupplierVolumeList'
import { toast } from 'sonner'

const DashboardExecutivo = () => {
  const now = new Date()
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(now.getFullYear(), now.getMonth(), 1),
    to: now,
  })
  const [kpis, setKpis] = useState<ExecutiveKPIs | null>(null)
  const [monthlyData, setMonthlyData] = useState<MonthlyNotaData[]>([])
  const [supplierData, setSupplierData] = useState<SupplierVolumeData[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)

    const safeFetch = async <T,>(
      fn: () => Promise<T>,
      fallback: T,
      label: string,
    ): Promise<T> => {
      try {
        return await fn()
      } catch (err) {
        console.error(`Erro ao carregar ${label}:`, err)
        toast.error(`Falha ao carregar: ${label}`)
        return fallback
      }
    }

    const [kpiData, monthly, suppliers] = await Promise.all([
      safeFetch(
        () => executiveDashboardService.getKPIs(dateRange?.from, dateRange?.to),
        null,
        'KPIs',
      ),
      safeFetch(
        () =>
          executiveDashboardService.getMonthlyNotas(
            dateRange?.from,
            dateRange?.to,
          ),
        [],
        'Notas Mensais',
      ),
      safeFetch(
        () =>
          executiveDashboardService.getSupplierVolumes(
            dateRange?.from,
            dateRange?.to,
          ),
        [],
        'Fornecedores',
      ),
    ])

    setKpis(kpiData)
    setMonthlyData(monthly)
    setSupplierData(suppliers)
    setLoading(false)
  }, [dateRange?.from?.getTime(), dateRange?.to?.getTime()])

  useEffect(() => {
    loadData()
  }, [loadData])

  const clearFilters = () => {
    setDateRange({
      from: new Date(now.getFullYear(), now.getMonth(), 1),
      to: now,
    })
  }

  const hasActiveFilters = dateRange !== undefined

  const chartConfig = {
    total: { label: 'Total Notas', color: 'hsl(var(--primary))' },
  }

  const cards = useMemo(() => {
    if (!kpis) return []
    return [
      {
        label: 'Total de Notas Fiscais',
        value: formatCurrency(kpis.totalNotasFiscais),
        sub: `${kpis.countNotasFiscais} notas no período`,
        icon: FileText,
        color: 'text-green-600 bg-green-50',
      },
      {
        label: 'Total de Críticas',
        value: formatCurrency(kpis.totalCriticas),
        sub: `${kpis.countCriticas} críticas no período`,
        icon: AlertCircle,
        color: 'text-yellow-600 bg-yellow-50',
      },
      {
        label: 'Total Débitos (Razão)',
        value: formatCurrency(kpis.totalDebito),
        sub: `${kpis.countRazao} lançamentos`,
        icon: ArrowDownCircle,
        color: 'text-red-600 bg-red-50',
      },
      {
        label: 'Total Créditos (Razão)',
        value: formatCurrency(kpis.totalCredito),
        sub: `${kpis.countRazao} lançamentos`,
        icon: ArrowUpCircle,
        color: 'text-blue-600 bg-blue-50',
      },
      {
        label: 'Saldo Bancário',
        value: formatCurrency(kpis.saldoBancario),
        sub: `${kpis.countBancos} contas`,
        icon: Landmark,
        color: 'text-purple-600 bg-purple-50',
      },
    ]
  }, [kpis])

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-[130px] rounded-3xl" />
          ))}
        </div>
        <Skeleton className="h-[400px] rounded-3xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[400px] rounded-3xl" />
          <Skeleton className="h-[400px] rounded-3xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-10">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Dashboard Executivo
          </h1>
          <p className="text-gray-500">
            Visão executiva dos totais financeiros
          </p>
        </div>
        <div className="flex items-center gap-2">
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
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-9 text-xs"
            >
              <X className="mr-2 h-3 w-3" /> Limpar Filtros
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        {cards.map((card, index) => {
          const Icon = card.icon
          return (
            <Card key={index} className="rounded-3xl border-none shadow-sm">
              <CardContent className="p-5 flex flex-col gap-3">
                <div
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center',
                    card.color,
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-gray-500">
                  {card.label}
                </span>
                <span className="text-xl font-bold text-gray-900">
                  {card.value}
                </span>
                <span className="text-xs text-gray-400 truncate">
                  {card.sub}
                </span>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="rounded-3xl border-none shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Notas Fiscais por Mês
          </h3>
          {monthlyData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(v: number) => formatCurrency(v)}
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Bar
                    dataKey="total"
                    fill="hsl(var(--primary))"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="flex items-center justify-center h-[350px] text-gray-400 text-sm">
              Nenhum dado disponível para o período selecionado.
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SupplierVolumeList data={supplierData} loading={loading} />
        <SupplierRanking data={supplierData} loading={loading} />
      </div>
    </div>
  )
}

export default DashboardExecutivo
