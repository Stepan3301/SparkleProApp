import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import { 
  ArrowLeftIcon, 
  ChatBubbleLeftRightIcon,
  UserIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
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
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<SupportMessage | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read' | 'replied' | 'closed'>('all');

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
        return <div className="w-3 h-3 bg-red-500 rounded-full" />;
      case 'read':
        return <CheckCircleIcon className="w-4 h-4 text-blue-500" />;
      case 'replied':
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      case 'closed':
        return <XCircleIcon className="w-4 h-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const getPriorityColor = (priority: SupportMessage['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'low':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const filteredMessages = messages.filter(msg => {
    if (filter === 'all') return true;
    return msg.status === filter;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
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
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.history.back()}
              className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Support Chat</h1>
              <p className="text-sm text-gray-600">{messages.length} total messages</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Messages List */}
        <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
          {/* Filter Tabs */}
          <div className="p-4 border-b border-gray-200">
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
                  className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
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

          {/* Messages */}
          <div className="flex-1 overflow-y-auto">
            {filteredMessages.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <ChatBubbleLeftRightIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No messages found</p>
              </div>
            ) : (
              filteredMessages.map((message) => (
                <div
                  key={message.id}
                  onClick={() => setSelectedMessage(message)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedMessage?.id === message.id ? 'bg-blue-50 border-l-4 border-l-primary' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(message.status)}
                      <span className="font-medium text-gray-900 text-sm">
                        {message.user_name}
                      </span>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(message.priority)}`}>
                      {message.priority}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                    {message.message}
                  </p>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <ClockIcon className="w-3 h-3" />
                    <span>{formatDate(message.created_at)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Message Detail */}
        <div className="flex-1 flex flex-col">
          {selectedMessage ? (
            <>
              {/* Message Header */}
              <div className="p-6 border-b border-gray-200 bg-white">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{selectedMessage.user_name}</h3>
                      <p className="text-sm text-gray-600">{selectedMessage.user_email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedMessage.status)}
                    <span className="text-sm font-medium text-gray-600 capitalize">
                      {selectedMessage.status}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <ClockIcon className="w-4 h-4" />
                    <span>Received {formatDate(selectedMessage.created_at)}</span>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(selectedMessage.priority)}`}>
                    {selectedMessage.priority} priority
                  </span>
                </div>
              </div>

              {/* Message Content */}
              <div className="flex-1 p-6 bg-gray-50">
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h4 className="font-semibold text-gray-900 mb-3">Message</h4>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {selectedMessage.message}
                  </p>
                </div>

                {selectedMessage.admin_notes && (
                  <div className="mt-4 bg-blue-50 rounded-2xl p-6">
                    <h4 className="font-semibold text-blue-900 mb-3">Admin Notes</h4>
                    <p className="text-blue-800 leading-relaxed whitespace-pre-wrap">
                      {selectedMessage.admin_notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="p-6 bg-white border-t border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add admin notes..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    rows={3}
                  />
                </div>
                
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => updateMessageStatus(selectedMessage.id, 'read', adminNotes)}
                    disabled={updating}
                    variant="secondary"
                    size="sm"
                  >
                    Mark as Read
                  </Button>
                  
                  <Button
                    onClick={() => updateMessageStatus(selectedMessage.id, 'replied', adminNotes)}
                    disabled={updating}
                    variant="primary"
                    size="sm"
                  >
                    Mark as Replied
                  </Button>
                  
                  <Button
                    onClick={() => updateMessageStatus(selectedMessage.id, 'closed', adminNotes)}
                    disabled={updating}
                    variant="delete"
                    size="sm"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Select a message to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportChat;
