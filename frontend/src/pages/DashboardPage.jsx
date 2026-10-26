import { useDashboard } from '@/hooks/useDashboard'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import StatCard from '@/components/ui/StatCard'
import { formatCurrency, formatDate, formatMonth } from '@/lib/utils'
import { TrendingUp, TrendingDown, Wallet, PiggyBank, AlertTriangle } from 'lucide-react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const CHART_COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16']

export default function DashboardPage() {
  const { data: dashboard, isLoading, error } = useDashboard()

  if (isLoading) return <PageLoader />
  if (error) return <div className="text-center text-red-500 py-10">Failed to load dashboard</div>

  const { totalIncome, totalExpense, netSavings, savingsRate, recentTransactions, expenseByCategory, budgetAlerts, currentMonth, currentYear } = dashboard

  const pieData = Object.entries(expenseByCategory || {}).map(([name, value]) => ({ name, value: Number(value) }))

  return (
    <div className="space-y-6">
      {/* Period Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Overview</h2>
          <p className="text-sm text-gray-500">{formatMonth(currentMonth, currentYear)}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Income"
          value={formatCurrency(totalIncome)}
          icon={TrendingUp}
          color="green"
          subtitle="This month"
        />
        <StatCard
          title="Total Expenses"
          value={formatCurrency(totalExpense)}
          icon={TrendingDown}
          color="red"
          subtitle="This month"
        />
        <StatCard
          title="Net Savings"
          value={formatCurrency(netSavings)}
          icon={Wallet}
          color={netSavings >= 0 ? 'blue' : 'red'}
          subtitle="Income - Expenses"
        />
        <StatCard
          title="Savings Rate"
          value={`${savingsRate?.toFixed(1) || 0}%`}
          icon={PiggyBank}
          color="purple"
          subtitle="Of income saved"
        />
      </div>

      {/* Budget Alerts */}
      {budgetAlerts?.length > 0 && (
        <div className="card border-l-4 border-l-yellow-400 !p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} className="text-yellow-500" />
            <h3 className="font-semibold text-gray-800">Budget Alerts</h3>
          </div>
          <div className="space-y-2">
            {budgetAlerts.map(budget => (
              <div key={budget.id} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: budget.category.color || '#6b7280' }}
                  />
                  {budget.category.name}
                </span>
                <span className={budget.exceeded ? 'text-red-600 font-semibold' : 'text-yellow-600 font-medium'}>
                  {budget.percentageUsed.toFixed(0)}% used {budget.exceeded && '(Exceeded!)'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts and Recent Transactions */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Expense Breakdown */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Expense by Category</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
              No expense data for this month
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Recent Transactions</h3>
          {recentTransactions?.length > 0 ? (
            <div className="space-y-3">
              {recentTransactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-medium flex-shrink-0"
                      style={{ background: tx.category.color || '#6b7280' }}
                    >
                      {tx.category.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 truncate max-w-[140px]">
                        {tx.description || tx.category.name}
                      </p>
                      <p className="text-xs text-gray-400">{formatDate(tx.transactionDate)}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ${tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
              No transactions yet
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
