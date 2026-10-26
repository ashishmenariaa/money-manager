import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { TrendingUp } from 'lucide-react'
import api from '@/lib/axios'
import { useAuthStore } from '@/store/authStore'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Required'),
})

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const setSession = useAuthStore((s) => s.setSession)
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  const login = useMutation({
    mutationFn: (values) => api.post('/auth/login', values),
    onSuccess: ({ data }) => {
      setSession(data.data)
      navigate(location.state?.from || '/dashboard', { replace: true })
    },
  })

  return (
    <AuthLayout title="Sign in to MoneyManager">
      <form onSubmit={handleSubmit((v) => login.mutate(v))} className="space-y-4">
        <Field label="Email" error={errors.email}>
          <input type="email" autoComplete="email" className="input" {...register('email')} />
        </Field>
        <Field label="Password" error={errors.password}>
          <input type="password" autoComplete="current-password" className="input" {...register('password')} />
        </Field>
        <button type="submit" className="btn-primary w-full" disabled={login.isPending}>
          {login.isPending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="text-sm text-gray-500 text-center mt-6">
        New here? <Link to="/register" className="text-primary-600 font-medium hover:underline">Create an account</Link>
      </p>
    </AuthLayout>
  )
}

export function AuthLayout({ title, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-6">
          <TrendingUp className="text-primary-600" size={28} />
          <span className="text-xl font-bold text-gray-900">MoneyManager</span>
        </div>
        <div className="card">
          <h1 className="text-lg font-semibold text-gray-900 mb-5">{title}</h1>
          {children}
        </div>
      </div>
    </div>
  )
}

export function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-1">{label}</span>
      {children}
      {error && <span className="block text-xs text-red-600 mt-1">{error.message}</span>}
    </label>
  )
}
