import { useState } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface Notification {
  id: number
  title: string
  description: string
  time: string
  read: boolean
}

const defaultNotifications: Notification[] = [
  {
    id: 1,
    title: 'Nova Crítica Criada',
    description: 'Uma nova crítica contábil foi registrada no sistema.',
    time: 'há 5 min',
    read: false,
  },
  {
    id: 2,
    title: 'Reconciliação Concluída',
    description: '3 transações foram reconciliadas automaticamente.',
    time: 'há 1 hora',
    read: false,
  },
  {
    id: 3,
    title: 'Extrato Importado',
    description: 'Extrato bancário importado com sucesso.',
    time: 'há 2 horas',
    read: true,
  },
  {
    id: 4,
    title: 'Lançamento no Razão',
    description: 'Novo lançamento contábil adicionado ao razão.',
    time: 'há 3 horas',
    read: true,
  },
]

export function NotificationCenter() {
  const [notifications, setNotifications] =
    useState<Notification[]>(defaultNotifications)
  const unreadCount = notifications.filter((n) => !n.read).length

  const markAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })))
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="bg-white rounded-full shadow-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 relative"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-sm">Notificações</h3>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs text-primary hover:underline"
            >
              Marcar todas como lidas
            </button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              Nenhuma notificação
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    'p-4 hover:bg-gray-50 transition-colors',
                    !n.read && 'bg-blue-50/50',
                  )}
                >
                  <div className="flex items-start gap-2">
                    {!n.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {n.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {n.description}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{n.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
