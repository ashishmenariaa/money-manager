import { useState } from 'react'
import { Plus, Edit2, Trash2, PiggyBank, AlertTriangle, CheckCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useBudgets, useCreateBudget, useUpdateBudget, useDeleteBudget } from '@/hooks/useBudgets'
import { useCategories } from '@/hooks/useCategories'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import EmptyState from '@/components/ui/EmptyState'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { formatCurrency, formatMonth, getCurrentMonthYear, MONTHS } from '@/lib/utils'
import { cn } from '@/lib/utils'

const schema = z.object({
  categoryId: z.string().min(1, 'Required'),
  limitAmount: z.string().min(1, 'Required').refine(v => !isNaN(Number(v)) && Number(v) > 0, 'Must be positive'),
  month: z.string().min(1, 'Required'),
  year: z.string().min(1, 'Required'),
})

function BudgetForm({ defaultValues, onSubmit, isLoading, month, year }) {
  const { data: categories = [] } = useCategories()
  const expenseCategories = categories.filter(c => c.type === 'EXPENSE' || c.type === 'BOTH')
  const currentYear = new Date().getFullYear()

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultValues || {
      month: String(month),
      year: String(year),
    },
  })

  const handleFormSubmit = (data) => {
    onSubmit({
      categoryId: Number(data.categoryId),
      limitAmount: Number(data.limitAmount),
      month: Number(data.month),
      year: Number(data.year),
    })
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
          <select {...register('month')} className="input">
            {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          {errors.month && <p className="mt-1 text-xs text-red-500">{errors.month.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
          <select {...register('year')} className="input">
            {[currentYear - 1, currentYear, currentYear + 1].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
        <select {...register('categoryId')} className="input">
          <option value="">Select category...</option>
          {expenseCategories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {errors.categoryId && <p className="mt-1 text-xs text-red-500">{errors.categoryId.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Budget Limit</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
          <input
            {...register('limitAmount')}
            type="number"
            step="0.01"
            min="0.01"
            className="input pl-7"
            placeholder="0.00"
          />
        </div>
        {errors.limitAmount && <p className="mt-1 text-xs text-red-500">{errors.limitAmount.message}</p>}
      </div>

      <button type="submit" disabled={isLoading} className="btn-primary w-full">
        {isLoading ? 'Saving...' : defaultValues ? 'Update Budget' : 'Set Budget'}
      </button>
    </form>
  )
}

function BudgetCard({ budget, onEdit, onDelete }) {
  const pct = Math.min(budget.percentageUsed, 100)
  const isOver = budget.exceeded
  const isWarning = !isOver && budget.percentageUsed >= 80

  return (
    <div className={cn('card', isOver && 'border-l-4 border-l-red-500', isWarning && 'border-l-4 border-l-yellow-400')}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: budget.category.color || '#6b7280' }}
          >
            {budget.category.name[0]}
          </div>
          <span className="font-medium text-gray-900 text-sm">{budget.category.name}</span>
        </div>
        <div className="flex items-center gap-1">
          {isOver ? (
            <AlertTriangle size={16} className="text-red-500" />
          ) : isWarning ? (
            <AlertTriangle size={16} className="text-yellow-500" />
          ) : (
            <CheckCircle size={16} className="text-green-500" />
          )}
          <button onClick={onEdit} className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50">
            <Edit2 size={13} />
          </button>
          <button onClick={onDelete} className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
          <div
            className={cn(
              'h-2.5 rounded-full transition-all duration-500',
              isOver ? 'bg-red-500' : isWarning ? 'bg-yellow-400' : 'bg-green-500'
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span className={cn('font-medium', isOver ? 'text-red-600' : isWarning ? 'text-yellow-600' : 'text-green-600')}>
            {budget.percentageUsed.toFixed(0)}% used
          </span>
          <span>{formatCurrency(budget.spentAmount)} / {formatCurrency(budget.limitAmount)}</span>
        </div>
        <p className="text-xs text-gray-400">
          {isOver
            ? `Over by ${formatCurrency(Math.abs(budget.remainingAmount))}`
            : `${formatCurrency(budget.remainingAmount)} remaining`
          }
        </p>
      </div>
    </div>
  )
}

export default function BudgetsPage() {
  const { month, year } = getCurrentMonthYear()
  const [selectedMonth, setSelectedMonth] = useState(month)
  const [selectedYear, setSelectedYear] = useState(year)
  const [showModal, setShowModal] = useState(false)
  const [editBudget, setEditBudget] = useState(null)
  const [deleteBudget, setDeleteBudget] = useState(null)

  const { data: budgets = [], isLoading } = useBudgets(selectedMonth, selectedYear)
  const createMutation = useCreateBudget()
  const updateMutation = useUpdateBudget()
  const deleteMutation = useDeleteBudget()

  const currentYear = new Date().getFullYear()

  const handleCreate = async (data) => {
    await createMutation.mutateAsync(data)
    setShowModal(false)
  }

  const handleUpdate = async (data) => {
    await updateMutation.mutateAsync({ id: editBudget.id, ...data })
    setEditBudget(null)
  }

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(deleteBudget.id)
    setDeleteBudget(null)
  }

  const getEditDefaults = (b) => ({
    categoryId: String(b.category.id),
    limitAmount: String(b.limitAmount),
    month: String(b.month),
    year: String(b.year),
  })

  const totalBudget = budgets.reduce((s, b) => s + Number(b.limitAmount), 0)
  const totalSpent = budgets.reduce((s, b) => s + Number(b.spentAmount), 0)
  const exceededCount = budgets.filter(b => b.exceeded).length

  if (isLoading) return <PageLoader />

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(Number(e.target.value))}
            className="input w-auto text-sm"
          >
            {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            className="input w-auto text-sm"
          >
            {[currentYear - 1, currentYear, currentYear + 1].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> Set Budget
        </button>
      </div>

      {/* Summary */}
      {budgets.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="card text-center">
            <p className="text-xs text-gray-500 mb-1">Total Budget</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(totalBudget)}</p>
          </div>
          <div className="card text-center">
            <p className="text-xs text-gray-500 mb-1">Total Spent</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(totalSpent)}</p>
          </div>
          <div className="card text-center">
            <p className="text-xs text-gray-500 mb-1">Exceeded</p>
            <p className={`text-xl font-bold ${exceededCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {exceededCount} / {budgets.length}
            </p>
          </div>
        </div>
      )}

      {/* Budget Cards */}
      {budgets.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={PiggyBank}
            title="No budgets set"
            description={`Set your spending limits for ${formatMonth(selectedMonth, selectedYear)}`}
            action={
              <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm">
                <Plus size={16} /> Set Budget
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {budgets.map(budget => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              onEdit={() => setEditBudget(budget)}
              onDelete={() => setDeleteBudget(budget)}
            />
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Set Budget">
        <BudgetForm
          onSubmit={handleCreate}
          isLoading={createMutation.isPending}
          month={selectedMonth}
          year={selectedYear}
        />
      </Modal>

      <Modal open={!!editBudget} onClose={() => setEditBudget(null)} title="Update Budget">
        {editBudget && (
          <BudgetForm
            defaultValues={getEditDefaults(editBudget)}
            onSubmit={handleUpdate}
            isLoading={updateMutation.isPending}
            month={selectedMonth}
            year={selectedYear}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteBudget}
        onClose={() => setDeleteBudget(null)}
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
        title="Delete Budget"
        message={`Remove the budget for "${deleteBudget?.category?.name}"?`}
      />
    </div>
  )
}
