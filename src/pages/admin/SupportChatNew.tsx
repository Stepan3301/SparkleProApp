import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  ArrowLeftIcon, 
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  PaperAirplaneIcon
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
  const [replyText, setReplyText] = useState('');
  const [updating, setUpdating] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'open' | 'closed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileConversation, setShowMobileConversation] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);

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

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedMessage || updating) return;

    try {
      setUpdating(true);
      await updateMessageStatus(selectedMessage.id, 'replied', replyText.trim());
      setReplyText('');
    } catch (error) {
      console.error('Error sending reply:', error);
    }
  };

  const openConversation = (message: SupportMessage) => {
    setSelectedMessage(message);
    setShowMobileConversation(true);
    
    // Mark as read if it's unread
    if (message.status === 'unread') {
      updateMessageStatus(message.id, 'read');
    }
  };

  const closeConversation = () => {
    setShowMobileConversation(false);
    setSelectedMessage(null);
    setReplyText('');
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Filter messages
  const filteredMessages = messages.filter(msg => {
    const matchesFilter = filter === 'all' || 
      (filter === 'unread' && msg.status === 'unread') ||
      (filter === 'open' && (msg.status === 'unread' || msg.status === 'read' || msg.status === 'replied')) ||
      (filter === 'closed' && msg.status === 'closed');
    const matchesSearch = searchQuery === '' || 
      msg.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showActionSheet) {
          setShowActionSheet(false);
        } else if (showMobileConversation) {
          closeConversation();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showActionSheet, showMobileConversation]);

  if (loading) {
    return (
      <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 16px' }}></div>
          <p style={{ color: 'var(--muted)' }}>Loading support messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100dvh' }}>
      <style>{`
        :root{
          --primary:#0ABDC6; --accent:#00E6B8; --violet:#6c5dd3;
          --ink:#0f172a; --muted:#5b7a88; --line:#dbe8ee; --bg:#f7fbfd; --card:#fff;
          --shadow:0 12px 28px rgba(10,30,40,.10);
        }
        
        * { box-sizing: border-box; }
        
        .chat-split{
          height:100dvh; display:grid; grid-template-columns:340px 1fr; gap:10px; padding:10px;
        }
        .pane{background:var(--card); border:1px solid var(--line); border-radius:16px; overflow:hidden; box-shadow:var(--shadow)}
        
        /* LEFT PANE */
        .leftbar{padding:10px;border-bottom:1px solid var(--line)}
        .leftbar h1{margin:0 0 8px;font-size:1.05rem;font-weight:900;color:var(--ink)}
        .search{display:flex;align-items:center;gap:8px;background:#fff;border:1px solid var(--line);border-radius:12px;padding:8px 10px}
        .search svg{width:18px;height:18px;fill:none;stroke:#5f7c8a;stroke-width:2}
        .search input{border:0;outline:none;width:100%;font-size:.95rem;color:var(--ink)}
        .filters{display:flex;gap:6px;margin-top:8px;overflow:auto}
        .chip{border:1px solid var(--line);background:#fff;border-radius:999px;padding:8px 10px;font-weight:800;color:#355a64;cursor:pointer;transition:all .2s ease;font-size:.85rem}
        .chip.is-active{border-color:rgba(10,189,198,.4);box-shadow:inset 0 0 0 2px rgba(10,189,198,.18);background:#f0fffe}
        .chip:hover{background:#f6fbfc}
        
        .threads{height:calc(100% - 108px);overflow:auto;padding:8px}
        .thread{display:grid;grid-template-columns:auto 1fr auto;gap:10px;padding:10px;border-radius:12px;cursor:pointer;transition:background .2s ease}
        .thread:hover{background:#f6fbfc}
        .thread .avatar{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;font-weight:900;color:#0a3940;background:#e6fbff;font-size:.9rem}
        .thread .name{font-weight:900;font-size:.9rem;color:var(--ink)}
        .thread .preview{color:#55737f;font-size:.85rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:190px;margin-top:2px}
        .thread .badges{display:flex;gap:4px;align-items:center;flex-direction:column}
        .badge{min-width:18px;height:18px;border-radius:999px;display:grid;place-items:center;font-size:.7rem;font-weight:900;padding:0 6px}
        .badge.unread{background:#ff4d4f;color:#fff;box-shadow:0 4px 12px rgba(255,77,79,.25)}
        .badge.prio{background:rgba(255,200,60,.18);color:#8a6311;border:1px solid rgba(255,200,60,.45)}
        .badge.status{background:rgba(16,185,129,.18);color:#0a6d3b;border:1px solid rgba(16,185,129,.45)}
        .badge.closed{background:rgba(107,114,128,.18);color:#374151;border:1px solid rgba(107,114,128,.45)}
        .thread.is-active{background:#eef9fb;border:1px solid rgba(10,189,198,.2)}
        
        /* RIGHT PANE */
        .convbar{display:flex;align-items:center;gap:10px;border-bottom:1px solid var(--line);padding:10px;background:#fff}
        .icon-btn{appearance:none;border:0;border-radius:12px;background:#eef6f8;width:36px;height:36px;display:grid;place-items:center;cursor:pointer;transition:background .2s ease}
        .icon-btn:hover{background:#ddeef2}
        .icon-btn svg{width:18px;height:18px;fill:none;stroke:#204e57;stroke-width:2}
        .icon-btn.back{display:none}
        
        .peer{display:flex;align-items:center;gap:10px;flex:1}
        .avatar{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;font-weight:900;color:#0a3940;background:#e6fbff}
        .meta .name{font-weight:900;color:var(--ink)}
        .status{display:flex;gap:6px;align-items:center;color:#5c7a86;font-size:.85rem}
        .dot{width:8px;height:8px;border-radius:50%}
        .dot.online{background:#39d98a;box-shadow:0 0 10px rgba(57,217,138,.6)}
        
        .conversation{display:grid;grid-template-rows:1fr auto;height:calc(100% - 56px)}
        .messages{overflow:auto;padding:10px;background:linear-gradient(#fbfeff,#f6fbfc)}
        .empty{height:100%;display:grid;place-items:center;color:#6a8893;text-align:center}
        .ghost{font-size:42px;margin-bottom:6px}
        
        .msg{display:flex;margin:6px 0}
        .bubble{max-width:78%;padding:10px 12px;border-radius:14px;line-height:1.35;font-size:.98rem;box-shadow:0 6px 14px rgba(10,30,40,.08)}
        .msg.me{justify-content:flex-end}
        .msg.me .bubble{background:linear-gradient(135deg,var(--primary),var(--accent));color:#fff;border-top-right-radius:6px}
        .msg.other .bubble{background:#fff;border:1px solid var(--line);border-top-left-radius:6px;color:var(--ink)}
        .msg .time{display:block;font-size:.72rem;margin-top:6px;opacity:.75}
        
        .composer{display:grid;grid-template-columns:1fr auto;gap:6px;padding:8px;border-top:1px solid var(--line);background:#fff}
        .composer input{border:1px solid var(--line);border-radius:14px;padding:12px 14px;font-size:1rem;outline:none;transition:border-color .2s ease;color:var(--ink)}
        .composer input:focus{border-color:var(--primary);box-shadow:0 0 0 3px rgba(10,189,198,.18)}
        .send{border:0;border-radius:12px;background:linear-gradient(135deg,var(--primary),var(--accent));width:44px;height:44px;display:grid;place-items:center;box-shadow:0 10px 22px rgba(10,189,198,.25);cursor:pointer;transition:transform .2s ease}
        .send:hover{transform:translateY(-1px)}
        .send svg{width:20px;height:20px;fill:none;stroke:#fff;stroke-width:2}
        .send:disabled{opacity:.6;cursor:not-allowed;transform:none}
        
        /* Bottom sheet */
        .sheet{position:fixed;inset:0;z-index:50;display:none}
        .sheet.show{display:block}
        .sheet__backdrop{position:absolute;inset:0;background:rgba(7,14,20,.5);backdrop-filter:blur(2px)}
        .sheet__panel{position:absolute;left:0;right:0;bottom:0;background:#fff;border-radius:20px 20px 0 0;box-shadow:0 -12px 30px rgba(0,0,0,.25);transform:translateY(100%);animation:slideUp .25s ease forwards}
        @keyframes slideUp{to{transform:translateY(0)}}
        .sheet__drag{width:38px;height:5px;border-radius:999px;background:#d9e7ee;margin:8px auto}
        .sheet__content{display:grid;padding:6px 10px}
        .sheet-btn{appearance:none;border:0;background:#fff;text-align:left;padding:14px 10px;font-weight:900;border-bottom:1px solid #f1f6f8;cursor:pointer;color:var(--ink)}
        .sheet-btn:last-of-type{border-bottom:0}
        .sheet-btn.danger{color:#c63939}
        .sheet__footer{display:flex;justify-content:flex-end;padding:10px}
        .btn-ghost{border:1px solid var(--line);background:#fff;border-radius:10px;padding:8px 12px;font-weight:800;cursor:pointer;color:var(--ink)}
        
        /* Mobile responsive */
        @media (max-width: 720px){
          .chat-split{grid-template-columns:1fr;padding:0}
          .pane{border-radius:0;border:0}
          .pane--left{display:block}
          .pane--right{display:none}
          .pane--right.is-open{display:block}
          .icon-btn.back{display:grid}
        }
        
        .loading-spinner{
          width:20px;height:20px;border:2px solid #e5e7eb;border-top:2px solid var(--primary);border-radius:50%;animation:spin 1s linear infinite
        }
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      <section className="chat-split">
        {/* LEFT PANE - Threads List */}
        <aside className="pane pane--left">
          <header className="leftbar">
            <h1>Support</h1>
            <div className="search">
              <MagnifyingGlassIcon />
              <input
                type="search"
                placeholder="Search…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="filters">
              {(['all', 'unread', 'open', 'closed'] as const).map((filterOption) => (
                <button
                  key={filterOption}
                  className={`chip ${filter === filterOption ? 'is-active' : ''}`}
                  onClick={() => setFilter(filterOption)}
                >
                  {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                </button>
              ))}
            </div>
          </header>

          <main className="threads">
            {filteredMessages.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)' }}>
                No messages found
              </div>
            ) : (
              filteredMessages.map((message) => (
                <article
                  key={message.id}
                  className={`thread ${selectedMessage?.id === message.id ? 'is-active' : ''}`}
                  onClick={() => openConversation(message)}
                >
                  <div className="avatar">
                    {message.user_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="name">{message.user_name}</div>
                    <div className="preview">
                      {message.message.length > 50 
                        ? `${message.message.substring(0, 50)}...` 
                        : message.message}
                    </div>
                  </div>
                  <div className="badges">
                    {message.status === 'unread' && (
                      <span className="badge unread">●</span>
                    )}
                    <span className={`badge ${
                      message.status === 'closed' ? 'closed' : 
                      message.status === 'unread' ? 'prio' : 'status'
                    }`}>
                      {message.status}
                    </span>
                  </div>
                </article>
              ))
            )}
          </main>
        </aside>

        {/* RIGHT PANE - Conversation */}
        <section className={`pane pane--right ${showMobileConversation ? 'is-open' : ''}`}>
          <header className="convbar">
            <button className="icon-btn back" onClick={closeConversation}>
              <ArrowLeftIcon />
            </button>
            <div className="peer">
              {selectedMessage ? (
                <>
                  <span className="avatar">
                    {selectedMessage.user_name.charAt(0).toUpperCase()}
                  </span>
                  <div className="meta">
                    <div className="name">{selectedMessage.user_name}</div>
                    <div className="status">
                      <span className={`dot ${selectedMessage.status !== 'closed' ? 'online' : ''}`}></span>
                      <span>{selectedMessage.status === 'closed' ? 'Closed' : 'Open ticket'}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="meta">
                  <div className="name">Select a chat</div>
                  <div className="status">—</div>
                </div>
              )}
            </div>
            <button className="icon-btn" onClick={() => setShowActionSheet(true)}>
              <EllipsisVerticalIcon />
            </button>
          </header>

          <div className="conversation">
            <div className="messages">
              {!selectedMessage ? (
                <div className="empty">
                  <div className="ghost">💬</div>
                  <p>Select a conversation to start</p>
                </div>
              ) : (
                <>
                  <div className="msg other">
                    <div className="bubble">
                      {selectedMessage.message}
                      <span className="time">{formatTime(selectedMessage.created_at)}</span>
                    </div>
                  </div>
                  
                  {selectedMessage.admin_notes && (
                    <div className="msg me">
                      <div className="bubble">
                        {selectedMessage.admin_notes}
                        <span className="time">Support Team</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {selectedMessage && selectedMessage.status !== 'closed' && (
              <form className="composer" onSubmit={handleSendReply}>
                <input
                  type="text"
                  placeholder="Write a message…"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                />
                <button 
                  type="submit" 
                  className="send"
                  disabled={!replyText.trim() || updating}
                >
                  {updating ? (
                    <div className="loading-spinner"></div>
                  ) : (
                    <PaperAirplaneIcon />
                  )}
                </button>
              </form>
            )}
          </div>
        </section>
      </section>

      {/* Action Sheet */}
      <div className={`sheet ${showActionSheet ? 'show' : ''}`}>
        <div className="sheet__backdrop" onClick={() => setShowActionSheet(false)}></div>
        <div className="sheet__panel">
          <div className="sheet__drag"></div>
          <div className="sheet__content">
            {selectedMessage && (
              <>
                <button 
                  className="sheet-btn"
                  onClick={() => {
                    updateMessageStatus(selectedMessage.id, 'read');
                    setShowActionSheet(false);
                  }}
                >
                  Mark as read
                </button>
                <button 
                  className="sheet-btn"
                  onClick={() => {
                    updateMessageStatus(selectedMessage.id, 'replied');
                    setShowActionSheet(false);
                  }}
                >
                  Mark as replied
                </button>
                <button 
                  className="sheet-btn"
                  onClick={() => {
                    updateMessageStatus(selectedMessage.id, 'closed');
                    setShowActionSheet(false);
                  }}
                >
                  Close ticket
                </button>
                <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #f1f6f8' }} />
                <button 
                  className="sheet-btn danger"
                  onClick={() => {
                    if (confirm('Delete this conversation?')) {
                      // Add delete functionality here if needed
                      setShowActionSheet(false);
                    }
                  }}
                >
                  Delete conversation
                </button>
              </>
            )}
          </div>
          <div className="sheet__footer">
            <button className="btn-ghost" onClick={() => setShowActionSheet(false)}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportChat;
