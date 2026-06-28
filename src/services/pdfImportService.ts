import { supabase } from '@/lib/supabase/client'

export type EntityType = 'transactions' | 'notas_fiscais' | 'razao' | 'bancos'

export async function uploadPdf(
  file: File,
  entityType: EntityType,
): Promise<{ path: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const ext = file.name.split('.').pop() || 'pdf'
  const fileName = `${entityType}/${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`

  const { data, error } = await supabase.storage
    .from('imports')
    .upload(fileName, file, {
      contentType: 'application/pdf',
      upsert: false,
    })

  if (error) throw error
  return { path: data.path }
}

export async function processPdf(
  filePath: string,
  entityType: EntityType,
): Promise<{
  message: string
  recordsInserted: number
  entityType: string
}> {
  const { data, error } = await supabase.functions.invoke('process-pdf', {
    body: { filePath, entityType },
  })

  if (error) throw error
  return data
}
