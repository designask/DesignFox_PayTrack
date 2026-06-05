import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { FiArrowLeft, FiCreditCard, FiEdit } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function InvoiceDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { api } = useAuth();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: '', method: 'BANK_TRANSFER', reference: '', notes: '' });
  const [editForm, setEditForm] = useState({ bankName: '', accountName: '', accountNumber: '', branch: '', paymentRef: '' });

  useEffect(() => {
    if (id) fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      const res = await api(`/api/invoices/${id}`);
      const data = await res.json();
      setInvoice(data.invoice);
      setEditForm({
        bankName: data.invoice.bankName || '',
        accountName: data.invoice.accountName || '',
        accountNumber: data.invoice.accountNumber || '',
        branch: data.invoice.branch || '',
        paymentRef: data.invoice.paymentRef || '',
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    try {
      const res = await api('/api/payments', {
        method: 'POST',
        body: JSON.stringify({ invoiceId: id, ...paymentForm, amount: parseFloat(paymentForm.amount) }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast.success('Payment recorded!');
      setShowPaymentModal(false);
      setPaymentForm({ amount: '', method: 'BANK_TRANSFER', reference: '', notes: '' });
      fetchInvoice();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleEditBank = async (e) => {
    e.preventDefault();
    try {
      await api(`/api/invoices/${id}`, { method: 'PUT', body: JSON.stringify(editForm) });
      toast.success('Bank details updated');
      setShowEditModal(false);
      fetchInvoice();
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!invoice) return <div className="text-center py-12 text-gray-400">Invoice not found</div>;

  const getStatusBadge = (status) => {
    const styles = { UNPAID: 'badge-warning', PARTIALLY_PAID: 'badge-info', PAID: 'badge-success', OVERDUE: 'badge-danger' };
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
            <h1 className="text-2xl font-bold text-dark-900">{invoice.invoiceNumber}</h1>
            <p className="text-gray-500 mt-1">{invoice.type} Invoice</p>
          </div>
        </div>
        <span className={`${getStatusBadge(invoice.status)} text-sm px-3 py-1`}>
          {invoice.status.replace('_', ' ')}
        </span>
      </div>

      {/* Actions */}
      {invoice.status !== 'PAID' && (
        <div className="card flex flex-wrap gap-3">
          <button onClick={() => { setPaymentForm({ ...paymentForm, amount: invoice.balanceDue }); setShowPaymentModal(true); }} className="btn-success flex items-center space-x-2">
            <FiCreditCard size={16} />
            <span>Record Payment</span>
          </button>
          <button onClick={() => setShowEditModal(true)} className="btn-secondary flex items-center space-x-2">
            <FiEdit size={16} />
            <span>Edit Bank Details</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoice Summary */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Summary</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Total Amount</span>
              <span className="font-medium">LKR {invoice.total?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Amount Paid</span>
              <span className="font-medium text-green-600">LKR {invoice.amountPaid?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-gray-500 font-medium">Balance Due</span>
              <span className="font-bold text-red-600">LKR {invoice.balanceDue?.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Customer */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Customer</h3>
          <div className="space-y-1 text-sm">
            <p className="font-medium">{invoice.customer?.name}</p>
            {invoice.customer?.companyName && <p className="text-gray-500">{invoice.customer.companyName}</p>}
            {invoice.customer?.email && <p className="text-gray-500">{invoice.customer.email}</p>}
            {invoice.customer?.phone && <p className="text-gray-500">{invoice.customer.phone}</p>}
          </div>
        </div>

        {/* Bank Details */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Payment Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Bank</span>
              <span>{invoice.bankName || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Account Name</span>
              <span>{invoice.accountName || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Account #</span>
              <span>{invoice.accountNumber || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Branch</span>
              <span>{invoice.branch || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Reference</span>
              <span>{invoice.paymentRef || '-'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quotation Items */}
      {invoice.quotation?.items && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-3">Service Items (from Quotation)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 font-medium">Service</th>
                  <th className="pb-2 font-medium">Qty</th>
                  <th className="pb-2 font-medium">Price</th>
                  <th className="pb-2 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.quotation.items.map((item) => (
                  <tr key={item.id} className="border-b border-gray-50">
                    <td className="py-2">{item.serviceName}</td>
                    <td className="py-2">{item.quantity}</td>
                    <td className="py-2">LKR {item.unitPrice?.toLocaleString()}</td>
                    <td className="py-2 text-right">LKR {item.total?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment History */}
      {invoice.payments?.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-3">Payment History</h3>
          <div className="space-y-3">
            {invoice.payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">LKR {p.amount?.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{p.method.replace('_', ' ')} - {new Date(p.receivedAt).toLocaleDateString()}</p>
                  {p.reference && <p className="text-xs text-gray-400">Ref: {p.reference}</p>}
                </div>
                {p.receipt && (
                  <span className="badge-success text-xs">{p.receipt.receiptNumber}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b">
              <h2 className="text-lg font-bold">Record Payment</h2>
            </div>
            <form onSubmit={handlePayment} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (Balance: LKR {invoice.balanceDue?.toLocaleString()})</label>
                <input
                  type="number"
                  step="0.01"
                  max={invoice.balanceDue}
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select
                  value={paymentForm.method}
                  onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                  className="input-field"
                >
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CARD">Card</option>
                  <option value="ONLINE_PAYMENT">Online Payment</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reference</label>
                <input
                  type="text"
                  value={paymentForm.reference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                  className="input-field"
                  placeholder="Transaction reference"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  className="input-field"
                  rows={2}
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-success">Record Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Bank Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b">
              <h2 className="text-lg font-bold">Edit Payment Details</h2>
            </div>
            <form onSubmit={handleEditBank} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                <input type="text" value={editForm.bankName} onChange={(e) => setEditForm({ ...editForm, bankName: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                <input type="text" value={editForm.accountName} onChange={(e) => setEditForm({ ...editForm, accountName: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                <input type="text" value={editForm.accountNumber} onChange={(e) => setEditForm({ ...editForm, accountNumber: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                <input type="text" value={editForm.branch} onChange={(e) => setEditForm({ ...editForm, branch: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Reference</label>
                <input type="text" value={editForm.paymentRef} onChange={(e) => setEditForm({ ...editForm, paymentRef: e.target.value })} className="input-field" />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
