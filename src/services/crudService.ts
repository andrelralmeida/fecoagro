import { supabase } from '@/lib/supabase/client'

export async function fetchAll<T>(table: string): Promise<T[]> {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error(`Error fetching from ${table}:`, error)
    throw error
  }
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

export async function updateRecord<T>(
  table: string,
  id: string,
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

export async function deleteRecord(table: string, id: string): Promise<void> {
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) throw error
}
