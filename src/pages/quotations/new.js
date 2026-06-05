import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { FiPlus, FiTrash2, FiArrowLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function NewQuotationPage() {
  const router = useRouter();
  const { api } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [notes, setNotes] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [items, setItems] = useState([
    { serviceName: '', description: '', quantity: 1, unitPrice: 0, discount: 0, tax: 0 },
  ]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await api('/api/customers?limit=200');
      const data = await res.json();
      setCustomers(data.customers || []);
    } catch (error) {
      console.error(error);
    }
  };

  const addItem = () => {
    setItems([...items, { serviceName: '', description: '', quantity: 1, unitPrice: 0, discount: 0, tax: 0 }]);
  };

  const removeItem = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const calculateItemTotal = (item) => {
    const subtotal = item.quantity * item.unitPrice;
    const discount = (subtotal * item.discount) / 100;
    const tax = ((subtotal - discount) * item.tax) / 100;
    return subtotal - discount + tax;
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerId) {
      toast.error('Please select a customer');
      return;
    }
    if (!items[0].serviceName) {
      toast.error('Please add at least one service');
      return;
    }

    setSaving(true);
    try {
      const res = await api('/api/quotations', {
        method: 'POST',
        body: JSON.stringify({ customerId, items, notes, validUntil: validUntil || undefined }),
      });

      if (!res.ok) throw new Error('Failed to create quotation');

      const data = await res.json();
      toast.success('Quotation created!');
      router.push(`/quotations/${data.quotation.id}`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
          <FiArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-dark-900">New Quotation</h1>
          <p className="text-gray-500 mt-1">Create a new service quotation</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer and Date */}
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="input-field"
                required
              >
                <option value="">Select a customer</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.companyName ? `(${c.companyName})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Service Items</h3>
            <button type="button" onClick={addItem} className="btn-secondary flex items-center space-x-1 text-sm">
              <FiPlus size={16} />
              <span>Add Item</span>
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Service Name *</label>
                    <input
                      type="text"
                      value={item.serviceName}
                      onChange={(e) => updateItem(index, 'serviceName', e.target.value)}
                      className="input-field text-sm"
                      placeholder="e.g., Web Design"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      className="input-field text-sm"
                      placeholder="Service description"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Qty</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      className="input-field text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Unit Price</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className="input-field text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Discount %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={item.discount}
                      onChange={(e) => updateItem(index, 'discount', parseFloat(e.target.value) || 0)}
                      className="input-field text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Tax %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={item.tax}
                      onChange={(e) => updateItem(index, 'tax', parseFloat(e.target.value) || 0)}
                      className="input-field text-sm"
                    />
                  </div>
                  <div className="flex items-end justify-between md:col-span-2">
                    <p className="text-sm font-medium">
                      Total: LKR {calculateItemTotal(item).toLocaleString()}
                    </p>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-4 pt-4 border-t flex justify-end">
            <div className="text-right">
              <p className="text-sm text-gray-500">Grand Total</p>
              <p className="text-2xl font-bold text-dark-900">LKR {calculateTotal().toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="card">
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input-field"
            rows={3}
            placeholder="Additional notes or terms..."
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <button type="button" onClick={() => router.back()} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Creating...' : 'Create Quotation'}
          </button>
        </div>
      </form>
    </div>
  );
}
