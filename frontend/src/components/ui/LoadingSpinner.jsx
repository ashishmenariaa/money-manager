import { cn } from '@/lib/utils'

export default function LoadingSpinner({ size = 'md', className }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className={cn('border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin', sizes[size])} />
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-64">
      <LoadingSpinner size="lg" />
    </div>
  )
}
