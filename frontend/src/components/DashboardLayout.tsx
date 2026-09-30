import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Clock, Send, Search, LogOut, ChevronDown, Filter, RefreshCw } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function DashboardLayout({ children, onSearch, onCompose, scheduledCount = 0, sentCount = 0 }: { children: React.ReactNode, onSearch?: (q: string) => void, onCompose?: () => void, scheduledCount?: number, sentCount?: number }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-gray-900 flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-[#F9FAFB] flex flex-col border-r border-gray-200">
        <div className="h-20 flex items-center px-6">
          <span className="text-[28px] font-bold tracking-tight text-gray-900 font-mono">
            ONG
          </span>
        </div>

        <div className="px-4 mb-6">
          <div className="flex items-center justify-between px-3 py-2 bg-gray-100 rounded-lg cursor-pointer">
            <div className="flex items-center gap-3 overflow-hidden">
              {user?.avatar ? (
                <img src={user.avatar} alt="Avatar" className="w-8 h-8 rounded-full" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-medium text-sm">
                  {user?.name?.charAt(0) || user?.email?.charAt(0)}
                </div>
              )}
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium text-gray-900 truncate">{user?.name}</span>
                <span className="text-[11px] text-gray-500 truncate">{user?.email}</span>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div className="px-4 mb-8">
          <button 
            onClick={onCompose}
            className="w-full flex items-center justify-center py-2.5 px-4 bg-white border border-[#22c55e] text-[#22c55e] font-medium rounded-full hover:bg-green-50 transition-colors"
          >
            Compose
          </button>
        </div>

        <div className="px-6 mb-2">
          <span className="text-[10px] font-bold text-gray-400 tracking-wider">CORE</span>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <Link
            to="/dashboard?tab=scheduled"
            className="flex items-center justify-between px-3 py-2.5 rounded-lg transition-all text-gray-700 hover:bg-gray-100"
          >
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium">Scheduled</span>
            </div>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{scheduledCount}</span>
          </Link>
          
          <Link
            to="/dashboard?tab=sent"
            className="flex items-center justify-between px-3 py-2.5 rounded-lg transition-all text-gray-700 hover:bg-gray-100"
          >
            <div className="flex items-center gap-3">
              <Send className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium">Sent</span>
            </div>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{sentCount}</span>
          </Link>
        </nav>

        <div className="p-4 mt-auto">
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-white">
        {/* Topbar */}
        <header className="h-20 flex items-center px-10 border-b border-gray-100">
          <div className="flex-1 max-w-2xl flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search" 
                className="w-full bg-[#f3f4f6] rounded-full py-2.5 pl-11 pr-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all placeholder:text-gray-500"
                onChange={(e) => onSearch?.(e.target.value)}
              />
            </div>
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Filter className="w-4 h-4" />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
