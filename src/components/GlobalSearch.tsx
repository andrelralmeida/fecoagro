import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  FileWarning,
  Receipt,
  BookOpen,
  ReceiptText,
  Loader2,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/format'
import { globalSearch, SearchResult } from '@/services/searchService'
import { cn } from '@/lib/utils'

const typeIcons: Record<SearchResult['type'], typeof FileWarning> = {
  critica: FileWarning,
  notas_fiscais: Receipt,
  razao: BookOpen,
  extratos_bancarios: ReceiptText,
}

const typeColors: Record<SearchResult['type'], string> = {
  critica: 'text-orange-500',
  notas_fiscais: 'text-blue-500',
  razao: 'text-purple-500',
  extratos_bancarios: 'text-green-500',
}

export function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const navigate = useNavigate()

  const performSearch = useCallback(async (term: string) => {
    if (term.trim().length < 2) {
      setResults([])
      setLoading(false)
      return
    }
    try {
      const data = await globalSearch(term)
      setResults(data)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.trim().length < 2) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    debounceRef.current = setTimeout(() => {
      performSearch(query)
    }, 350)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, performSearch])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleFocus = () => setOpen(true)

  const handleResultClick = (route: string) => {
    setOpen(false)
    setQuery('')
    setResults([])
    navigate(route)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (results.length > 0) {
      handleResultClick(results[0].route)
    }
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={handleFocus}
            placeholder="Buscar..."
            className="pl-10 bg-white border-transparent shadow-sm rounded-full h-11 focus-visible:ring-1 focus-visible:ring-gray-200"
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
          )}
        </div>
      </form>

      {open && query.trim().length >= 2 && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-lg border border-gray-100 max-h-[400px] overflow-y-auto z-50 animate-fade-in">
          {results.length === 0 && !loading ? (
            <div className="px-4 py-6 text-center text-sm text-gray-400">
              Nenhum resultado encontrado para "{query}"
            </div>
          ) : (
            <div className="py-2">
              {results.map((result, index) => {
                const Icon = typeIcons[result.type]
                const colorClass = typeColors[result.type]
                return (
                  <button
                    key={`${result.type}-${result.id}-${index}`}
                    onClick={() => handleResultClick(result.route)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                  >
                    <Icon className={cn('w-4 h-4 flex-shrink-0', colorClass)} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {result.title}
                      </div>
                      <div className="text-xs text-gray-400 truncate">
                        {result.subtitle}
                        {result.date &&
                          ` · ${new Date(result.date).toLocaleDateString('pt-BR')}`}
                      </div>
                    </div>
                    {result.amount !== null && (
                      <span className="text-sm font-semibold text-gray-600 flex-shrink-0">
                        {formatCurrency(result.amount)}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
