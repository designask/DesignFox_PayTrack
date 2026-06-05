import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { FiFilter, FiEye } from 'react-icons/fi';

export default function InvoicesPage() {
  const { api } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter, typeFilter]);

  const fetchInvoices = async () => {
    try {
      let params = '?limit=100';
      if (statusFilter) params += `&status=${statusFilter}`;
      if (typeFilter) params += `&type=${typeFilter}`;
      const res = await api(`/api/invoices${params}`);
      const data = await res.json();
      setInvoices(data.invoices || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      UNPAID: 'badge-warning',
      PARTIALLY_PAID: 'badge-info',
      PAID: 'badge-success',
      OVERDUE: 'badge-danger',
    };
    return styles[status] || 'badge-gray';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-900">Invoices</h1>
        <p className="text-gray-500 mt-1">Manage advance and final invoices</p>
      </div>

      {/* Filters */}
      <div className="card flex flex-wrap gap-3 items-center">
        <FiFilter className="text-gray-400" size={18} />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field w-auto"
        >
          <option value="">All Statuses</option>
          <option value="UNPAID">Unpaid</option>
          <option value="PARTIALLY_PAID">Partially Paid</option>
          <option value="PAID">Paid</option>
          <option value="OVERDUE">Overdue</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="input-field w-auto"
        >
          <option value="">All Types</option>
          <option value="ADVANCE">Advance</option>
          <option value="FINAL">Final</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No invoices found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Invoice #</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Customer</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Type</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Total</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Paid</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Balance</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-primary-600">
                      <Link href={`/invoices/${inv.id}`}>{inv.invoiceNumber}</Link>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium">{inv.customer?.name}</p>
                      <p className="text-xs text-gray-500">{inv.customer?.companyName || ''}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={inv.type === 'ADVANCE' ? 'badge-info' : 'badge-gray'}>
                        {inv.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">LKR {inv.total?.toLocaleString()}</td>
                    <td className="px-6 py-4 text-green-600">LKR {inv.amountPaid?.toLocaleString()}</td>
                    <td className="px-6 py-4 text-red-600">LKR {inv.balanceDue?.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={getStatusBadge(inv.status)}>{inv.status.replace('_', ' ')}</span>
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/invoices/${inv.id}`} className="text-primary-600 hover:text-primary-700">
                        <FiEye size={16} />
                      </Link>
                    </td>
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
