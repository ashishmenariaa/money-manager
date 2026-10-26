import { useState } from 'react'
import { Plus, Search, Filter, Download, Edit2, Trash2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'
import { useTransactions, useCreateTransaction, useUpdateTransaction, useDeleteTransaction } from '@/hooks/useTransactions'
import { useCategories } from '@/hooks/useCategories'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import TransactionForm from '@/components/transactions/TransactionForm'
import EmptyState from '@/components/ui/EmptyState'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { formatCurrency, formatDate } from '@/lib/utils'
import api from '@/lib/axios'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export default function TransactionsPage() {
  const [showModal, setShowModal] = useState(false)
  const [editTx, setEditTx] = useState(null)
  const [deleteTx, setDeleteTx] = useState(null)
  const [filters, setFilters] = useState({ type: '', categoryId: '', startDate: '', endDate: '', page: 0 })

  const { data: txData, isLoading } = useTransactions(
    Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''))
  )
  const { data: categories = [] } = useCategories()
  const createMutation = useCreateTransaction()
  const updateMutation = useUpdateTransaction()
  const deleteMutation = useDeleteTransaction()

  const transactions = txData?.content || []
  const totalPages = txData?.totalPages || 0

  const handleCreate = async (data) => {
    await createMutation.mutateAsync(data)
    setShowModal(false)
  }

  const handleUpdate = async (data) => {
    await updateMutation.mutateAsync({ id: editTx.id, ...data })
    setEditTx(null)
  }

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(deleteTx.id)
    setDeleteTx(null)
  }

  const handleExport = async () => {
    try {
      const start = filters.startDate || format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd')
      const end = filters.endDate || format(new Date(), 'yyyy-MM-dd')
      const response = await api.get('/analytics/export/csv', {
        params: { startDate: start, endDate: end },
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = 'transactions.csv'
      a.click()
      toast.success('Export downloaded')
    } catch {
      toast.error('Export failed')
    }
  }

  const getEditDefaults = (tx) => ({
    amount: String(tx.amount),
    type: tx.type,
    categoryId: String(tx.category.id),
    transactionDate: tx.transactionDate,
    description: tx.description || '',
    notes: tx.notes || '',
  })

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <select
            value={filters.type}
            onChange={e => setFilters(f => ({ ...f, type: e.target.value, page: 0 }))}
            className="input w-auto text-sm"
          >
            <option value="">All Types</option>
            <option value="INCOME">Income</option>
            <option value="EXPENSE">Expense</option>
          </select>

          <select
            value={filters.categoryId}
            onChange={e => setFilters(f => ({ ...f, categoryId: e.target.value, page: 0 }))}
            className="input w-auto text-sm"
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <input
            type="date"
            value={filters.startDate}
            onChange={e => setFilters(f => ({ ...f, startDate: e.target.value, page: 0 }))}
            className="input w-auto text-sm"
            placeholder="Start date"
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={e => setFilters(f => ({ ...f, endDate: e.target.value, page: 0 }))}
            className="input w-auto text-sm"
          />
        </div>

        <div className="flex gap-2">
          <button onClick={handleExport} className="btn-secondary flex items-center gap-2 text-sm">
            <Download size={16} /> Export
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={16} /> Add Transaction
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      {isLoading ? (
        <PageLoader />
      ) : transactions.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={ArrowUpCircle}
            title="No transactions found"
            description="Add your first transaction to start tracking"
            action={
              <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
                <Plus size={16} /> Add Transaction
              </button>
            }
          />
        </div>
      ) : (
        <div className="card !p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Description</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Category</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Type</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Amount</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-gray-500">{formatDate(tx.transactionDate)}</td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{tx.description || tx.category.name}</p>
                        {tx.notes && <p className="text-xs text-gray-400 truncate max-w-[200px]">{tx.notes}</p>}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium bg-gray-100 text-gray-700">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ background: tx.category.color || '#6b7280' }}
                        />
                        {tx.category.name}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={tx.type === 'INCOME' ? 'badge-income' : 'badge-expense'}>
                        {tx.type === 'INCOME' ? <ArrowUpCircle size={12} className="mr-1" /> : <ArrowDownCircle size={12} className="mr-1" />}
                        {tx.type}
                      </span>
                    </td>
                    <td className={`py-3 px-4 text-right font-semibold ${tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditTx(tx)}
                          className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteTx(tx)}
                          className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 py-4 border-t border-gray-100">
              <button
                disabled={filters.page === 0}
                onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500">Page {filters.page + 1} of {totalPages}</span>
              <button
                disabled={filters.page + 1 >= totalPages}
                onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Transaction">
        <TransactionForm
          onSubmit={handleCreate}
          isLoading={createMutation.isPending}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editTx} onClose={() => setEditTx(null)} title="Edit Transaction">
        {editTx && (
          <TransactionForm
            defaultValues={getEditDefaults(editTx)}
            onSubmit={handleUpdate}
            isLoading={updateMutation.isPending}
          />
        )}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTx}
        onClose={() => setDeleteTx(null)}
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? This action cannot be undone."
      />
    </div>
  )
}
