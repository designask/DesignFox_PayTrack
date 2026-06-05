import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  FiFileText,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiUsers,
  FiFolder,
  FiAlertTriangle,
  FiTrendingUp,
} from 'react-icons/fi';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Dashboard() {
  const { api } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api('/api/dashboard');
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const monthlyIncome = data?.monthlyIncome || [];

  const chartData = {
    labels: monthlyIncome.map((m) => m.month),
    datasets: [
      {
        label: 'Monthly Income',
        data: monthlyIncome.map((m) => m.amount),
        backgroundColor: 'rgba(37, 99, 235, 0.8)',
        borderRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
      x: { grid: { display: false } },
    },
  };

  const statCards = [
    { label: 'Total Quotations', value: stats.totalQuotations || 0, icon: FiFileText, color: 'bg-blue-500' },
    { label: 'Approved', value: stats.approvedQuotations || 0, icon: FiCheckCircle, color: 'bg-green-500' },
    { label: 'Pending Payments', value: stats.pendingPayments || 0, icon: FiClock, color: 'bg-yellow-500' },
    { label: 'Monthly Income', value: `LKR ${(stats.monthlyIncome || 0).toLocaleString()}`, icon: FiDollarSign, color: 'bg-emerald-500' },
    { label: 'Total Customers', value: stats.totalCustomers || 0, icon: FiUsers, color: 'bg-purple-500' },
    { label: 'Completed Projects', value: stats.completedProjects || 0, icon: FiFolder, color: 'bg-indigo-500' },
    { label: 'Overdue Invoices', value: stats.overdueInvoices || 0, icon: FiAlertTriangle, color: 'bg-red-500' },
    { label: 'Balance Due', value: `LKR ${(stats.totalBalanceDue || 0).toLocaleString()}`, icon: FiTrendingUp, color: 'bg-orange-500' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back! Here&apos;s your business overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <div key={index} className="card flex items-center space-x-4">
            <div className={`${stat.color} p-3 rounded-lg text-white`}>
              <stat.icon size={22} />
            </div>
            <div>
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="text-xl font-bold text-dark-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Income Chart */}
        <div className="card lg:col-span-2">
          <h3 className="text-lg font-semibold text-dark-900 mb-4">Monthly Income (Last 6 Months)</h3>
          <div className="h-64">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Recent Quotations */}
        <div className="card">
          <h3 className="text-lg font-semibold text-dark-900 mb-4">Recent Quotations</h3>
          <div className="space-y-3">
            {(data?.recentQuotations || []).map((q) => (
              <div key={q.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium">{q.quotationNumber}</p>
                  <p className="text-xs text-gray-500">{q.customer?.name}</p>
                </div>
                <span
                  className={`badge ${
                    q.status === 'APPROVED'
                      ? 'badge-success'
                      : q.status === 'SENT'
                      ? 'badge-info'
                      : q.status === 'REJECTED'
                      ? 'badge-danger'
                      : 'badge-gray'
                  }`}
                >
                  {q.status}
                </span>
              </div>
            ))}
            {(!data?.recentQuotations || data.recentQuotations.length === 0) && (
              <p className="text-sm text-gray-400 text-center py-4">No quotations yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Payments */}
      <div className="card">
        <h3 className="text-lg font-semibold text-dark-900 mb-4">Recent Payments</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-3 font-medium">Customer</th>
                <th className="pb-3 font-medium">Amount</th>
                <th className="pb-3 font-medium">Method</th>
                <th className="pb-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {(data?.recentPayments || []).map((p) => (
                <tr key={p.id} className="border-b border-gray-50">
                  <td className="py-3">{p.invoice?.customer?.name}</td>
                  <td className="py-3 font-medium">LKR {p.amount?.toLocaleString()}</td>
                  <td className="py-3">
                    <span className="badge-info">{p.method}</span>
                  </td>
                  <td className="py-3 text-gray-500">
                    {new Date(p.receivedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {(!data?.recentPayments || data.recentPayments.length === 0) && (
                <tr>
                  <td colSpan={4} className="text-center py-6 text-gray-400">
                    No payments recorded yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
