import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, Activity, Crown, UserX, UserCheck, ChevronLeft, ChevronRight } from 'lucide-react'
import api from '@/lib/axios'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

function useAdminStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const { data } = await api.get('/admin/stats')
      return data.data
    },
  })
}

function useAdminUsers(page) {
  return useQuery({
    queryKey: ['admin', 'users', page],
    queryFn: async () => {
      const { data } = await api.get('/admin/users', { params: { page, size: 15 } })
      return data.data
    },
  })
}

const PLAN_COLORS = {
  FREE: 'bg-gray-100 text-gray-700',
  BASIC: 'bg-blue-100 text-blue-700',
  PREMIUM: 'bg-purple-100 text-purple-700',
}

export default function AdminPage() {
  const [page, setPage] = useState(0)
  const [updatingUserId, setUpdatingUserId] = useState(null)
  const queryClient = useQueryClient()

  const { data: stats, isLoading: statsLoading } = useAdminStats()
  const { data: usersData, isLoading: usersLoading } = useAdminUsers(page)

  const toggleMutation = useMutation({
    mutationFn: (userId) => api.patch(`/admin/users/${userId}/toggle-status`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      toast.success('User status updated')
      setUpdatingUserId(null)
    },
  })

  const planMutation = useMutation({
    mutationFn: ({ userId, plan }) => api.patch(`/admin/users/${userId}/subscription`, { plan }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      toast.success('Subscription updated')
      setUpdatingUserId(null)
    },
  })

  const users = usersData?.content || []
  const totalPages = usersData?.totalPages || 0

  if (statsLoading) return <PageLoader />

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <Users size={18} className="text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
          <p className="text-xs text-gray-500">Total Users</p>
        </div>
        <div className="card text-center">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <Activity size={18} className="text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.totalTransactions || 0}</p>
          <p className="text-xs text-gray-500">Transactions</p>
        </div>
        <div className="card text-center">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <Crown size={18} className="text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.basicUsers || 0}</p>
          <p className="text-xs text-gray-500">Basic Plan</p>
        </div>
        <div className="card text-center">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <Crown size={18} className="text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.premiumUsers || 0}</p>
          <p className="text-xs text-gray-500">Premium Plan</p>
        </div>
      </div>

      {/* Users Table */}
      <div className="card !p-0 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">User Management</h3>
        </div>
        {usersLoading ? <PageLoader /> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">User</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Role</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Plan</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Joined</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-xs flex-shrink-0">
                            {user.firstName?.[0]}{user.lastName?.[0]}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{user.fullName}</p>
                            <p className="text-xs text-gray-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={user.subscription?.plan || 'FREE'}
                          onChange={e => {
                            setUpdatingUserId(user.id)
                            planMutation.mutate({ userId: user.id, plan: e.target.value })
                          }}
                          disabled={planMutation.isPending && updatingUserId === user.id}
                          className="input text-xs w-auto py-1 px-2"
                        >
                          <option value="FREE">FREE</option>
                          <option value="BASIC">BASIC</option>
                          <option value="PREMIUM">PREMIUM</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-xs">{formatDate(user.createdAt)}</td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${user.enabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {user.enabled ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setUpdatingUserId(user.id)
                            toggleMutation.mutate(user.id)
                          }}
                          disabled={toggleMutation.isPending && updatingUserId === user.id}
                          className={`p-1.5 rounded transition-colors ${user.enabled
                            ? 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                            : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                          }`}
                          title={user.enabled ? 'Disable user' : 'Enable user'}
                        >
                          {user.enabled ? <UserX size={15} /> : <UserCheck size={15} />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 py-3 border-t border-gray-100">
                <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded border disabled:opacity-40">
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm text-gray-500">Page {page + 1} of {totalPages}</span>
                <button disabled={page + 1 >= totalPages} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded border disabled:opacity-40">
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
