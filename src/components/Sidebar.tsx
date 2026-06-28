import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  FileWarning,
  Receipt,
  BookOpen,
  Landmark,
  LifeBuoy,
  Settings,
  LogOut,
  Users,
  ListTree,
  Briefcase,
  Building2,
  ReceiptText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { FecoagroLogo } from '@/components/FecoagroLogo'

const SidebarItem = ({
  icon: Icon,
  label,
  to,
  isActive,
}: {
  icon: any
  label: string
  to: string
  isActive: boolean
}) => (
  <Link
    to={to}
    className={cn(
      'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group hover:bg-white hover:shadow-sm',
      isActive
        ? 'text-primary font-semibold bg-white shadow-sm'
        : 'text-gray-500',
    )}
  >
    <Icon
      className={cn(
        'w-5 h-5',
        isActive ? 'text-primary' : 'text-gray-400 group-hover:text-primary',
      )}
    />
    <span className="flex-1">{label}</span>
  </Link>
)

const SidebarGroup = ({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) => (
  <div>
    <div className="px-4 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
      {title}
    </div>
    <div className="space-y-1">{children}</div>
  </div>
)

export function Sidebar({ mobile = false }: { mobile?: boolean }) {
  const location = useLocation()
  const pathname = location.pathname
  const { signOut, role } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await signOut()
      toast.success('Você saiu com sucesso')
      navigate('/login')
    } catch {
      toast.error('Erro ao sair')
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
        return ''
    }
  }

  return (
    <aside
      className={cn(
        'h-screen w-[280px] bg-[#F5F8F5] border-r border-green-100 p-6 flex flex-col',
        mobile ? 'relative z-auto' : 'fixed left-0 top-0 z-40 hidden md:flex',
      )}
    >
      <div className="flex items-center gap-3 mb-10 px-2">
        <FecoagroLogo linkTo="/" />
      </div>

      <div className="space-y-6 flex-1 overflow-y-auto no-scrollbar">
        <SidebarItem
          icon={LayoutDashboard}
          label="Dashboard"
          to="/"
          isActive={pathname === '/'}
        />

        <SidebarGroup title="Operacional">
          <SidebarItem
            icon={FileWarning}
            label="Críticas Contábeis"
            to="/critica"
            isActive={pathname === '/critica'}
          />
          <SidebarItem
            icon={Receipt}
            label="Notas Fiscais"
            to="/notas-fiscais"
            isActive={pathname === '/notas-fiscais'}
          />
          <SidebarItem
            icon={BookOpen}
            label="Razão"
            to="/razao"
            isActive={pathname === '/razao'}
          />
        </SidebarGroup>

        <SidebarGroup title="Financeiro">
          <SidebarItem
            icon={Landmark}
            label="Bancos"
            to="/bancos"
            isActive={pathname === '/bancos'}
          />
          <SidebarItem
            icon={ReceiptText}
            label="Extratos"
            to="/extratos"
            isActive={pathname === '/extratos'}
          />
        </SidebarGroup>

        <SidebarGroup title="Estrutura">
          <SidebarItem
            icon={ListTree}
            label="Plano de Contas"
            to="/plano-contas"
            isActive={pathname === '/plano-contas'}
          />
          <SidebarItem
            icon={Briefcase}
            label="Atividades"
            to="/atividades"
            isActive={pathname === '/atividades'}
          />
          <SidebarItem
            icon={Building2}
            label="Centro de Custos"
            to="/centro-custos"
            isActive={pathname === '/centro-custos'}
          />
        </SidebarGroup>

        <SidebarGroup title="Sistema">
          <SidebarItem
            icon={Settings}
            label="Configurações"
            to="/settings"
            isActive={pathname === '/settings'}
          />
          <SidebarItem
            icon={LifeBuoy}
            label="Ajuda"
            to="/help"
            isActive={pathname === '/help'}
          />
          {role === 'admin' && (
            <SidebarItem
              icon={Users}
              label="Gerenciar Usuários"
              to="/users"
              isActive={pathname === '/users'}
            />
          )}
        </SidebarGroup>
      </div>

      <div className="mt-auto space-y-2">
        {role && role !== 'visitante' && (
          <div className="px-4 py-2 bg-green-50 rounded-lg text-center">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">
              Acesso Atual
            </span>
            <span className="text-sm font-bold text-gray-900">
              {getRoleLabel()}
            </span>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors w-full"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sair</span>
        </button>
      </div>
    </aside>
  )
}
