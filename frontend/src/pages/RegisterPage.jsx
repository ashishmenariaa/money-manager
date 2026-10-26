import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import api from '@/lib/axios'
import { useAuthStore } from '@/store/authStore'
import { AuthLayout, Field } from '@/pages/LoginPage'

const schema = z.object({
  firstName: z.string().min(1, 'Required').max(100),
  lastName: z.string().min(1, 'Required').max(100),
  email: z.string().email('Enter a valid email'),
  password: z.string()
    .min(8, 'At least 8 characters')
    .max(72)
    .regex(/^(?=.*[A-Za-z])(?=.*\d)/, 'Include a letter and a number'),
})

export default function RegisterPage() {
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  const signUp = useMutation({
    mutationFn: (values) => api.post('/auth/register', values),
    onSuccess: ({ data }) => {
      setSession(data.data)
      navigate('/dashboard', { replace: true })
    },
  })

  return (
    <AuthLayout title="Create your account">
      <form onSubmit={handleSubmit((v) => signUp.mutate(v))} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" error={errors.firstName}>
            <input autoComplete="given-name" className="input" {...register('firstName')} />
          </Field>
          <Field label="Last name" error={errors.lastName}>
            <input autoComplete="family-name" className="input" {...register('lastName')} />
          </Field>
        </div>
        <Field label="Email" error={errors.email}>
          <input type="email" autoComplete="email" className="input" {...register('email')} />
        </Field>
        <Field label="Password" error={errors.password}>
          <input type="password" autoComplete="new-password" className="input" {...register('password')} />
        </Field>
        <button type="submit" className="btn-primary w-full" disabled={signUp.isPending}>
          {signUp.isPending ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="text-sm text-gray-500 text-center mt-6">
        Already have an account? <Link to="/login" className="text-primary-600 font-medium hover:underline">Sign in</Link>
      </p>
    </AuthLayout>
  )
}
