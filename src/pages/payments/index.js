import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FiFilter, FiDownload } from 'react-icons/fi';

export default function PaymentsPage() {
  const { api } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const res = await api('/api/payments?limit=100');
      const data = await res.json();
      setPayments(data.payments || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getMethodBadge = (method) => {
    const styles = {
      CASH: 'bg-green-100 text-green-800',
      BANK_TRANSFER: 'bg-blue-100 text-blue-800',
      CARD: 'bg-purple-100 text-purple-800',
      ONLINE_PAYMENT: 'bg-indigo-100 text-indigo-800',
    };
    return styles[method] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-900">Payments</h1>
        <p className="text-gray-500 mt-1">Track all received payments and receipts</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500">Total Payments</p>
          <p className="text-2xl font-bold text-dark-900">{payments.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Total Received</p>
          <p className="text-2xl font-bold text-green-600">
            LKR {payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Receipts Generated</p>
          <p className="text-2xl font-bold text-primary-600">
            {payments.filter((p) => p.receipt).length}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No payments recorded yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Receipt #</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Customer</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Invoice</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Amount</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Method</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Reference</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Date</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-primary-600">
                      {p.receipt?.receiptNumber || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium">{p.invoice?.customer?.name}</p>
                      <p className="text-xs text-gray-500">{p.invoice?.customer?.companyName || ''}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{p.invoice?.invoiceNumber || '-'}</td>
                    <td className="px-6 py-4 font-bold text-green-600">LKR {p.amount?.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`badge ${getMethodBadge(p.method)}`}>
                        {p.method.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{p.reference || '-'}</td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(p.receivedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{p.recordedBy?.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
