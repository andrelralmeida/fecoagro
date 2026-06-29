import { useState, useMemo, useEffect } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useDashboard } from '@/hooks/use-dashboard'
import { KPICard } from '@/components/dashboard/KPICard'
import { SummaryCards } from '@/components/dashboard/SummaryCards'
import { FinancialEvolutionChart } from '@/components/dashboard/FinancialEvolutionChart'
import { StatusChart } from '@/components/dashboard/StatusChart'
import { DistributionChart } from '@/components/dashboard/DistributionChart'
import { CentroCustoPieChart } from '@/components/dashboard/CentroCustoPieChart'
import { ExtratosSummary } from '@/components/dashboard/ExtratosSummary'
import { RecentTransactions } from '@/components/dashboard/RecentTransactions'
import { KPIMetric } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'
import { FecoagroLogo } from '@/components/FecoagroLogo'
import { formatCurrency } from '@/lib/format'
import { auxiliaryService } from '@/services/auxiliaryService'
import { Filial } from '@/lib/types'
import { filialOptions } from '@/lib/filial-format'

const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

const Index = () => {
  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [filialId, setFilialId] = useState<string>('all')
  const [filiais, setFiliais] = useState<Filial[]>([])

  const dateRange = useMemo(
    () => ({
      from: new Date(selectedYear, selectedMonth - 1, 1),
      to: new Date(selectedYear, selectedMonth, 0),
    }),
    [selectedMonth, selectedYear],
  )

  const years = [
    now.getFullYear() - 1,
    now.getFullYear(),
    now.getFullYear() + 1,
  ]

  useEffect(() => {
    auxiliaryService
      .fetchFiliais()
      .then(setFiliais)
      .catch(() => {})
  }, [])

  const {
    kpis,
    recentTransactions,
    razaoEvolution,
    recentExtratos,
    centroCustoDistribution,
    atividadeDistribution,
    planoContasDistribution,
    statusDistribution,
    loading,
    summaryData,
    summaryLoading,
  } = useDashboard(dateRange, filialId)

  const kpiData: KPIMetric[] = kpis
    ? [
        {
          label: 'Saldo Total',
          value: kpis.bankBalance,
          subValue: 'Consolidado',
          trend: 0,
          trendLabel: 'Atual',
          progress: 100,
          color: 'green',
        },
        {
          label: 'Críticas Pendentes',
          value: String(kpis.unreconciledCriticas),
          subValue: `${kpis.pendingCriticas} não processadas`,
          trend: 0,
          trendLabel: 'Status',
          progress:
            kpis.totalCriticas > 0
              ? (kpis.unreconciledCriticas / kpis.totalCriticas) * 100
              : 0,
          color: 'yellow',
        },
        {
          label: 'Movimentação Mensal',
          value: kpis.monthlyMovement,
          subValue: formatCurrency(kpis.totalCriticasAmount),
          trend: 0,
          trendLabel: 'Mês atual',
          progress: 100,
          color: 'blue',
        },
        {
          label: 'Saldo Razão',
          value: kpis.razaoBalance,
          subValue: 'Consolidado',
          trend: 0,
          trendLabel: 'Atual',
          progress: 100,
          color: 'purple',
        },
      ]
    : []

  if (loading && !kpis) {
    return (
      <div className="flex flex-col gap-6 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[140px] rounded-3xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-[400px]">
          <Skeleton className="xl:col-span-2 h-full rounded-3xl" />
          <Skeleton className="h-full rounded-3xl" />
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-[400px]">
          <Skeleton className="h-full rounded-3xl" />
          <Skeleton className="h-full rounded-3xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-10">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <FecoagroLogo className="h-10" />
          <div className="hidden sm:block">
            <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>
            <p className="text-sm text-gray-500">Visão geral financeira</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={filialId} onValueChange={setFilialId}>
            <SelectTrigger className="w-[180px]">
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
          <Select
            value={String(selectedMonth)}
            onValueChange={(v) => setSelectedMonth(Number(v))}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => (
                <SelectItem key={i} value={String(i + 1)}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={String(selectedYear)}
            onValueChange={(v) => setSelectedYear(Number(v))}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {kpiData.map((kpi, index) => (
          <div key={index} className="h-[140px]">
            <KPICard data={kpi} />
          </div>
        ))}
      </div>

      <SummaryCards data={summaryData} loading={summaryLoading} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-auto min-h-[400px]">
        <div className="xl:col-span-2 h-[400px] xl:h-full">
          <FinancialEvolutionChart data={razaoEvolution} />
        </div>
        <div className="h-[400px] xl:h-full">
          <CentroCustoPieChart data={centroCustoDistribution} />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-auto min-h-[400px]">
        <div className="h-full min-h-[400px]">
          <DistributionChart
            title="Distribuição por Centro de Custos"
            data={centroCustoDistribution}
          />
        </div>
        <div className="h-full min-h-[400px]">
          <DistributionChart
            title="Distribuição por Atividade"
            data={atividadeDistribution}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-auto min-h-[400px]">
        <div className="h-full min-h-[400px]">
          <DistributionChart
            title="Distribuição por Plano de Contas"
            data={planoContasDistribution}
          />
        </div>
        <div className="h-full min-h-[400px]">
          <StatusChart data={statusDistribution} />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-auto min-h-[400px]">
        <div className="h-full min-h-[400px]">
          <ExtratosSummary data={recentExtratos} />
        </div>
        <div className="h-full min-h-[400px]">
          <RecentTransactions transactions={recentTransactions} />
        </div>
      </div>
    </div>
  )
}

export default Index
