import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { FiPlus, FiEye, FiTrash2, FiFilter } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function QuotationsPage() {
  const { api } = useAuth();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchQuotations();
  }, [statusFilter]);

  const fetchQuotations = async () => {
    try {
      const params = statusFilter ? `?status=${statusFilter}&limit=100` : '?limit=100';
      const res = await api(`/api/quotations${params}`);
      const data = await res.json();
      setQuotations(data.quotations || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this quotation?')) return;
    try {
      await api(`/api/quotations/${id}`, { method: 'DELETE' });
      toast.success('Quotation deleted');
      fetchQuotations();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api(`/api/quotations/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      toast.success(`Quotation ${status.toLowerCase()}`);
      fetchQuotations();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      DRAFT: 'badge-gray',
      SENT: 'badge-info',
      APPROVED: 'badge-success',
      REJECTED: 'badge-danger',
    };
    return styles[status] || 'badge-gray';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">Quotations</h1>
          <p className="text-gray-500 mt-1">Create and manage service quotations</p>
        </div>
        <Link href="/quotations/new" className="btn-primary flex items-center space-x-2 w-fit">
          <FiPlus size={18} />
          <span>New Quotation</span>
        </Link>
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
          <option value="DRAFT">Draft</option>
          <option value="SENT">Sent</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : quotations.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>No quotations found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Quotation #</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Customer</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Items</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Total</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Date</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {quotations.map((q) => (
                  <tr key={q.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-primary-600">
                      <Link href={`/quotations/${q.id}`}>{q.quotationNumber}</Link>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium">{q.customer?.name}</p>
                      <p className="text-xs text-gray-500">{q.customer?.companyName || ''}</p>
                    </td>
                    <td className="px-6 py-4">{q.items?.length || 0} items</td>
                    <td className="px-6 py-4 font-medium">LKR {q.total?.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={getStatusBadge(q.status)}>{q.status}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(q.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1">
                        <Link href={`/quotations/${q.id}`} className="text-primary-600 hover:text-primary-700 p-1">
                          <FiEye size={16} />
                        </Link>
                        {q.status === 'DRAFT' && (
                          <button
                            onClick={() => handleStatusChange(q.id, 'SENT')}
                            className="text-xs btn-primary py-1 px-2"
                          >
                            Send
                          </button>
                        )}
                        {q.status === 'SENT' && (
                          <button
                            onClick={() => handleStatusChange(q.id, 'APPROVED')}
                            className="text-xs btn-success py-1 px-2"
                          >
                            Approve
                          </button>
                        )}
                        {(q.status === 'DRAFT' || q.status === 'SENT') && (
                          <button
                            onClick={() => handleDelete(q.id)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        )}
                      </div>
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
