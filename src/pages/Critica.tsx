import { useState, useEffect } from 'react'
import { Plus, FileUp } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { TransactionForm } from '@/components/transactions/TransactionForm'
import {
  ComboboxFilter,
  ComboboxFilterState,
  ComboboxFilterColumn,
} from '@/components/ComboboxFilter'
import { TransactionsTable } from '@/components/transactions/TransactionsTable'
import { PdfImportModal } from '@/components/pdf/PdfImportModal'
import useTransactionStore from '@/stores/useTransactionStore'
import { Transacao } from '@/lib/types'
import { useAuth } from '@/hooks/use-auth'
import AccessDenied from '@/pages/AccessDenied'

const filterColumns: ComboboxFilterColumn[] = [
  { value: 'description', label: 'Descrição' },
  {
    value: 'type',
    label: 'Tipo',
    options: [
      { value: 'Receita', label: 'Receita' },
      { value: 'Despesa', label: 'Despesa' },
    ],
  },
  { value: 'notes', label: 'Observações' },
]

const Critica = () => {
  const { transactions, fetchTransactions, loading, initialized } =
    useTransactionStore()
  const { role } = useAuth()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isPdfOpen, setIsPdfOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] =
    useState<Transacao | null>(null)

  const [filters, setFilters] = useState<ComboboxFilterState>({
    column: '',
    value: '',
    dateRange: undefined,
  })

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTransactions(filters)
    }, 300)
    return () => clearTimeout(timer)
  }, [filters, fetchTransactions])

  const handleCreate = () => {
    setEditingTransaction(null)
    setIsFormOpen(true)
  }

  const handleEdit = (transaction: Transacao) => {
    setEditingTransaction(transaction)
    setIsFormOpen(true)
  }

  if (role === 'visitante') {
    return <AccessDenied />
  }

  const showLoading = loading || !initialized

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Críticas Contábeis
          </h1>
          <p className="text-gray-500">
            Gerencie seus registros financeiros e histórico.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsPdfOpen(true)}>
            <FileUp className="w-4 h-4 mr-2" />
            Importar PDF
          </Button>
          <Button
            onClick={handleCreate}
            className="shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Crítica
          </Button>
        </div>
      </div>

      <ComboboxFilter
        columns={filterColumns}
        filters={filters}
        setFilters={setFilters}
      />

      {showLoading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <TransactionsTable data={transactions} onEdit={handleEdit} />
      )}

      <TransactionForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        transactionToEdit={editingTransaction}
        onSuccess={() => fetchTransactions(filters)}
      />

      <PdfImportModal
        open={isPdfOpen}
        onOpenChange={setIsPdfOpen}
        entityType="transactions"
        onSuccess={() => fetchTransactions(filters)}
      />
    </div>
  )
}

export default Critica
