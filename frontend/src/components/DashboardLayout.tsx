import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, LayoutDashboard, Search, LogOut, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function DashboardLayout({ children, onSearch }: { children: React.ReactNode, onSearch?: (q: string) => void }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-800">
          <div className="bg-blue-500/20 p-2 rounded-lg mr-3">
            <Mail className="w-5 h-5 text-blue-400" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            ReachInbox
          </span>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive 
                    ? 'bg-blue-500/10 text-blue-400 font-medium' 
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 px-4 py-2 mb-2">
            {user?.avatar ? (
              <img src={user.avatar} alt="Avatar" className="w-8 h-8 rounded-full" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                {user?.name?.charAt(0) || user?.email?.charAt(0)}
              </div>
            )}
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium truncate">{user?.name}</span>
              <span className="text-xs text-gray-400 truncate">{user?.email}</span>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Topbar */}
        <header className="h-16 bg-gray-900/50 backdrop-blur-sm border-b border-gray-800 flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search emails by subject, body, or recipient..." 
              className="w-full bg-gray-950 border border-gray-800 rounded-full py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-gray-500"
              onChange={(e) => onSearch?.(e.target.value)}
            />
          </div>
          <button className="p-2 text-gray-400 hover:text-white transition-colors bg-gray-800 rounded-full hover:bg-gray-700">
            <Settings className="w-5 h-5" />
          </button>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 bg-gradient-to-br from-gray-950 to-gray-900">
          {children}
        </div>
      </main>
    </div>
  );
}
