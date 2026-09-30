import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import ScheduleEmailModal from '../components/ScheduleEmailModal';
import { Clock, Send, AlertCircle, Loader2, Star } from 'lucide-react';
import { format } from 'date-fns';
import { useSearchParams } from 'react-router-dom';

interface Email {
  id: string;
  to: string;
  subject: string;
  body: string;
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
  const [searchParams] = useSearchParams();
  
  const currentTab = searchParams.get('tab') || 'scheduled';

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
        const res = await axios.get(`${apiUrl}/api/emails/search?q=${searchQuery}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        allEmails = res.data.emails;
        
        allEmails.forEach(e => {
          if (e.status === 'SCHEDULED' || e.status === 'QUEUED') scheduled++;
          else if (e.status === 'SENT') sent++;
          else if (e.status === 'FAILED') failed++;
          else if (e.status === 'RATE_LIMITED') rateLimited++;
        });
      } else {
        const [schRes, sentRes] = await Promise.all([
          axios.get(`${apiUrl}/api/emails/scheduled?limit=50`, { headers: { Authorization: `Bearer ${token}` }}),
          axios.get(`${apiUrl}/api/emails/sent?limit=50`, { headers: { Authorization: `Bearer ${token}` }})
        ]);
        
        allEmails = [...schRes.data.emails, ...sentRes.data.emails].sort((a, b) => 
          new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
        );

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
    const delayDebounce = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [fetchData]);

  const filteredEmails = emails.filter(e => {
    if (currentTab === 'scheduled') return ['SCHEDULED', 'RATE_LIMITED', 'QUEUED'].includes(e.status);
    if (currentTab === 'sent') return ['SENT', 'FAILED'].includes(e.status);
    return true;
  });

  const getStatusBadge = (email: Email) => {
    switch (email.status) {
      case 'SENT':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600">
            Sent
          </span>
        );
      case 'SCHEDULED':
      case 'QUEUED':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-orange-100 text-orange-700">
            <Clock className="w-3 h-3" />
            {format(new Date(email.scheduledAt), 'E h:mm a')}
          </span>
        );
      case 'RATE_LIMITED':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-yellow-100 text-yellow-700">
            <Clock className="w-3 h-3" />
            Rate Limited
          </span>
        );
      case 'FAILED':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-red-100 text-red-700">
            Failed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <DashboardLayout 
      onSearch={setSearchQuery}
      onCompose={() => setIsModalOpen(true)}
      scheduledCount={stats.scheduled + stats.rateLimited}
      sentCount={stats.sent + stats.failed}
    >
      <div className="max-w-5xl mx-auto px-8 py-6">
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
          </div>
        ) : filteredEmails.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="bg-gray-50 p-4 rounded-full mb-4">
              <Send className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No emails found</h3>
            <p className="text-gray-500 text-sm">
              {searchQuery ? 'Try adjusting your search terms.' : 'Click Compose to schedule your first email.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {filteredEmails.map((email) => (
              <div 
                key={email.id} 
                className="group flex items-center bg-white py-3 px-2 border-b border-gray-100 hover:bg-gray-50/50 transition-colors cursor-pointer"
              >
                <div className="w-48 truncate pr-4 text-sm font-medium text-gray-900">
                  To: {email.to.split('@')[0]}
                </div>
                
                <div className="w-40 flex items-center justify-start">
                  {getStatusBadge(email)}
                </div>

                <div className="flex-1 min-w-0 flex items-center pr-4">
                  <span className="text-sm font-semibold text-gray-900 mr-2 shrink-0">{email.subject}</span>
                  <span className="text-sm text-gray-400 truncate font-normal">- {email.body.substring(0, 80)}...</span>
                </div>
                
                <div className="w-10 flex justify-end">
                  <Star className="w-4 h-4 text-gray-300 hover:text-yellow-400 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ScheduleEmailModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => {
          setIsModalOpen(false);
          fetchData();
        }}
      />
    </DashboardLayout>
  );
}
