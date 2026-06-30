'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import AdminDashboard from '../../components/admin/AdminDashboard';
import AdminUsers from '../../components/admin/AdminUsers';
import AdminAuditLogs from '../../components/admin/AdminAuditLogs';
import AdminReports from '../../components/admin/AdminReports';
import AdminHierarchy from '../../components/admin/AdminHierarchy';
import AdminMasters from '../../components/admin/AdminMasters';

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'masters', label: 'Masters', icon: '👑' },
  { id: 'users', label: 'Users', icon: '👥' },
  { id: 'reports', label: 'Reports', icon: '📈' },
  { id: 'audit-logs', label: 'Audit Logs', icon: '📋' },
  { id: 'hierarchy', label: 'Hierarchy', icon: '🌳' },
];

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);
  const [tab, setTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam && tabs.some((t) => t.id === tabParam)) {
      setTab(tabParam);
    }
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.replaceState({}, '', url.toString());
  }, [tab]);

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN')) {
    router.push('/login?redirect=/admin');
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const renderTab = () => {
    switch (tab) {
      case 'dashboard': return <AdminDashboard />;
      case 'masters': return <AdminMasters />;
      case 'users': return <AdminUsers />;
      case 'reports': return <AdminReports />;
      case 'audit-logs': return <AdminAuditLogs />;
      case 'hierarchy': return <AdminHierarchy />;
      default: return <AdminDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="flex">
        <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-gray-800 border-r border-gray-700 transform transition-transform duration-200 lg:translate-x-0 lg:static lg:inset-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-4 border-b border-gray-700">
            <h1 className="text-lg font-bold text-white">Admin Panel</h1>
            <p className="text-xs text-gray-400 mt-0.5">{user?.username} ({user?.role})</p>
          </div>
          <nav className="p-3 space-y-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  tab === t.id
                    ? 'bg-cyan-600/20 text-cyan-400 border-l-2 border-cyan-500'
                    : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
                }`}
              >
                <span>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        <div className="flex-1 min-w-0">
          <header className="sticky top-0 z-20 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800">
            <div className="flex items-center gap-4 px-4 py-3">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-xs text-gray-500 hidden sm:inline">{user?.email}</span>
                <button
                  onClick={() => router.push('/')}
                  className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Back to Site
                </button>
              </div>
            </div>
          </header>

          <main className="p-4 sm:p-6 lg:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                {renderTab()}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}
