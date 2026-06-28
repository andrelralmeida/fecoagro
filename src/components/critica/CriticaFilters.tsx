import * as React from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar as CalendarIcon, Filter, X } from 'lucide-react'
import { DateRange } from 'react-day-picker'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar } from '@/components/ui/calendar'
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
import { Atividade, CentroCusto, PlanoConta, NotaFiscal } from '@/lib/types'
import {
  atividadeOptions,
  centroCustoOptions,
  planoContaOptions,
  notaFiscalOptions,
} from '@/lib/relational-format'

export interface CriticaFilterState {
  historico: string
  atividade_id: string
  centro_custo_id: string
  plano_conta_id: string
  nota_fiscal_id: string
  status: string
  dateRange: DateRange | undefined
}

interface CriticaFiltersProps {
  filters: CriticaFilterState
  setFilters: React.Dispatch<React.SetStateAction<CriticaFilterState>>
  atividades: Atividade[]
  centroCustos: CentroCusto[]
  planoContas: PlanoConta[]
  notasFiscais: NotaFiscal[]
}

const statusOptions = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'concluido', label: 'Concluído' },
  { value: 'cancelado', label: 'Cancelado' },
]

export function CriticaFilters({
  filters,
  setFilters,
  atividades,
  centroCustos,
  planoContas,
  notasFiscais,
}: CriticaFiltersProps) {
  const clearFilters = () => {
    setFilters({
      historico: '',
      atividade_id: '',
      centro_custo_id: '',
      plano_conta_id: '',
      nota_fiscal_id: '',
      status: '',
      dateRange: undefined,
    })
  }

  const hasActiveFilters =
    filters.historico !== '' ||
    filters.atividade_id !== '' ||
    filters.centro_custo_id !== '' ||
    filters.plano_conta_id !== '' ||
    filters.nota_fiscal_id !== '' ||
    filters.status !== '' ||
    filters.dateRange !== undefined

  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex flex-col md:flex-row flex-wrap gap-3">
        <Input
          placeholder="Buscar por histórico..."
          value={filters.historico}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, historico: e.target.value }))
          }
          className="flex-1 min-w-[200px] bg-white"
        />
        <Select
          value={filters.atividade_id}
          onValueChange={(val) =>
            setFilters((prev) => ({ ...prev, atividade_id: val }))
          }
        >
          <SelectTrigger className="w-full md:w-[200px] bg-white">
            <SelectValue placeholder="Atividade" />
          </SelectTrigger>
          <SelectContent>
            {atividadeOptions(atividades).map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.centro_custo_id}
          onValueChange={(val) =>
            setFilters((prev) => ({ ...prev, centro_custo_id: val }))
          }
        >
          <SelectTrigger className="w-full md:w-[200px] bg-white">
            <SelectValue placeholder="Centro de Custos" />
          </SelectTrigger>
          <SelectContent>
            {centroCustoOptions(centroCustos).map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.plano_conta_id}
          onValueChange={(val) =>
            setFilters((prev) => ({ ...prev, plano_conta_id: val }))
          }
        >
          <SelectTrigger className="w-full md:w-[200px] bg-white">
            <SelectValue placeholder="Conta" />
          </SelectTrigger>
          <SelectContent>
            {planoContaOptions(planoContas).map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.nota_fiscal_id}
          onValueChange={(val) =>
            setFilters((prev) => ({ ...prev, nota_fiscal_id: val }))
          }
        >
          <SelectTrigger className="w-full md:w-[200px] bg-white">
            <SelectValue placeholder="Nota Fiscal" />
          </SelectTrigger>
          <SelectContent>
            {notaFiscalOptions(notasFiscais).map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.status}
          onValueChange={(val) =>
            setFilters((prev) => ({ ...prev, status: val }))
          }
        >
          <SelectTrigger className="w-full md:w-[160px] bg-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="w-full md:w-[260px]">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal bg-white',
                  !filters.dateRange && 'text-muted-foreground',
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateRange?.from ? (
                  filters.dateRange.to ? (
                    <>
                      {format(filters.dateRange.from, 'dd/MM/yyyy')} -{' '}
                      {format(filters.dateRange.to, 'dd/MM/yyyy')}
                    </>
                  ) : (
                    format(filters.dateRange.from, 'dd/MM/yyyy')
                  )
                ) : (
                  <span>Filtrar por data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={filters.dateRange?.from}
                selected={filters.dateRange}
                onSelect={(range) =>
                  setFilters((prev) => ({ ...prev, dateRange: range }))
                }
                numberOfMonths={2}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-gray-500" />
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="mr-2 h-3 w-3" /> Limpar Filtros
          </Button>
        </div>
      )}
    </div>
  )
}
