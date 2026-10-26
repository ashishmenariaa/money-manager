import { LogOut, Menu } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

const routeTitles = {
  '/dashboard':    'Dashboard',
  '/transactions': 'Transactions',
  '/budgets':      'Budgets',
  '/categories':   'Categories',
  '/analytics':    'Analytics',
  '/admin':        'Admin',
}

export default function Header({ onMenuClick }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, refreshToken, clearSession } = useAuthStore()

  const handleLogout = async () => {
    if (refreshToken) {
      // Best effort: revoke the refresh token server-side, sign out locally regardless
      await axios.post('/api/auth/logout', { refreshToken }).catch(() => {})
    }
    clearSession()
    queryClient.clear()
    navigate('/login', { replace: true })
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 md:px-6 gap-4 flex-shrink-0">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
      >
        <Menu size={20} />
      </button>
      <h1 className="text-lg font-semibold text-gray-900">
        {routeTitles[pathname] ?? 'MoneyManager'}
      </h1>
      <div className="ml-auto flex items-center gap-3">
        {user && (
          <span className="hidden sm:block text-sm text-gray-600">{user.fullName}</span>
        )}
        <button
          onClick={handleLogout}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          title="Sign out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}
