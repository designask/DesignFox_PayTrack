import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { api, hasRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'STAFF' });

  useEffect(() => {
    if (hasRole('ADMIN')) fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api('/api/users');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast.success('User created!');
      setShowModal(false);
      setForm({ name: '', email: '', password: '', role: 'STAFF' });
      fetchUsers();
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage users and system settings</p>
      </div>

      {/* User Management */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">User Management</h3>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center space-x-2 text-sm">
            <FiPlus size={16} />
            <span>Add User</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr>
                <th className="text-left py-2 font-medium text-gray-500">Name</th>
                <th className="text-left py-2 font-medium text-gray-500">Email</th>
                <th className="text-left py-2 font-medium text-gray-500">Role</th>
                <th className="text-left py-2 font-medium text-gray-500">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="py-3 font-medium">{u.name}</td>
                  <td className="py-3 text-gray-600">{u.email}</td>
                  <td className="py-3">
                    <span
                      className={`badge ${
                        u.role === 'ADMIN' ? 'badge-danger' : u.role === 'ACCOUNTANT' ? 'badge-info' : 'badge-gray'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Company Info */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Company Information</h3>
        <p className="text-sm text-gray-500 mb-4">
          Configure these settings in your .env file:
        </p>
        <div className="space-y-2 text-sm bg-gray-50 p-4 rounded-lg font-mono">
          <p>NEXT_PUBLIC_COMPANY_NAME=&quot;Your Company Name&quot;</p>
          <p>NEXT_PUBLIC_COMPANY_EMAIL=&quot;info@yourcompany.com&quot;</p>
          <p>NEXT_PUBLIC_COMPANY_PHONE=&quot;+94 77 123 4567&quot;</p>
          <p>NEXT_PUBLIC_COMPANY_ADDRESS=&quot;123 Business Street&quot;</p>
        </div>
      </div>

      {/* Add User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b">
              <h2 className="text-lg font-bold">Add New User</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="input-field"
                >
                  <option value="STAFF">Staff</option>
                  <option value="ACCOUNTANT">Accountant</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
