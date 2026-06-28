import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react'
import { transactionService } from '@/services/transactionService'
import { ComboboxFilterState } from '@/components/ComboboxFilter'
import { Transacao, Role } from '@/lib/types'
import { useAuth } from '@/hooks/use-auth'

interface TransactionStoreType {
  transactions: Transacao[]
  loading: boolean
  initialized: boolean
  fetchTransactions: (filters: ComboboxFilterState) => Promise<void>
}

const TransactionContext = createContext<TransactionStoreType | undefined>(
  undefined,
)

export const TransactionProvider = ({ children }: { children: ReactNode }) => {
  const { role } = useAuth()
  const [transactions, setTransactions] = useState<Transacao[]>([])
  const [loading, setLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)

  const fetchTransactions = useCallback(
    async (filters: ComboboxFilterState) => {
      try {
        setLoading(true)
        const data = await transactionService.fetchTransactions(
          filters,
          (role as Role) || 'visitante',
        )
        setTransactions(data)
      } catch {
        setTransactions([])
      } finally {
        setLoading(false)
        setInitialized(true)
      }
    },
    [role],
  )

  return (
    <TransactionContext.Provider
      value={{ transactions, loading, initialized, fetchTransactions }}
    >
      {children}
    </TransactionContext.Provider>
  )
}

const useTransactionStore = () => {
  const context = useContext(TransactionContext)
  if (!context)
    throw new Error(
      'useTransactionStore must be used within TransactionProvider',
    )
  return context
}

export default useTransactionStore
