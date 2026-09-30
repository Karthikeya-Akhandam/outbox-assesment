import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Send, Clock, Users, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

interface ScheduleEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ScheduleEmailModal({ isOpen, onClose, onSuccess }: ScheduleEmailModalProps) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    to: '',
    subject: '',
    body: '',
    scheduledAt: new Date(Date.now() + 60000).toISOString().slice(0, 16), // default 1 min from now
    delayBetween: 2000,
    hourlyLimit: 100,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Parse comma separated emails
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
      onClose();
      // Reset form
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
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-gray-900 border border-gray-800 p-8 text-left align-middle shadow-2xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-white flex items-center gap-2">
                    <Send className="w-5 h-5 text-blue-400" />
                    Schedule New Campaign
                  </Dialog.Title>
                  <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1 flex items-center gap-2">
                      <Users className="w-4 h-4" /> Recipients (comma separated)
                    </label>
                    <textarea
                      required
                      rows={2}
                      className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500/50 outline-none placeholder:text-gray-600 transition-all"
                      placeholder="user1@example.com, user2@example.com..."
                      value={formData.to}
                      onChange={e => setFormData({ ...formData, to: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Subject</label>
                    <input
                      required
                      type="text"
                      className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                      value={formData.subject}
                      onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Body</label>
                    <textarea
                      required
                      rows={5}
                      className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                      value={formData.body}
                      onChange={e => setFormData({ ...formData, body: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1 flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Send At
                      </label>
                      <input
                        required
                        type="datetime-local"
                        className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all [color-scheme:dark]"
                        value={formData.scheduledAt}
                        onChange={e => setFormData({ ...formData, scheduledAt: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Delay (ms)</label>
                      <input
                        type="number"
                        min="0"
                        className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                        value={formData.delayBetween}
                        onChange={e => setFormData({ ...formData, delayBetween: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Hourly Limit</label>
                      <input
                        type="number"
                        min="1"
                        className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                        value={formData.hourlyLimit}
                        onChange={e => setFormData({ ...formData, hourlyLimit: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-gray-800">
                    <button
                      type="button"
                      className="px-6 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 font-medium transition-all"
                      onClick={onClose}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                      Schedule Campaign
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
