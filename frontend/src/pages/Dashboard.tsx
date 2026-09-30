import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import ScheduleEmailModal from '../components/ScheduleEmailModal';
import { Plus, Clock, Send, AlertCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

interface Email {
  id: string;
  to: string;
  subject: string;
  status: string;
  scheduledAt: string;
  sentAt?: string;
  errorMessage?: string;
}

export default function Dashboard() {
  const { token } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [stats, setStats] = useState({
    scheduled: 0,
    sent: 0,
    failed: 0,
    rateLimited: 0,
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      let allEmails: Email[] = [];
      let scheduled = 0, sent = 0, failed = 0, rateLimited = 0;

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

      if (searchQuery) {
        // Use Elasticsearch Search Endpoint
        const res = await axios.get(`${apiUrl}/api/emails/search?q=${searchQuery}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        allEmails = res.data.emails;
        
        // Compute basic stats from search results
        allEmails.forEach(e => {
          if (e.status === 'SCHEDULED' || e.status === 'QUEUED') scheduled++;
          else if (e.status === 'SENT') sent++;
          else if (e.status === 'FAILED') failed++;
          else if (e.status === 'RATE_LIMITED') rateLimited++;
        });
      } else {
        // Fetch from SQL endpoints
        const [schRes, sentRes] = await Promise.all([
          axios.get(`${apiUrl}/api/emails/scheduled?limit=50`, { headers: { Authorization: `Bearer ${token}` }}),
          axios.get(`${apiUrl}/api/emails/sent?limit=50`, { headers: { Authorization: `Bearer ${token}` }})
        ]);
        
        allEmails = [...schRes.data.emails, ...sentRes.data.emails].sort((a, b) => 
          new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
        );

        // This is a naive stat calculation just for the current page of results.
        // In a real app, backend should provide a dedicated /stats endpoint.
        schRes.data.emails.forEach((e: any) => {
          if (e.status === 'RATE_LIMITED') rateLimited++;
          else scheduled++;
        });
        sentRes.data.emails.forEach((e: any) => {
          if (e.status === 'FAILED') failed++;
          else sent++;
        });
      }

      setEmails(allEmails);
      setStats({ scheduled, sent, failed, rateLimited });
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const StatusBadge = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
      SCHEDULED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      QUEUED: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      RATE_LIMITED: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      SENDING: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      SENT: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      FAILED: 'bg-red-500/10 text-red-400 border-red-500/20',
    };
    
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status] || 'bg-gray-800 text-gray-300 border-gray-700'}`}>
        {status}
      </span>
    );
  };

  return (
    <DashboardLayout onSearch={setSearchQuery}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Campaigns</h1>
            <p className="text-gray-400">Monitor and schedule your outbound email queues.</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => fetchData()}
              className="p-2 text-gray-400 hover:text-white transition-colors bg-gray-900 border border-gray-800 rounded-lg hover:bg-gray-800"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg font-medium transition-all shadow-lg shadow-blue-500/20"
            >
              <Plus className="w-5 h-5" />
              Schedule Email
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Scheduled', value: stats.scheduled, icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { label: 'Sent', value: stats.sent, icon: Send, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: 'Failed', value: stats.failed, icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
            { label: 'Rate Limited', value: stats.rateLimited, icon: Clock, color: 'text-orange-400', bg: 'bg-orange-500/10' },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col relative overflow-hidden group">
                <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full ${stat.bg} blur-2xl group-hover:scale-150 transition-transform duration-500`} />
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <span className="text-gray-400 font-medium">{stat.label}</span>
                  <div className={`p-2 rounded-lg ${stat.bg}`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
                <span className="text-3xl font-bold text-white relative z-10">{stat.value}</span>
              </div>
            );
          })}
        </div>

        {/* Emails Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/50">
            <h2 className="font-semibold text-white">Recent Activity</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-950/50 border-b border-gray-800">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Recipient</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Scheduled For</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Sent At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {emails.map((email) => (
                  <tr key={email.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-white">{email.to}</div>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate text-sm text-gray-300">
                      {email.subject}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={email.status} />
                      {email.errorMessage && (
                        <div className="text-xs text-red-400 mt-1 truncate max-w-[150px]" title={email.errorMessage}>
                          {email.errorMessage}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {format(new Date(email.scheduledAt), 'MMM d, yyyy HH:mm:ss')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {email.sentAt ? format(new Date(email.sentAt), 'MMM d, HH:mm:ss') : '-'}
                    </td>
                  </tr>
                ))}
                
                {emails.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      No emails found.
                    </td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Loading...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ScheduleEmailModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => {
          setIsModalOpen(false);
          fetchData(); // Refresh table
        }}
      />
    </DashboardLayout>
  );
}
