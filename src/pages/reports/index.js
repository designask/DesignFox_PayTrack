import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FiBarChart2, FiDollarSign, FiUsers, FiCheckCircle, FiTrendingUp } from 'react-icons/fi';

export default function ReportsPage() {
  const { api } = useAuth();
  const [activeTab, setActiveTab] = useState('sales');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchReport();
  }, [activeTab, startDate, endDate]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      let params = `?type=${activeTab}`;
      if (startDate) params += `&startDate=${startDate}`;
      if (endDate) params += `&endDate=${endDate}`;
      const res = await api(`/api/reports${params}`);
      const json = await res.json();
      setData(json.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'sales', name: 'Monthly Sales', icon: FiDollarSign },
    { id: 'pending', name: 'Pending Payments', icon: FiBarChart2 },
    { id: 'completed', name: 'Completed Projects', icon: FiCheckCircle },
    { id: 'quotation-conversion', name: 'Quotation Conversion', icon: FiTrendingUp },
    { id: 'customer-history', name: 'Customer History', icon: FiUsers },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-900">Reports</h1>
        <p className="text-gray-500 mt-1">Business analytics and reporting</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 border hover:bg-gray-50'
            }`}
          >
            <tab.icon size={16} />
            <span>{tab.name}</span>
          </button>
        ))}
      </div>

      {/* Date Filters */}
      <div className="card flex flex-wrap gap-4 items-center">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="input-field w-auto text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="input-field w-auto text-sm"
          />
        </div>
      </div>

      {/* Report Content */}
      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <>
            {/* Sales Report */}
            {activeTab === 'sales' && data && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Sales Report</h3>
                  <p className="text-xl font-bold text-green-600">
                    Total: LKR {data.totalSales?.toLocaleString() || 0}
                  </p>
                </div>
                {data.payments?.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left py-2 font-medium text-gray-500">Date</th>
                        <th className="text-left py-2 font-medium text-gray-500">Customer</th>
                        <th className="text-left py-2 font-medium text-gray-500">Invoice</th>
                        <th className="text-left py-2 font-medium text-gray-500">Method</th>
                        <th className="text-right py-2 font-medium text-gray-500">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {data.payments.map((p) => (
                        <tr key={p.id}>
                          <td className="py-2">{new Date(p.receivedAt).toLocaleDateString()}</td>
                          <td className="py-2">{p.invoice?.customer?.name}</td>
                          <td className="py-2">{p.invoice?.invoiceNumber}</td>
                          <td className="py-2">{p.method?.replace('_', ' ')}</td>
                          <td className="py-2 text-right font-medium">LKR {p.amount?.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-gray-400 text-center py-8">No sales data for this period</p>
                )}
              </div>
            )}

            {/* Pending Payments */}
            {activeTab === 'pending' && data && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Pending Payments</h3>
                  <p className="text-xl font-bold text-red-600">
                    Total Due: LKR {data.totalPending?.toLocaleString() || 0}
                  </p>
                </div>
                {data.invoices?.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left py-2 font-medium text-gray-500">Invoice #</th>
                        <th className="text-left py-2 font-medium text-gray-500">Customer</th>
                        <th className="text-left py-2 font-medium text-gray-500">Status</th>
                        <th className="text-right py-2 font-medium text-gray-500">Total</th>
                        <th className="text-right py-2 font-medium text-gray-500">Balance Due</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {data.invoices.map((inv) => (
                        <tr key={inv.id}>
                          <td className="py-2 font-medium">{inv.invoiceNumber}</td>
                          <td className="py-2">{inv.customer?.name}</td>
                          <td className="py-2">
                            <span className={`badge ${inv.status === 'OVERDUE' ? 'badge-danger' : 'badge-warning'}`}>
                              {inv.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-2 text-right">LKR {inv.total?.toLocaleString()}</td>
                          <td className="py-2 text-right font-medium text-red-600">LKR {inv.balanceDue?.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-gray-400 text-center py-8">No pending payments</p>
                )}
              </div>
            )}

            {/* Completed Projects */}
            {activeTab === 'completed' && data && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Completed Projects</h3>
                {data.projects?.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left py-2 font-medium text-gray-500">Quotation #</th>
                        <th className="text-left py-2 font-medium text-gray-500">Customer</th>
                        <th className="text-right py-2 font-medium text-gray-500">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {data.projects.map((p) => (
                        <tr key={p.id}>
                          <td className="py-2">{p.quotation?.quotationNumber}</td>
                          <td className="py-2">{p.customer?.name}</td>
                          <td className="py-2 text-right font-medium">LKR {p.quotation?.total?.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-gray-400 text-center py-8">No completed projects for this period</p>
                )}
              </div>
            )}

            {/* Quotation Conversion */}
            {activeTab === 'quotation-conversion' && data && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Quotation Conversion Report</h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-dark-900">{data.totalQuotes || 0}</p>
                    <p className="text-sm text-gray-500">Total Quotations</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-600">{data.approvedQuotes || 0}</p>
                    <p className="text-sm text-gray-500">Approved</p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-red-600">{data.rejectedQuotes || 0}</p>
                    <p className="text-sm text-gray-500">Rejected</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-primary-600">{data.conversionRate || 0}%</p>
                    <p className="text-sm text-gray-500">Conversion Rate</p>
                  </div>
                </div>
              </div>
            )}

            {/* Customer History */}
            {activeTab === 'customer-history' && data && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Customer Payment History</h3>
                {data.customers?.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left py-2 font-medium text-gray-500">Customer</th>
                        <th className="text-left py-2 font-medium text-gray-500">Company</th>
                        <th className="text-right py-2 font-medium text-gray-500">Quotation Value</th>
                        <th className="text-right py-2 font-medium text-gray-500">Total Paid</th>
                        <th className="text-right py-2 font-medium text-gray-500">Outstanding</th>
                        <th className="text-center py-2 font-medium text-gray-500">Projects</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {data.customers.map((c) => (
                        <tr key={c.id}>
                          <td className="py-2 font-medium">{c.name}</td>
                          <td className="py-2 text-gray-500">{c.companyName || '-'}</td>
                          <td className="py-2 text-right">LKR {c.totalQuotationValue?.toLocaleString()}</td>
                          <td className="py-2 text-right text-green-600">LKR {c.totalPaid?.toLocaleString()}</td>
                          <td className="py-2 text-right text-red-600">LKR {c.totalOutstanding?.toLocaleString()}</td>
                          <td className="py-2 text-center">{c._count?.projects || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-gray-400 text-center py-8">No customer data</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
