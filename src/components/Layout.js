import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  FiHome,
  FiUsers,
  FiFileText,
  FiDollarSign,
  FiCreditCard,
  FiFolder,
  FiBarChart2,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiX,
  FiBell,
} from 'react-icons/fi';

const navigation = [
  { name: 'Dashboard', href: '/', icon: FiHome, roles: ['ADMIN', 'STAFF', 'ACCOUNTANT'] },
  { name: 'Customers', href: '/customers', icon: FiUsers, roles: ['ADMIN', 'STAFF', 'ACCOUNTANT'] },
  { name: 'Quotations', href: '/quotations', icon: FiFileText, roles: ['ADMIN', 'STAFF'] },
  { name: 'Invoices', href: '/invoices', icon: FiDollarSign, roles: ['ADMIN', 'ACCOUNTANT'] },
  { name: 'Payments', href: '/payments', icon: FiCreditCard, roles: ['ADMIN', 'ACCOUNTANT'] },
  { name: 'Projects', href: '/projects', icon: FiFolder, roles: ['ADMIN', 'STAFF'] },
  { name: 'Reports', href: '/reports', icon: FiBarChart2, roles: ['ADMIN', 'ACCOUNTANT'] },
  { name: 'Settings', href: '/settings', icon: FiSettings, roles: ['ADMIN'] },
];

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout, hasRole } = useAuth();
  const router = useRouter();

  const filteredNav = navigation.filter((item) => hasRole(item.roles));

  return (
    <div className="min-h-screen flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-dark-900 text-white transform transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-dark-700">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">SF</span>
              </div>
              <span className="text-lg font-bold">ServiceFlow</span>
            </Link>
            <button className="lg:hidden text-gray-400" onClick={() => setSidebarOpen(false)}>
              <FiX size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {filteredNav.map((item) => {
              const isActive = router.pathname === item.href || 
                (item.href !== '/' && router.pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-300 hover:bg-dark-700 hover:text-white'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon size={18} />
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="px-4 py-4 border-t border-dark-700">
            <div className="flex items-center space-x-3 px-3 py-2">
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold">{user?.name?.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-gray-400 truncate">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center space-x-3 px-3 py-2.5 w-full text-gray-300 hover:bg-dark-700 hover:text-white rounded-lg transition-colors mt-1"
            >
              <FiLogOut size={18} />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <button
            className="lg:hidden text-gray-600 hover:text-gray-900"
            onClick={() => setSidebarOpen(true)}
          >
            <FiMenu size={24} />
          </button>

          <div className="flex items-center space-x-4 ml-auto">
            <button className="relative text-gray-500 hover:text-gray-700">
              <FiBell size={20} />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </button>
            <div className="hidden sm:flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold">{user?.name?.charAt(0)}</span>
              </div>
              <span className="text-sm font-medium text-gray-700">{user?.name}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
