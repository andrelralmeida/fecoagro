import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { FileWarning, Receipt, BookOpen, Landmark } from 'lucide-react'
import { SummaryData } from '@/services/summaryService'

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(v)

interface SummaryCardsProps {
  data: SummaryData | null
  loading: boolean
}

export function SummaryCards({ data, loading }: SummaryCardsProps) {
  if (loading || !data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-[120px] rounded-3xl bg-gray-100 animate-pulse"
          />
        ))}
      </div>
    )
  }

  const cards = [
    {
      label: 'Críticas',
      icon: FileWarning,
      value: data.criticas.count.toString(),
      subValue: formatCurrency(data.criticas.totalValue),
      color: 'text-blue-600 bg-blue-50',
      to: '/critica',
    },
    {
      label: 'Notas Fiscais',
      icon: Receipt,
      value: data.notasFiscais.count.toString(),
      subValue: formatCurrency(data.notasFiscais.totalValue),
      color: 'text-green-600 bg-green-50',
      to: '/notas-fiscais',
    },
    {
      label: 'Razão',
      icon: BookOpen,
      value: data.razao.count.toString(),
      subValue: `D: ${formatCurrency(data.razao.totalDebito)}`,
      color: 'text-purple-600 bg-purple-50',
      to: '/razao',
    },
    {
      label: 'Extratos',
      icon: Landmark,
      value: data.extratos.count.toString(),
      subValue: formatCurrency(data.extratos.totalBalance),
      color: 'text-orange-600 bg-orange-50',
      to: '/extratos',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <Link key={index} to={card.to}>
            <Card className="rounded-3xl border-none shadow-sm hover:scale-[1.02] hover:shadow-md transition-all duration-300 cursor-pointer">
              <CardContent className="p-6 flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center ${card.color}`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium text-gray-500">
                    {card.label}
                  </span>
                  <span className="text-2xl font-bold text-gray-900">
                    {card.value}
                  </span>
                  <span className="text-xs text-gray-400 font-medium truncate">
                    {card.subValue}
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
