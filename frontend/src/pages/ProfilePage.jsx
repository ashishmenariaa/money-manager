import useAuthStore from '@/store/authStore'
import { formatDate } from '@/lib/utils'
import { User, Mail, Calendar, Crown, Shield } from 'lucide-react'

const PLAN_FEATURES = {
  FREE: ['Up to 50 transactions/month', 'Basic categories', 'Monthly reports'],
  BASIC: ['Unlimited transactions', 'Custom categories', 'Export to CSV', 'Monthly/Yearly reports'],
  PREMIUM: ['Everything in Basic', 'Advanced analytics', 'Budget tracking', 'Priority support'],
}

export default function ProfilePage() {
  const { user } = useAuthStore()
  const plan = user?.subscription?.plan || 'FREE'

  return (
    <div className="max-w-2xl space-y-6">
      {/* Profile Card */}
      <div className="card">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-2xl flex-shrink-0">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{user?.fullName}</h2>
            <p className="text-gray-500 text-sm">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${user?.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                {user?.role === 'ADMIN' ? <span className="flex items-center gap-1"><Shield size={10} /> Admin</span> : 'User'}
              </span>
              <span className="text-xs px-2 py-0.5 rounded font-medium bg-blue-100 text-blue-700">
                {plan} Plan
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <User size={16} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">Full Name</p>
              <p className="text-sm font-medium">{user?.fullName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Mail size={16} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">Email</p>
              <p className="text-sm font-medium">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Calendar size={16} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">Member Since</p>
              <p className="text-sm font-medium">{formatDate(user?.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Crown size={16} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">Subscription</p>
              <p className="text-sm font-medium capitalize">{plan}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Plans */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-4">Subscription Plans</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Object.entries(PLAN_FEATURES).map(([planName, features]) => (
            <div
              key={planName}
              className={`p-4 rounded-xl border-2 transition-colors ${plan === planName ? 'border-primary-500 bg-primary-50' : 'border-gray-100'}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-gray-900">{planName}</span>
                {plan === planName && (
                  <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded font-medium">Current</span>
                )}
              </div>
              <ul className="space-y-1.5">
                {features.map(f => (
                  <li key={f} className="text-xs text-gray-600 flex items-center gap-1.5">
                    <span className="text-green-500 flex-shrink-0">✓</span> {f}
                  </li>
                ))}
              </ul>
              {plan !== planName && planName !== 'FREE' && (
                <button className="mt-3 w-full btn-primary text-xs py-1.5">
                  Upgrade to {planName}
                </button>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3 text-center">
          Payment integration coming soon (Stripe-ready)
        </p>
      </div>
    </div>
  )
}
