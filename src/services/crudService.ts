import { supabase } from '@/lib/supabase/client'
import { format } from 'date-fns'

export async function fetchAll<T>(table: string): Promise<T[]> {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []) as T[]
}

export async function createRecord<T>(
  table: string,
  record: Record<string, unknown>,
): Promise<T> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from(table)
    .insert({ ...record, user_id: user.id })
    .select()
    .single()

  if (error) throw error
  return data as T
}

export async function createBatch<T>(
  table: string,
  records: Record<string, unknown>[],
): Promise<T[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const recordsWithUserId = records.map((r) => ({ ...r, user_id: user.id }))

  const { data, error } = await supabase
    .from(table)
    .insert(recordsWithUserId)
    .select()

  if (error) throw error
  return (data || []) as T[]
}

export async function updateRecord<T>(
  table: string,
  id: string | number,
  updates: Record<string, unknown>,
): Promise<T> {
  const { data, error } = await supabase
    .from(table)
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as T
}

export async function deleteRecord(
  table: string,
  id: string | number,
): Promise<void> {
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) throw error
}

const textColumns = [
  'description',
  'descricao',
  'conta',
  'banco',
  'agencia',
  'conta_corrente',
  'fornecedor',
  'atividade',
  'centro_de_custos',
  'classificacao',
]

export async function fetchWithFilters<T>(
  table: string,
  options: {
    searchColumn?: string
    searchColumns?: string[]
    searchValue?: string
    dateColumn?: string
    dateFrom?: Date
    dateTo?: Date
    exactMatch?: boolean
    valueColumn?: string
    valueMin?: number
    valueMax?: number
    eqColumn?: string
    eqValue?: string
    andFilters?: Array<{
      column: string
      value: string | number
      isText?: boolean
      textCast?: boolean
    }>
  },
): Promise<T[]> {
  let query = supabase.from(table).select('*')

  if (options.eqValue && options.eqColumn) {
    query = query.eq(options.eqColumn, options.eqValue)
  }

  if (
    options.searchValue &&
    options.searchColumns &&
    options.searchColumns.length > 0
  ) {
    const conditions = options.searchColumns
      .map((col) => {
        if (textColumns.includes(col)) {
          return `${col}.ilike.%${options.searchValue}%`
        }
        return `${col}.eq.${options.searchValue}`
      })
      .join(',')
    query = query.or(conditions)
  } else if (options.searchValue && options.searchColumn) {
    if (options.exactMatch || !textColumns.includes(options.searchColumn)) {
      query = query.eq(options.searchColumn, options.searchValue)
    } else {
      query = query.ilike(options.searchColumn, `%${options.searchValue}%`)
    }
  }

  if (options.dateFrom && options.dateColumn) {
    query = query.gte(
      options.dateColumn,
      format(options.dateFrom, 'yyyy-MM-dd'),
    )
  }
  if (options.dateTo && options.dateColumn) {
    query = query.lte(options.dateColumn, format(options.dateTo, 'yyyy-MM-dd'))
  }

  if (options.valueMin !== undefined && options.valueColumn) {
    query = query.gte(options.valueColumn, options.valueMin)
  }
  if (options.valueMax !== undefined && options.valueColumn) {
    query = query.lte(options.valueColumn, options.valueMax)
  }

  if (options.andFilters) {
    for (const filter of options.andFilters) {
      if (filter.value) {
        if (filter.textCast) {
          query = query.filter(
            `${filter.column}::text`,
            'ilike',
            `%${filter.value}%`,
          )
        } else if (filter.isText || textColumns.includes(filter.column)) {
          query = query.ilike(filter.column, `%${filter.value}%`)
        } else {
          query = query.eq(filter.column, filter.value)
        }
      }
    }
  }

  query = query.order('created_at', { ascending: false })

  const { data, error } = await query
  if (error) throw error
  return (data || []) as T[]
}
