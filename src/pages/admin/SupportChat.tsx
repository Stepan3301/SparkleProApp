import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Button from '../../components/ui/Button';
import { 
  ArrowLeftIcon, 
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline';

interface SupportMessage {
  id: number;
  user_id: string;
  user_name: string;
  user_email: string;
  message: string;
  status: 'unread' | 'read' | 'replied' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  admin_notes?: string;
}

const SupportChat: React.FC = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<SupportMessage | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read' | 'replied' | 'closed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchMessages();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('support_messages')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'support_messages' },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching support messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateMessageStatus = async (messageId: number, status: SupportMessage['status'], notes?: string) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('support_messages')
        .update({ 
          status,
          admin_notes: notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId);

      if (error) throw error;

      // Update local state
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, status, admin_notes: notes || msg.admin_notes }
            : msg
        )
      );

      if (selectedMessage?.id === messageId) {
        setSelectedMessage(prev => prev ? { ...prev, status, admin_notes: notes || prev.admin_notes } : null);
      }
    } catch (error) {
      console.error('Error updating message status:', error);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusIcon = (status: SupportMessage['status']) => {
    switch (status) {
      case 'unread':
        return <div className="w-2 h-2 bg-blue-500 rounded-full" />;
      case 'read':
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      case 'replied':
        return <CheckCircleIcon className="w-4 h-4 text-blue-500" />;
      case 'closed':
        return <XCircleIcon className="w-4 h-4 text-gray-400" />;
      default:
        return null;
    }
  };

  const getPriorityColor = (priority: SupportMessage['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredMessages = messages.filter(msg => {
    const matchesFilter = filter === 'all' || msg.status === filter;
    const matchesSearch = searchQuery === '' || 
      msg.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes}m`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric'
      });
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading support messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-First Telegram-like Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/admin')}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <ArrowLeftIcon className="w-4 h-4 text-gray-600" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Support Chat</h1>
                <p className="text-xs text-gray-500">{filteredMessages.length} messages</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <FunnelIcon className="w-4 h-4 text-gray-600" />
              </button>
              <button className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
                <EllipsisVerticalIcon className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-3">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-colors"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        {showFilters && (
          <div className="px-4 pb-3">
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
              {[
                { key: 'all', label: 'All', count: messages.length },
                { key: 'unread', label: 'Unread', count: messages.filter(m => m.status === 'unread').length },
                { key: 'read', label: 'Read', count: messages.filter(m => m.status === 'read').length },
                { key: 'replied', label: 'Replied', count: messages.filter(m => m.status === 'replied').length },
                { key: 'closed', label: 'Closed', count: messages.filter(m => m.status === 'closed').length },
              ].map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key as any)}
                  className={`flex-1 px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                    filter === key
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {label} ({count})
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Messages List - Telegram-like */}
      <div className="flex-1">
        {filteredMessages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 text-sm">No messages found</p>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredMessages.map((message) => (
              <div
                key={message.id}
                onClick={() => setSelectedMessage(message)}
                className={`p-4 bg-white border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedMessage?.id === message.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold text-sm">
                      {message.user_name.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* Message Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 text-sm truncate">
                          {message.user_name}
                        </h3>
                        {getStatusIcon(message.status)}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(message.priority)}`}>
                          {message.priority}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(message.created_at)}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                      {message.message}
                    </p>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{message.user_email}</span>
                      <span>•</span>
                      <span>{formatTime(message.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Message Detail Modal - Mobile Optimized */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-white z-20 flex flex-col">
          {/* Modal Header */}
          <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedMessage(null)}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <ArrowLeftIcon className="w-4 h-4 text-gray-600" />
              </button>
              <div>
                <h2 className="font-semibold text-gray-900">{selectedMessage.user_name}</h2>
                <p className="text-xs text-gray-500">{selectedMessage.user_email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(selectedMessage.status)}
              <span className="text-xs font-medium text-gray-600 capitalize">
                {selectedMessage.status}
              </span>
            </div>
          </div>

          {/* Message Content */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            <div className="space-y-4">
              {/* User Message */}
              <div className="flex justify-start">
                <div className="max-w-[80%]">
                  <div className="bg-white rounded-2xl rounded-tl-md p-4 shadow-sm">
                    <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                      {selectedMessage.message}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">
                        {formatTime(selectedMessage.created_at)}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(selectedMessage.priority)}`}>
                        {selectedMessage.priority}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Admin Notes */}
              {selectedMessage.admin_notes && (
                <div className="flex justify-end">
                  <div className="max-w-[80%]">
                    <div className="bg-blue-500 text-white rounded-2xl rounded-tr-md p-4">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {selectedMessage.admin_notes}
                      </p>
                      <span className="text-xs text-blue-100 mt-2 block">
                        Admin Notes
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Bar */}
          <div className="bg-white border-t border-gray-200 p-4">
            <div className="space-y-3">
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add admin notes..."
                className="w-full px-3 py-2 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                rows={2}
              />
              
              <div className="flex gap-2">
                <Button
                  onClick={() => updateMessageStatus(selectedMessage.id, 'read', adminNotes)}
                  disabled={updating}
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                >
                  Mark as Read
                </Button>
                
                <Button
                  onClick={() => updateMessageStatus(selectedMessage.id, 'replied', adminNotes)}
                  disabled={updating}
                  variant="primary"
                  size="sm"
                  className="flex-1"
                >
                  Mark as Replied
                </Button>
                
                <Button
                  onClick={() => updateMessageStatus(selectedMessage.id, 'closed', adminNotes)}
                  disabled={updating}
                  variant="delete"
                  size="sm"
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportChat;