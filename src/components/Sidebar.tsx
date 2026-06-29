import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  FileWarning,
  Receipt,
  BookOpen,
  Landmark,
  Settings,
  LogOut,
  ListTree,
  Briefcase,
  Building2,
  ReceiptText,
  BarChart3,
  Scale,
  TrendingUp,
  PanelLeftClose,
  PanelLeftOpen,
  HelpCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { FecoagroLogo } from '@/components/FecoagroLogo'
import { useSidebarCollapse } from '@/hooks/use-sidebar-collapse'

const SidebarItem = ({
  icon: Icon,
  label,
  to,
  isActive,
  collapsed,
}: {
  icon: any
  label: string
  to: string
  isActive: boolean
  collapsed: boolean
}) => (
  <Link
    to={to}
    title={collapsed ? label : undefined}
    className={cn(
      'flex items-center rounded-xl transition-all duration-200 group hover:bg-white hover:shadow-sm',
      collapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3',
      isActive
        ? 'text-primary font-semibold bg-white shadow-sm'
        : 'text-gray-500',
    )}
  >
    <Icon
      className={cn(
        'w-5 h-5 flex-shrink-0',
        isActive ? 'text-primary' : 'text-gray-400 group-hover:text-primary',
      )}
    />
    {!collapsed && <span className="flex-1">{label}</span>}
  </Link>
)

const SidebarGroup = ({
  title,
  children,
  collapsed,
}: {
  title: string
  children: React.ReactNode
  collapsed: boolean
}) => (
  <div>
    {!collapsed && (
      <div className="px-4 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
        {title}
      </div>
    )}
    <div className="space-y-1">{children}</div>
  </div>
)

export function Sidebar({ mobile = false }: { mobile?: boolean }) {
  const location = useLocation()
  const pathname = location.pathname
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const { collapsed, toggle } = useSidebarCollapse()

  const handleLogout = async () => {
    try {
      await signOut()
      toast.success('Você saiu com sucesso')
      navigate('/login')
    } catch {
      toast.error('Erro ao sair')
    }
  }

  const effectiveCollapsed = mobile ? false : collapsed

  return (
    <aside
      className={cn(
        'h-screen bg-[#F5F8F5] border-r border-green-100 flex flex-col transition-all duration-300',
        mobile
          ? 'relative z-auto w-[280px] p-6'
          : 'fixed left-0 top-0 z-40 hidden md:flex',
        !mobile && (effectiveCollapsed ? 'w-[72px] p-3' : 'w-[280px] p-6'),
      )}
    >
      <div
        className={cn(
          'flex items-center mb-10',
          effectiveCollapsed ? 'justify-center px-0' : 'gap-3 px-2',
        )}
      >
        <FecoagroLogo linkTo="/" />
      </div>

      <div
        className={cn(
          'space-y-6 flex-1 overflow-y-auto no-scrollbar',
          effectiveCollapsed && 'space-y-3',
        )}
      >
        <SidebarItem
          icon={LayoutDashboard}
          label="Dashboard"
          to="/"
          isActive={pathname === '/'}
          collapsed={effectiveCollapsed}
        />
        <SidebarItem
          icon={BarChart3}
          label="Dashboard Executivo"
          to="/dashboard-executivo"
          isActive={pathname === '/dashboard-executivo'}
          collapsed={effectiveCollapsed}
        />

        <SidebarGroup title="Operacional" collapsed={effectiveCollapsed}>
          <SidebarItem
            icon={FileWarning}
            label="Críticas Contábeis"
            to="/critica"
            isActive={pathname === '/critica'}
            collapsed={effectiveCollapsed}
          />
          <SidebarItem
            icon={Receipt}
            label="Notas Fiscais"
            to="/notas-fiscais"
            isActive={pathname === '/notas-fiscais'}
            collapsed={effectiveCollapsed}
          />
          <SidebarItem
            icon={BookOpen}
            label="Razão"
            to="/razao"
            isActive={pathname === '/razao'}
            collapsed={effectiveCollapsed}
          />
          <SidebarItem
            icon={ReceiptText}
            label="Extratos"
            to="/extratos"
            isActive={pathname === '/extratos'}
            collapsed={effectiveCollapsed}
          />
        </SidebarGroup>

        <SidebarGroup title="Financeiro" collapsed={effectiveCollapsed}>
          <SidebarItem
            icon={Landmark}
            label="Bancos"
            to="/bancos"
            isActive={pathname === '/bancos'}
            collapsed={effectiveCollapsed}
          />
          <SidebarItem
            icon={Scale}
            label="Balancete"
            to="/balancete"
            isActive={pathname === '/balancete'}
            collapsed={effectiveCollapsed}
          />
          <SidebarItem
            icon={TrendingUp}
            label="DRE"
            to="/dre"
            isActive={pathname === '/dre'}
            collapsed={effectiveCollapsed}
          />
        </SidebarGroup>

        <SidebarGroup title="Estrutura" collapsed={effectiveCollapsed}>
          <SidebarItem
            icon={ListTree}
            label="Plano de Contas"
            to="/plano-contas"
            isActive={pathname === '/plano-contas'}
            collapsed={effectiveCollapsed}
          />
          <SidebarItem
            icon={Briefcase}
            label="Atividades"
            to="/atividades"
            isActive={pathname === '/atividades'}
            collapsed={effectiveCollapsed}
          />
          <SidebarItem
            icon={Building2}
            label="Centro de Custos"
            to="/centro-custos"
            isActive={pathname === '/centro-custos'}
            collapsed={effectiveCollapsed}
          />
        </SidebarGroup>

        <SidebarGroup title="Sistema" collapsed={effectiveCollapsed}>
          <SidebarItem
            icon={Settings}
            label="Configurações"
            to="/settings"
            isActive={pathname === '/settings'}
            collapsed={effectiveCollapsed}
          />
          <SidebarItem
            icon={HelpCircle}
            label="Ajuda"
            to="/help"
            isActive={pathname === '/help'}
            collapsed={effectiveCollapsed}
          />
        </SidebarGroup>
      </div>

      <div className="mt-auto space-y-2">
        {!mobile && (
          <button
            onClick={toggle}
            title={effectiveCollapsed ? 'Expandir menu' : 'Recolher menu'}
            className={cn(
              'flex items-center rounded-xl transition-colors text-gray-500 hover:bg-white hover:shadow-sm w-full',
              effectiveCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3',
            )}
          >
            {effectiveCollapsed ? (
              <PanelLeftOpen className="w-5 h-5" />
            ) : (
              <>
                <PanelLeftClose className="w-5 h-5" />
                <span className="text-sm font-medium">Recolher menu</span>
              </>
            )}
          </button>
        )}
        <button
          onClick={handleLogout}
          title={effectiveCollapsed ? 'Sair' : undefined}
          className={cn(
            'flex items-center rounded-xl transition-colors text-red-500 hover:bg-red-50 w-full',
            effectiveCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-2',
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!effectiveCollapsed && <span className="font-medium">Sair</span>}
        </button>
      </div>
    </aside>
  )
}
