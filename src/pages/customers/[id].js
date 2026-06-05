import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { FiArrowLeft, FiMail, FiPhone, FiMapPin, FiBriefcase } from 'react-icons/fi';

export default function CustomerDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { api } = useAuth();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchCustomer();
  }, [id]);

  const fetchCustomer = async () => {
    try {
      const res = await api(`/api/customers/${id}`);
      const data = await res.json();
      setCustomer(data.customer);
    } catch (error) {
      console.error(error);
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

  if (!customer) {
    return <div className="text-center py-12 text-gray-400">Customer not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
          <FiArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-dark-900">{customer.name}</h1>
          <p className="text-gray-500">{customer.companyName || 'Individual Customer'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Info */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
          <div className="space-y-3">
            {customer.email && (
              <div className="flex items-center space-x-3 text-sm">
                <FiMail className="text-gray-400" size={16} />
                <span>{customer.email}</span>
              </div>
            )}
            {customer.phone && (
              <div className="flex items-center space-x-3 text-sm">
                <FiPhone className="text-gray-400" size={16} />
                <span>{customer.phone}</span>
              </div>
            )}
            {customer.address && (
              <div className="flex items-center space-x-3 text-sm">
                <FiMapPin className="text-gray-400" size={16} />
                <span>{customer.address}</span>
              </div>
            )}
            {customer.companyName && (
              <div className="flex items-center space-x-3 text-sm">
                <FiBriefcase className="text-gray-400" size={16} />
                <span>{customer.companyName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Quotations */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Recent Quotations</h3>
          <div className="space-y-2">
            {customer.quotations?.length > 0 ? (
              customer.quotations.map((q) => (
                <Link
                  key={q.id}
                  href={`/quotations/${q.id}`}
                  className="block p-3 rounded-lg border border-gray-100 hover:border-primary-200 hover:bg-primary-50 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{q.quotationNumber}</span>
                    <span
                      className={`badge ${
                        q.status === 'APPROVED'
                          ? 'badge-success'
                          : q.status === 'REJECTED'
                          ? 'badge-danger'
                          : 'badge-gray'
                      }`}
                    >
                      {q.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">LKR {q.total?.toLocaleString()}</p>
                </Link>
              ))
            ) : (
              <p className="text-sm text-gray-400">No quotations yet</p>
            )}
          </div>
        </div>

        {/* Invoices */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Recent Invoices</h3>
          <div className="space-y-2">
            {customer.invoices?.length > 0 ? (
              customer.invoices.map((inv) => (
                <Link
                  key={inv.id}
                  href={`/invoices/${inv.id}`}
                  className="block p-3 rounded-lg border border-gray-100 hover:border-primary-200 hover:bg-primary-50 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{inv.invoiceNumber}</span>
                    <span
                      className={`badge ${
                        inv.status === 'PAID'
                          ? 'badge-success'
                          : inv.status === 'OVERDUE'
                          ? 'badge-danger'
                          : 'badge-warning'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">LKR {inv.total?.toLocaleString()}</p>
                </Link>
              ))
            ) : (
              <p className="text-sm text-gray-400">No invoices yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Projects */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Projects</h3>
        {customer.projects?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customer.projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="p-4 rounded-lg border border-gray-100 hover:border-primary-200 hover:bg-primary-50 transition-colors"
              >
                <p className="font-medium">{project.title}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Created: {new Date(project.createdAt).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No projects yet</p>
        )}
      </div>
    </div>
  );
}
