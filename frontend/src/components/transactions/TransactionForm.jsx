import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCategories } from '@/hooks/useCategories'
import { format } from 'date-fns'

const schema = z.object({
  amount: z.string().min(1, 'Required').refine(v => !isNaN(Number(v)) && Number(v) > 0, 'Must be positive'),
  type: z.enum(['INCOME', 'EXPENSE']),
  categoryId: z.string().min(1, 'Required'),
  transactionDate: z.string().min(1, 'Required'),
  description: z.string().optional(),
  notes: z.string().optional(),
})

export default function TransactionForm({ defaultValues, onSubmit, isLoading }) {
  const { data: categories = [] } = useCategories()
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultValues || {
      type: 'EXPENSE',
      transactionDate: format(new Date(), 'yyyy-MM-dd'),
    },
  })

  const selectedType = watch('type')
  const filteredCategories = categories.filter(c =>
    c.type === selectedType || c.type === 'BOTH'
  )

  const handleFormSubmit = (data) => {
    onSubmit({
      ...data,
      amount: Number(data.amount),
      categoryId: Number(data.categoryId),
    })
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {/* Type Toggle */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
        <div className="grid grid-cols-2 gap-2">
          {['INCOME', 'EXPENSE'].map(t => (
            <label key={t} className="cursor-pointer">
              <input {...register('type')} type="radio" value={t} className="sr-only" />
              <div className={`text-center py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                selectedType === t
                  ? t === 'INCOME'
                    ? 'bg-green-50 border-green-500 text-green-700'
                    : 'bg-red-50 border-red-500 text-red-700'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}>
                {t === 'INCOME' ? '↑ Income' : '↓ Expense'}
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Amount */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
          <input
            {...register('amount')}
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            className="input pl-7"
          />
        </div>
        {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount.message}</p>}
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
        <select {...register('categoryId')} className="input">
          <option value="">Select category...</option>
          {filteredCategories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        {errors.categoryId && <p className="mt-1 text-xs text-red-500">{errors.categoryId.message}</p>}
      </div>

      {/* Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
        <input {...register('transactionDate')} type="date" className="input" />
        {errors.transactionDate && <p className="mt-1 text-xs text-red-500">{errors.transactionDate.message}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-gray-400">(optional)</span></label>
        <input {...register('description')} type="text" className="input" placeholder="Brief description" />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes <span className="text-gray-400">(optional)</span></label>
        <textarea {...register('notes')} rows={2} className="input resize-none" placeholder="Additional notes..." />
      </div>

      <button type="submit" disabled={isLoading} className="btn-primary w-full">
        {isLoading ? 'Saving...' : defaultValues ? 'Update Transaction' : 'Add Transaction'}
      </button>
    </form>
  )
}
