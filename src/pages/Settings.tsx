import { useState, useRef } from 'react'
import { Loader2, Upload, User, Mail, Shield, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import { profileService } from '@/services/profileService'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'

const Settings = () => {
  const { user, avatarUrl, fullName, role, refreshProfile } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [savingName, setSavingName] = useState(false)
  const [nameValue, setNameValue] = useState(fullName || '')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const userName = fullName || user?.user_metadata?.full_name || 'Usuário'
  const userInitials = userName.substring(0, 2).toUpperCase()
  const userEmail = user?.email || ''

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione um arquivo de imagem válido')
      return
    }
    try {
      setUploading(true)
      toast.info('Enviando imagem...')
      const publicUrl = await profileService.uploadAvatar(file, user.id)
      await profileService.updateAvatarUrl(user.id, publicUrl)
      await refreshProfile()
      toast.success('Foto de perfil atualizada com sucesso')
    } catch {
      toast.error('Erro ao atualizar foto de perfil')
    } finally {
      setUploading(false)
    }
  }

  const handleSaveName = async () => {
    if (!user || !nameValue.trim()) return
    try {
      setSavingName(true)
      await profileService.updateFullName(user.id, nameValue.trim())
      await refreshProfile()
      toast.success('Nome atualizado com sucesso')
    } catch {
      toast.error('Erro ao atualizar nome')
    } finally {
      setSavingName(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem')
      return
    }
    try {
      setChangingPassword(true)
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })
      if (error) throw error
      toast.success('Senha alterada com sucesso')
      setNewPassword('')
      setConfirmPassword('')
    } catch {
      toast.error('Erro ao alterar senha')
    } finally {
      setChangingPassword(false)
    }
  }

  const getRoleLabel = () => {
    switch (role) {
      case 'admin':
        return 'Administrador'
      case 'colaborador':
        return 'Colaborador'
      case 'visitante':
        return 'Visitante'
      default:
        return 'Visitante'
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-10 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-500">Gerencie suas informações de perfil.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Foto do Perfil
          </CardTitle>
          <CardDescription>Atualize sua foto de perfil.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
            <AvatarImage src={avatarUrl || undefined} alt={userName} />
            <AvatarFallback className="text-2xl">{userInitials}</AvatarFallback>
          </Avatar>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Alterar Foto
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Informações Pessoais
          </CardTitle>
          <CardDescription>Atualize seu nome de exibição.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Nome Completo
            </label>
            <div className="flex gap-2">
              <Input
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                placeholder="Seu nome..."
              />
              <Button
                onClick={handleSaveName}
                disabled={savingName || nameValue === fullName}
              >
                {savingName ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Salvar'
                )}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <Mail className="w-3 h-3" />
              E-mail
            </label>
            <Input value={userEmail} disabled className="bg-gray-50" />
            <p className="text-xs text-gray-400">
              O e-mail não pode ser alterado.
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Nível de Acesso
            </label>
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {getRoleLabel()}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Alterar Senha
          </CardTitle>
          <CardDescription>
            Defina uma nova senha para sua conta.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Nova Senha
            </label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres..."
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Confirmar Senha
            </label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a nova senha..."
            />
          </div>
          <Button
            onClick={handleChangePassword}
            disabled={
              changingPassword ||
              !newPassword ||
              !confirmPassword ||
              newPassword !== confirmPassword
            }
          >
            {changingPassword ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Alterando...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Alterar Senha
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default Settings
