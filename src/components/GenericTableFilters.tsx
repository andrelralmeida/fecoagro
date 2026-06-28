import * as React from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar as CalendarIcon, Filter, X } from 'lucide-react'
import { DateRange } from 'react-day-picker'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
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
import { Input } from '@/components/ui/input'

export interface GenericFilterState {
  search: string
  dateRange: DateRange | undefined
  status: string
}

interface GenericTableFiltersProps {
  filters: GenericFilterState
  setFilters: React.Dispatch<React.SetStateAction<GenericFilterState>>
  searchPlaceholder?: string
  statusOptions?: { value: string; label: string }[]
  showStatus?: boolean
  showDateRange?: boolean
}

export function GenericTableFilters({
  filters,
  setFilters,
  searchPlaceholder = 'Buscar...',
  statusOptions = [],
  showStatus = false,
  showDateRange = true,
}: GenericTableFiltersProps) {
  const clearFilters = () => {
    setFilters({ search: '', dateRange: undefined, status: 'all' })
  }

  const hasActiveFilters =
    filters.search !== '' ||
    filters.dateRange !== undefined ||
    (showStatus && filters.status !== 'all')

  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder={searchPlaceholder}
            value={filters.search}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, search: e.target.value }))
            }
            className="w-full bg-white"
          />
        </div>
        {showDateRange && (
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
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Filter className="w-4 h-4 text-gray-500" />
        {showStatus && (
          <Select
            value={filters.status}
            onValueChange={(val) =>
              setFilters((prev) => ({ ...prev, status: val }))
            }
          >
            <SelectTrigger className="w-[180px] bg-white h-9 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              {statusOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="ml-auto h-9 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="mr-2 h-3 w-3" /> Limpar Filtros
          </Button>
        )}
      </div>
    </div>
  )
}
