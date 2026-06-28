import { useState, useEffect, useCallback } from 'react'
import { Landmark, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Banco, Transacao, TipoTransacao, FormaPagamento } from '@/lib/types'
import { fetchAll } from '@/services/crudService'
import { supabase } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    v,
  )

export default function Extratos() {
  const [bancos, setBancos] = useState<Banco[]>([])
  const [movements, setMovements] = useState<Transacao[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [bancosData, transData] = await Promise.all([
        fetchAll<Banco>('bancos'),
        supabase
          .from('transactions')
          .select('*')
          .order('date', { ascending: false })
          .limit(20),
      ])
      setBancos(bancosData)

      const mapped: Transacao[] = (transData.data || []).map(
        (row: Record<string, unknown>) => ({
          id: row.id as string,
          data: new Date(row.date as string),
          descricao: row.description as string,
          valor: Number(row.amount),
          categoria_id: row.category as string,
          tipo_id: row.type as TipoTransacao,
          forma_pagamento_id: row.payment_method as FormaPagamento,
          observacoes: row.notes as string | undefined,
        }),
      )
      setMovements(mapped)
    } catch {
      toast.error('Erro ao carregar extratos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const totalBalance = bancos.reduce((sum, b) => sum + b.saldo_atual, 0)

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Extratos Bancários</h1>
        <p className="text-gray-500">
          Acompanhe movimentações e saldos das contas.
        </p>
      </div>

      <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-600">
          Saldo Total Consolidado
        </span>
        <span className="text-2xl font-bold text-primary">
          {formatCurrency(totalBalance)}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {bancos.map((banco) => (
          <Card key={banco.id} className="rounded-2xl border shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Landmark className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{banco.banco}</h3>
                  <p className="text-xs text-gray-500 font-mono">
                    Ag: {banco.agencia} | CC: {banco.conta_corrente}
                  </p>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Saldo Atual</span>
                <span
                  className={cn(
                    'text-lg font-bold',
                    banco.saldo_atual >= 0 ? 'text-gray-900' : 'text-red-600',
                  )}
                >
                  {formatCurrency(banco.saldo_atual)}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-xl border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold">
            Movimentações Recentes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-auto">
          {movements.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead className="w-[120px]">Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Forma de Pagamento</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-gray-600 text-sm">
                      {format(m.data, 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            'w-7 h-7 rounded-full flex items-center justify-center',
                            m.tipo_id === TipoTransacao.Receita
                              ? 'bg-green-100 text-green-600'
                              : 'bg-red-100 text-red-600',
                          )}
                        >
                          {m.tipo_id === TipoTransacao.Receita ? (
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <span className="font-medium text-gray-900 text-sm">
                          {m.descricao}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {m.forma_pagamento_id}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'text-right font-bold text-sm',
                        m.tipo_id === TipoTransacao.Receita
                          ? 'text-green-600'
                          : 'text-gray-900',
                      )}
                    >
                      {m.tipo_id === TipoTransacao.Receita ? '+' : '-'}
                      {formatCurrency(m.valor)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-gray-500 text-sm">
                Nenhuma movimentação encontrada.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
