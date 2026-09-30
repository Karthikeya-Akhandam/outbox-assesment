import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ArrowLeft, Clock, Upload, Loader2, Bold, Italic, Underline, AlignLeft, AlignCenter, List, Image } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

interface ScheduleEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ScheduleEmailModal({ isOpen, onClose, onSuccess }: ScheduleEmailModalProps) {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    to: '',
    subject: '',
    body: '',
    scheduledAt: new Date(Date.now() + 60000).toISOString().slice(0, 16),
    delayBetween: 2000,
    hourlyLimit: 100,
  });

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');

    const recipients = formData.to.split(',').map(e => e.trim()).filter(e => e);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    try {
      await axios.post(
        `${apiUrl}/api/emails/schedule`,
        {
          to: recipients,
          subject: formData.subject,
          body: formData.body,
          scheduledAt: new Date(formData.scheduledAt).toISOString(),
          delayBetween: Number(formData.delayBetween),
          hourlyLimit: Number(formData.hourlyLimit),
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      onSuccess();
      setFormData({
        to: '',
        subject: '',
        body: '',
        scheduledAt: new Date(Date.now() + 60000).toISOString().slice(0, 16),
        delayBetween: 2000,
        hourlyLimit: 100,
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to schedule emails');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-xl bg-white shadow-2xl transition-all h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                  <div className="flex items-center gap-3">
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900">
                      Compose New Email
                    </Dialog.Title>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <button className="p-1 hover:bg-gray-100 rounded text-gray-400">
                      <Upload className="w-4 h-4" />
                    </button>
                    <input 
                      type="datetime-local" 
                      className="text-sm bg-gray-50 border border-gray-200 rounded px-2 py-1 text-gray-700 outline-none"
                      value={formData.scheduledAt}
                      onChange={e => setFormData({ ...formData, scheduledAt: e.target.value })}
                    />
                    <button 
                      onClick={() => handleSubmit()}
                      disabled={loading || !formData.to || !formData.subject || !formData.body}
                      className="flex items-center gap-2 px-4 py-1.5 border border-[#22c55e] text-[#22c55e] hover:bg-[#22c55e] hover:text-white rounded-full font-medium transition-colors text-sm disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      Send Later
                    </button>
                  </div>
                </div>

                {/* Form area */}
                <div className="flex-1 overflow-y-auto p-8">
                  {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                      {error}
                    </div>
                  )}

                  <div className="max-w-3xl mx-auto space-y-4">
                    {/* From Field */}
                    <div className="flex items-center border-b border-gray-100 pb-2">
                      <span className="text-gray-400 text-sm w-16">From</span>
                      <div className="bg-gray-50 text-gray-700 text-sm px-3 py-1 rounded border border-gray-100 inline-flex items-center">
                        {user?.email || 'user@example.com'}
                      </div>
                    </div>

                    {/* To Field */}
                    <div className="flex items-center border-b border-gray-100 pb-2 relative">
                      <span className="text-gray-400 text-sm w-16">To</span>
                      <input 
                        type="text"
                        placeholder="recipient@example.com (comma separated)"
                        className="flex-1 outline-none text-sm text-gray-900 placeholder:text-gray-300"
                        value={formData.to}
                        onChange={e => setFormData({ ...formData, to: e.target.value })}
                      />
                      <button className="absolute right-0 text-[#22c55e] text-xs font-medium flex items-center gap-1">
                        <Upload className="w-3 h-3" /> Upload List
                      </button>
                    </div>

                    {/* Subject Field */}
                    <div className="flex items-center border-b border-gray-100 pb-2">
                      <span className="text-gray-400 text-sm w-16">Subject</span>
                      <input 
                        type="text"
                        placeholder="Subject"
                        className="flex-1 outline-none text-sm text-gray-900 placeholder:text-gray-300 font-medium"
                        value={formData.subject}
                        onChange={e => setFormData({ ...formData, subject: e.target.value })}
                      />
                    </div>

                    {/* Limits */}
                    <div className="flex items-center gap-6 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-xs">Delay between 2 emails</span>
                        <input 
                          type="number"
                          className="w-16 border border-gray-200 rounded px-2 py-0.5 text-xs text-center text-gray-700 outline-none focus:border-[#22c55e]"
                          value={formData.delayBetween}
                          onChange={e => setFormData({ ...formData, delayBetween: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-xs">Hourly Limit</span>
                        <input 
                          type="number"
                          className="w-16 border border-gray-200 rounded px-2 py-0.5 text-xs text-center text-gray-700 outline-none focus:border-[#22c55e]"
                          value={formData.hourlyLimit}
                          onChange={e => setFormData({ ...formData, hourlyLimit: parseInt(e.target.value) || 1 })}
                        />
                      </div>
                    </div>

                    {/* Editor Area */}
                    <div className="mt-4 bg-[#f9fafb] rounded-xl border border-gray-100 min-h-[300px] flex flex-col overflow-hidden">
                      {/* Editor Toolbar */}
                      <div className="flex items-center gap-2 p-2 border-b border-gray-100 bg-white">
                        <button className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded"><Bold className="w-4 h-4" /></button>
                        <button className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded"><Italic className="w-4 h-4" /></button>
                        <button className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded"><Underline className="w-4 h-4" /></button>
                        <div className="w-px h-4 bg-gray-200 mx-1"></div>
                        <button className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded"><AlignLeft className="w-4 h-4" /></button>
                        <button className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded"><AlignCenter className="w-4 h-4" /></button>
                        <button className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded"><List className="w-4 h-4" /></button>
                        <div className="w-px h-4 bg-gray-200 mx-1"></div>
                        <button className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded"><Image className="w-4 h-4" /></button>
                      </div>
                      <textarea
                        className="flex-1 w-full p-4 bg-transparent outline-none resize-none text-sm text-gray-800 placeholder:text-gray-400"
                        placeholder="Type Your Reply..."
                        value={formData.body}
                        onChange={e => setFormData({ ...formData, body: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
