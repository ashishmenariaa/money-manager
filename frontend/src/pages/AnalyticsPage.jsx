import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { Download, TrendingUp, BarChart2 } from 'lucide-react'
import api from '@/lib/axios'
import { formatCurrency, MONTHS } from '@/lib/utils'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16']

function useYearlyReport(year) {
  return useQuery({
    queryKey: ['analytics', 'yearly', year],
    queryFn: async () => {
      const { data } = await api.get('/analytics/yearly', { params: { year } })
      return data.data
    },
  })
}

function useSpendingTrend(months) {
  return useQuery({
    queryKey: ['analytics', 'trend', months],
    queryFn: async () => {
      const { data } = await api.get('/analytics/trend', { params: { months } })
      return data.data
    },
  })
}

function useCategoryBreakdown(month, year) {
  return useQuery({
    queryKey: ['analytics', 'categories', month, year],
    queryFn: async () => {
      const { data } = await api.get('/analytics/categories', { params: { month, year } })
      return data.data
    },
  })
}

export default function AnalyticsPage() {
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [breakdownMonth, setBreakdownMonth] = useState(new Date().getMonth() + 1)
  const [breakdownYear, setBreakdownYear] = useState(currentYear)
  const [trendMonths, setTrendMonths] = useState(6)
  const [exportStart, setExportStart] = useState(format(new Date(currentYear, 0, 1), 'yyyy-MM-dd'))
  const [exportEnd, setExportEnd] = useState(format(new Date(), 'yyyy-MM-dd'))

  const { data: yearlyData, isLoading: yearlyLoading } = useYearlyReport(selectedYear)
  const { data: trendData, isLoading: trendLoading } = useSpendingTrend(trendMonths)
  const { data: breakdownData, isLoading: breakdownLoading } = useCategoryBreakdown(breakdownMonth, breakdownYear)

  const handleExport = async () => {
    try {
      const response = await api.get('/analytics/export/csv', {
        params: { startDate: exportStart, endDate: exportEnd },
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `transactions_${exportStart}_${exportEnd}.csv`
      a.click()
      toast.success('Export downloaded')
    } catch {
      toast.error('Export failed')
    }
  }

  const pieData = Object.entries(breakdownData?.breakdown || {}).map(([name, value]) => ({
    name,
    value: Number(value),
  }))

  return (
    <div className="space-y-6">
      {/* Yearly Income vs Expense */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart2 size={18} className="text-primary-600" />
            <h3 className="font-semibold text-gray-800">Income vs Expenses</h3>
          </div>
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            className="input w-auto text-sm"
          >
            {[currentYear - 2, currentYear - 1, currentYear].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {yearlyLoading ? <PageLoader /> : yearlyData ? (
          <>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-gray-500">Total Income</p>
                <p className="text-lg font-bold text-green-700">{formatCurrency(yearlyData.totalIncome)}</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-xs text-gray-500">Total Expenses</p>
                <p className="text-lg font-bold text-red-700">{formatCurrency(yearlyData.totalExpense)}</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-gray-500">Net Savings</p>
                <p className="text-lg font-bold text-blue-700">{formatCurrency(yearlyData.netSavings)}</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={yearlyData.monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={v => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="income" name="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </>
        ) : null}
      </div>

      {/* Spending Trend & Category Breakdown */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Trend */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-primary-600" />
              <h3 className="font-semibold text-gray-800">Spending Trend</h3>
            </div>
            <select
              value={trendMonths}
              onChange={e => setTrendMonths(Number(e.target.value))}
              className="input w-auto text-sm"
            >
              <option value={3}>3 months</option>
              <option value={6}>6 months</option>
              <option value={12}>12 months</option>
            </select>
          </div>
          {trendLoading ? <div className="h-52 flex items-center justify-center"><div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div> : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={v => formatCurrency(v)} />
                <Legend />
                <Line type="monotone" dataKey="income" name="Income" stroke="#22c55e" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="expense" name="Expense" stroke="#ef4444" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="savings" name="Savings" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Category Breakdown</h3>
            <div className="flex gap-2">
              <select
                value={breakdownMonth}
                onChange={e => setBreakdownMonth(Number(e.target.value))}
                className="input w-auto text-sm"
              >
                {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label.slice(0, 3)}</option>)}
              </select>
              <select
                value={breakdownYear}
                onChange={e => setBreakdownYear(Number(e.target.value))}
                className="input w-auto text-sm"
              >
                {[currentYear - 1, currentYear].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          {breakdownLoading ? <div className="h-52 flex items-center justify-center"><div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div> : (
            pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={v => formatCurrency(v)} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-52 flex items-center justify-center text-gray-400 text-sm">
                No expense data for this period
              </div>
            )
          )}
        </div>
      </div>

      {/* Export */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Download size={18} className="text-primary-600" />
          <h3 className="font-semibold text-gray-800">Export Transactions</h3>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">From</label>
            <input type="date" value={exportStart} onChange={e => setExportStart(e.target.value)} className="input text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">To</label>
            <input type="date" value={exportEnd} onChange={e => setExportEnd(e.target.value)} className="input text-sm" />
          </div>
          <button onClick={handleExport} className="btn-primary flex items-center gap-2 text-sm">
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>
    </div>
  )
}
