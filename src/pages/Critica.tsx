import { useState, useEffect } from 'react'
import { Plus, FileUp, Download } from 'lucide-react'
import { toast } from 'sonner'
import { deleteRecord } from '@/services/crudService'
import { TransactionViewDialog } from '@/components/transactions/TransactionViewDialog'
import { Button } from '@/components/ui/button'
import { TransactionForm } from '@/components/transactions/TransactionForm'
import {
  CriticaFilters,
  CriticaFilterState,
} from '@/components/critica/CriticaFilters'
import { TransactionsTable } from '@/components/transactions/TransactionsTable'
import { PdfImportModal } from '@/components/pdf/PdfImportModal'
import { PdfExportButton } from '@/components/PdfExportButton'
import { ColumnVisibility } from '@/components/ColumnVisibility'
import { useColumnVisibility } from '@/hooks/use-column-visibility'
import useTransactionStore from '@/stores/useTransactionStore'
import {
  Transacao,
  Atividade,
  CentroCusto,
  PlanoConta,
  NotaFiscal,
  Filial,
} from '@/lib/types'
import { useAuth } from '@/hooks/use-auth'
import { auxiliaryService } from '@/services/auxiliaryService'
import AccessDenied from '@/pages/AccessDenied'
import {
  exportToCsv,
  buildExportFilename,
  formatCurrencyNumber,
  formatDateBR,
} from '@/lib/export'
import {
  formatAtividade,
  formatCentroCusto,
  formatPlanoConta,
  formatNotaFiscal,
} from '@/lib/relational-format'
import { formatFilial } from '@/lib/filial-format'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const Critica = () => {
  const { transactions, fetchTransactions, loading, initialized } =
    useTransactionStore()
  const { role } = useAuth()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isPdfOpen, setIsPdfOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] =
    useState<Transacao | null>(null)
  const [viewingTransaction, setViewingTransaction] =
    useState<Transacao | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Transacao | null>(null)
  const [atividades, setAtividades] = useState<Atividade[]>([])
  const [centroCustos, setCentroCustos] = useState<CentroCusto[]>([])
  const [planoContas, setPlanoContas] = useState<PlanoConta[]>([])
  const [notasFiscais, setNotasFiscais] = useState<NotaFiscal[]>([])
  const [filiais, setFiliais] = useState<Filial[]>([])

  const [filters, setFilters] = useState<CriticaFilterState>({
    historico: '',
    atividade_id: '',
    centro_custo_id: '',
    plano_conta_id: '',
    nota_fiscal_id: '',
    filial_id: '',
    status: '',
    dateRange: undefined,
  })

  const criticaColumns = [
    { key: 'date', label: 'Data' },
    { key: 'historico', label: 'Histórico' },
    { key: 'amount', label: 'Valor' },
    { key: 'lote', label: 'Lote' },
    { key: 'status', label: 'Status' },
    { key: 'filial', label: 'Filial' },
    { key: 'reconciled', label: 'Reconciliado' },
  ]
  const { visibleColumns, toggleColumn } = useColumnVisibility(
    'critica',
    criticaColumns.map((c) => c.key),
  )

  useEffect(() => {
    auxiliaryService
      .fetchAtividades()
      .then(setAtividades)
      .catch(() => {})
    auxiliaryService
      .fetchCentroCustos()
      .then(setCentroCustos)
      .catch(() => {})
    auxiliaryService
      .fetchPlanoContas()
      .then(setPlanoContas)
      .catch(() => {})
    auxiliaryService
      .fetchNotasFiscais()
      .then(setNotasFiscais)
      .catch(() => {})
    auxiliaryService
      .fetchFiliais()
      .then(setFiliais)
      .catch(() => {})
  }, [])

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

  const handleView = (transaction: Transacao) => {
    setViewingTransaction(transaction)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteRecord('critica', deleteTarget.id)
      toast.success('Crítica excluída com sucesso')
      fetchTransactions(filters)
    } catch {
      toast.error('Erro ao excluir crítica')
    } finally {
      setDeleteTarget(null)
    }
  }

  if (role === 'visitante') {
    return <AccessDenied />
  }

  const showLoading = loading || !initialized

  const handleExport = () => {
    if (transactions.length === 0) {
      toast.error('Nenhum dado para exportar')
      return
    }
    const headers = [
      'Data',
      'Histórico',
      'Valor',
      'Status',
      'Atividade',
      'Centro de Custos',
      'Plano de Contas',
      'Nota Fiscal',
      'Filial',
      'Reconciliado',
    ]
    const rows = transactions.map((t) => [
      formatDateBR(t.date),
      t.historico || '',
      formatCurrencyNumber(t.amount),
      t.status || '',
      formatAtividade(t.atividade_id, atividades),
      formatCentroCusto(t.centro_custo_id, centroCustos),
      formatPlanoConta(t.plano_conta_id, planoContas),
      formatNotaFiscal(t.nota_fiscal_id, notasFiscais),
      formatFilial(t.filial_id, filiais),
      t.reconciled ? 'Sim' : 'Não',
    ])
    exportToCsv(buildExportFilename('critica'), headers, rows)
    toast.success('CSV exportado com sucesso')
  }

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
          <PdfExportButton
            title="Críticas Contábeis"
            columns={[
              { header: 'Data', key: 'date' },
              { header: 'Histórico', key: 'historico' },
              { header: 'Valor', key: 'amount' },
              { header: 'Status', key: 'status' },
              { header: 'Atividade', key: 'atividade' },
              { header: 'Centro de Custos', key: 'centro_custo' },
              { header: 'Plano de Contas', key: 'plano_conta' },
              { header: 'Filial', key: 'filial' },
              { header: 'Reconciliado', key: 'reconciled' },
            ]}
            data={transactions.map((t) => ({
              date: formatDateBR(t.date),
              historico: t.historico || '',
              amount: formatCurrencyNumber(t.amount),
              status: t.status || '',
              atividade: formatAtividade(t.atividade_id, atividades),
              centro_custo: formatCentroCusto(t.centro_custo_id, centroCustos),
              plano_conta: formatPlanoConta(t.plano_conta_id, planoContas),
              filial: formatFilial(t.filial_id, filiais),
              reconciled: t.reconciled ? 'Sim' : 'Não',
            }))}
          />
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
          <ColumnVisibility
            columns={criticaColumns}
            visibleColumns={visibleColumns}
            onToggle={toggleColumn}
          />
          <Button
            onClick={handleCreate}
            className="shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Crítica
          </Button>
        </div>
      </div>
      <CriticaFilters
        filters={filters}
        setFilters={setFilters}
        atividades={atividades}
        centroCustos={centroCustos}
        planoContas={planoContas}
        notasFiscais={notasFiscais}
        filiais={filiais}
      />
      {showLoading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <TransactionsTable
          data={transactions}
          onEdit={handleEdit}
          onView={handleView}
          onDelete={(t) => setDeleteTarget(t)}
          atividades={atividades}
          centroCustos={centroCustos}
          planoContas={planoContas}
          notasFiscais={notasFiscais}
          filiais={filiais}
          visibleColumns={visibleColumns}
        />
      )}
      <TransactionForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        transactionToEdit={editingTransaction}
        onSuccess={() => fetchTransactions(filters)}
        atividades={atividades}
        centroCustos={centroCustos}
        planoContas={planoContas}
        notasFiscais={notasFiscais}
        filiais={filiais}
      />
      <PdfImportModal
        open={isPdfOpen}
        onOpenChange={setIsPdfOpen}
        entityType="transactions"
        onSuccess={() => fetchTransactions(filters)}
      />
      <TransactionViewDialog
        transaction={viewingTransaction}
        open={!!viewingTransaction}
        onOpenChange={(open) => !open && setViewingTransaction(null)}
        atividades={atividades}
        centroCustos={centroCustos}
        planoContas={planoContas}
        filiais={filiais}
      />
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta crítica? Esta ação não pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                confirmDelete()
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default Critica
