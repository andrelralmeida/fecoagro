import { supabase } from '@/lib/supabase/client'

export const profileService = {
  async uploadAvatar(file: File, userId: string): Promise<string> {
    const ext = file.name.split('.').pop() || 'png'
    const fileName = `${userId}/avatar-${Date.now()}.${ext}`

    const { error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true })

    if (error) throw error

    const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)
    return data.publicUrl
  },

  async updateAvatarUrl(userId: string, avatarUrl: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ avatar_url: avatarUrl })
      .eq('id', userId)

    if (error) throw error
  },

  async updateFullName(userId: string, fullName: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ full_name: fullName })
      .eq('id', userId)

    if (error) throw error
  },
}
