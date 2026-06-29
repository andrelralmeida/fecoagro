import { Search, Bell, FileText, Menu } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { FecoagroLogo } from '@/components/FecoagroLogo'
import { GlobalSearch } from '@/components/GlobalSearch'

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, avatarUrl, fullName } = useAuth()
  const userName = fullName || user?.user_metadata?.full_name || 'Usuário'
  const userInitials = userName.substring(0, 2).toUpperCase()

  return (
    <header className="sticky top-0 z-30 w-full bg-[#F8F9FB]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1">
        {onMenuClick && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="md:hidden flex-shrink-0"
          >
            <Menu className="w-5 h-5" />
          </Button>
        )}
        <FecoagroLogo
          linkTo="/"
          className="h-8 flex-shrink-0"
          showOnDesktop={false}
        />
        <div className="hidden md:block flex-1 max-w-md">
          <GlobalSearch />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="bg-white rounded-full shadow-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 relative hidden sm:flex"
        >
          <FileText className="w-5 h-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="bg-white rounded-full shadow-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 relative"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </Button>

        <div className="h-8 w-px bg-gray-200 mx-2 hidden sm:block"></div>

        <div className="flex items-center gap-3 pl-2">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-bold text-gray-900">{userName}</div>
            <div className="text-xs text-gray-500">Fecoagro</div>
          </div>
          <Avatar className="h-10 w-10 border-2 border-white shadow-sm cursor-pointer">
            <AvatarImage
              src={
                avatarUrl ||
                `https://img.usecurling.com/ppl/medium?gender=male&seed=${user?.id}`
              }
              alt={userName}
            />
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}
