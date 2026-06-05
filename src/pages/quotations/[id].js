import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { FiArrowLeft, FiSend, FiCheck, FiX, FiFileText } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function QuotationDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { api } = useAuth();
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchQuotation();
  }, [id]);

  const fetchQuotation = async () => {
    try {
      const res = await api(`/api/quotations/${id}`);
      const data = await res.json();
      setQuotation(data.quotation);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (status) => {
    try {
      await api(`/api/quotations/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      toast.success(`Quotation ${status.toLowerCase()}`);
      fetchQuotation();
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const createInvoice = async () => {
    try {
      const res = await api('/api/invoices', {
        method: 'POST',
        body: JSON.stringify({
          quotationId: id,
          customerId: quotation.customerId,
          type: 'ADVANCE',
          percentage: 50,
        }),
      });
      if (!res.ok) throw new Error('Failed to create invoice');
      const data = await res.json();
      toast.success('Advance invoice created!');
      router.push(`/invoices/${data.invoice.id}`);
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!quotation) {
    return <div className="text-center py-12 text-gray-400">Quotation not found</div>;
  }

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
        <div className="flex items-center space-x-4">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
            <FiArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-dark-900">{quotation.quotationNumber}</h1>
            <p className="text-gray-500 mt-1">
              Created by {quotation.createdBy?.name} on {new Date(quotation.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`${getStatusBadge(quotation.status)} text-sm px-3 py-1`}>
            {quotation.status}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="card flex flex-wrap gap-3">
        {quotation.status === 'DRAFT' && (
          <button onClick={() => updateStatus('SENT')} className="btn-primary flex items-center space-x-2">
            <FiSend size={16} />
            <span>Mark as Sent</span>
          </button>
        )}
        {quotation.status === 'SENT' && (
          <>
            <button onClick={() => updateStatus('APPROVED')} className="btn-success flex items-center space-x-2">
              <FiCheck size={16} />
              <span>Approve</span>
            </button>
            <button onClick={() => updateStatus('REJECTED')} className="btn-danger flex items-center space-x-2">
              <FiX size={16} />
              <span>Reject</span>
            </button>
          </>
        )}
        {quotation.status === 'APPROVED' && !quotation.invoices?.length && (
          <button onClick={createInvoice} className="btn-primary flex items-center space-x-2">
            <FiFileText size={16} />
            <span>Create Advance Invoice (50%)</span>
          </button>
        )}
        {quotation.project && (
          <Link href={`/projects/${quotation.project.id}`} className="btn-secondary flex items-center space-x-2">
            <FiFileText size={16} />
            <span>View Project</span>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Info */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-3">Customer</h3>
          <div className="space-y-2 text-sm">
            <p className="font-medium">{quotation.customer?.name}</p>
            {quotation.customer?.companyName && (
              <p className="text-gray-500">{quotation.customer.companyName}</p>
            )}
            {quotation.customer?.email && <p className="text-gray-500">{quotation.customer.email}</p>}
            {quotation.customer?.phone && <p className="text-gray-500">{quotation.customer.phone}</p>}
            {quotation.customer?.address && <p className="text-gray-500">{quotation.customer.address}</p>}
          </div>
        </div>

        {/* Items Table */}
        <div className="card lg:col-span-2">
          <h3 className="text-lg font-semibold mb-3">Service Items</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 font-medium">Service</th>
                  <th className="pb-2 font-medium">Qty</th>
                  <th className="pb-2 font-medium">Price</th>
                  <th className="pb-2 font-medium">Discount</th>
                  <th className="pb-2 font-medium">Tax</th>
                  <th className="pb-2 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {quotation.items?.map((item) => (
                  <tr key={item.id} className="border-b border-gray-50">
                    <td className="py-3">
                      <p className="font-medium">{item.serviceName}</p>
                      {item.description && <p className="text-xs text-gray-500">{item.description}</p>}
                    </td>
                    <td className="py-3">{item.quantity}</td>
                    <td className="py-3">LKR {item.unitPrice?.toLocaleString()}</td>
                    <td className="py-3">{item.discount}%</td>
                    <td className="py-3">{item.tax}%</td>
                    <td className="py-3 text-right font-medium">LKR {item.total?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2">
                  <td colSpan={5} className="py-3 text-right font-bold">Grand Total:</td>
                  <td className="py-3 text-right font-bold text-lg">
                    LKR {quotation.total?.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* Notes */}
      {quotation.notes && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Notes</h3>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{quotation.notes}</p>
        </div>
      )}

      {/* Linked Invoices */}
      {quotation.invoices?.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-3">Linked Invoices</h3>
          <div className="space-y-2">
            {quotation.invoices.map((inv) => (
              <Link
                key={inv.id}
                href={`/invoices/${inv.id}`}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
              >
                <div>
                  <p className="font-medium">{inv.invoiceNumber}</p>
                  <p className="text-xs text-gray-500">{inv.type} Invoice</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">LKR {inv.total?.toLocaleString()}</p>
                  <span
                    className={`badge ${
                      inv.status === 'PAID' ? 'badge-success' : inv.status === 'OVERDUE' ? 'badge-danger' : 'badge-warning'
                    }`}
                  >
                    {inv.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
