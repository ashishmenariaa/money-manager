import { useState } from 'react'
import { Plus, Edit2, Trash2, Tag, Lock } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/useCategories'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import EmptyState from '@/components/ui/EmptyState'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

const schema = z.object({
  name: z.string().min(2, 'Min 2 characters').max(100),
  type: z.enum(['INCOME', 'EXPENSE', 'BOTH']),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color').optional().or(z.literal('')),
  icon: z.string().max(50).optional(),
})

const PRESET_COLORS = ['#ef4444','#f97316','#f59e0b','#22c55e','#3b82f6','#6366f1','#8b5cf6','#ec4899','#14b8a6','#64748b']

function CategoryForm({ defaultValues, onSubmit, isLoading }) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultValues || { type: 'EXPENSE', color: '#6366f1' },
  })
  const color = watch('color')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
        <input {...register('name')} className="input" placeholder="Category name" />
        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
        <select {...register('type')} className="input">
          <option value="EXPENSE">Expense</option>
          <option value="INCOME">Income</option>
          <option value="BOTH">Both</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
        <div className="flex items-center gap-2 flex-wrap">
          {PRESET_COLORS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setValue('color', c)}
              className={`w-7 h-7 rounded-full border-2 transition-transform ${color === c ? 'border-gray-900 scale-110' : 'border-transparent'}`}
              style={{ backgroundColor: c }}
            />
          ))}
          <input
            {...register('color')}
            type="color"
            className="w-7 h-7 rounded cursor-pointer border border-gray-200"
          />
        </div>
        {errors.color && <p className="mt-1 text-xs text-red-500">{errors.color.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Icon <span className="text-gray-400">(optional)</span></label>
        <input {...register('icon')} className="input" placeholder="e.g. utensils, car, home" />
        <p className="text-xs text-gray-400 mt-1">Use icon names from Lucide React library</p>
      </div>

      <button type="submit" disabled={isLoading} className="btn-primary w-full">
        {isLoading ? 'Saving...' : defaultValues ? 'Update Category' : 'Create Category'}
      </button>
    </form>
  )
}

export default function CategoriesPage() {
  const [showModal, setShowModal] = useState(false)
  const [editCat, setEditCat] = useState(null)
  const [deleteCat, setDeleteCat] = useState(null)

  const { data: categories = [], isLoading } = useCategories()
  const createMutation = useCreateCategory()
  const updateMutation = useUpdateCategory()
  const deleteMutation = useDeleteCategory()

  const customCats = categories.filter(c => !c.predefined)
  const predefinedCats = categories.filter(c => c.predefined)

  const handleCreate = async (data) => {
    await createMutation.mutateAsync(data)
    setShowModal(false)
  }

  const handleUpdate = async (data) => {
    await updateMutation.mutateAsync({ id: editCat.id, ...data })
    setEditCat(null)
  }

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(deleteCat.id)
    setDeleteCat(null)
  }

  if (isLoading) return <PageLoader />

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{categories.length} categories total</p>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> New Category
        </button>
      </div>

      {/* Custom Categories */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-4">My Categories</h3>
        {customCats.length === 0 ? (
          <EmptyState
            icon={Tag}
            title="No custom categories"
            description="Create custom categories to organize your transactions"
            action={
              <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm">
                <Plus size={16} /> Create Category
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {customCats.map(cat => (
              <CategoryCard
                key={cat.id}
                cat={cat}
                onEdit={() => setEditCat(cat)}
                onDelete={() => setDeleteCat(cat)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Predefined Categories */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-4">Default Categories</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {predefinedCats.map(cat => (
            <CategoryCard key={cat.id} cat={cat} readonly />
          ))}
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Create Category">
        <CategoryForm onSubmit={handleCreate} isLoading={createMutation.isPending} />
      </Modal>

      <Modal open={!!editCat} onClose={() => setEditCat(null)} title="Edit Category">
        {editCat && (
          <CategoryForm
            defaultValues={{ name: editCat.name, type: editCat.type, color: editCat.color || '', icon: editCat.icon || '' }}
            onSubmit={handleUpdate}
            isLoading={updateMutation.isPending}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteCat}
        onClose={() => setDeleteCat(null)}
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
        title="Delete Category"
        message={`Delete "${deleteCat?.name}"? Existing transactions will not be deleted.`}
      />
    </div>
  )
}

function CategoryCard({ cat, onEdit, onDelete, readonly }) {
  const typeColors = {
    INCOME: 'bg-green-50 text-green-700',
    EXPENSE: 'bg-red-50 text-red-700',
    BOTH: 'bg-blue-50 text-blue-700',
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors group">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
        style={{ backgroundColor: cat.color || '#6b7280' }}
      >
        {cat.name[0].toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 text-sm truncate">{cat.name}</p>
        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${typeColors[cat.type]}`}>
          {cat.type}
        </span>
      </div>
      {readonly ? (
        <Lock size={14} className="text-gray-300 flex-shrink-0" />
      ) : (
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50">
            <Edit2 size={13} />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50">
            <Trash2 size={13} />
          </button>
        </div>
      )}
    </div>
  )
}
