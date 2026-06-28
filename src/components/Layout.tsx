import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { useIsMobile } from '@/hooks/use-mobile'
import { ExpandableChat } from '@/components/ui/expandable-chat'

export default function Layout() {
  const isMobile = useIsMobile()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Sidebar Drawer */}
      {isMobile && (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent
            side="left"
            className="p-0 w-[280px] border-r-0 bg-transparent"
          >
            <div className="h-full bg-[#F5F8F5] overflow-y-auto">
              <Sidebar mobile />
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-[280px] flex flex-col min-h-screen">
        <Header
          onMenuClick={isMobile ? () => setSidebarOpen(true) : undefined}
        />
        <div className="flex-1 p-6 overflow-x-hidden">
          <Outlet />
        </div>
      </main>

      {/* Admin Chat Interface */}
      <ExpandableChat />
    </div>
  )
}
