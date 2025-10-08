import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/OptimizedAuthContext';
import { supabase } from '../../lib/supabase';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

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

const HelpSupportPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  
  // Chat functionality state
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<SupportMessage[]>([]);
  const [selectedChat, setSelectedChat] = useState<SupportMessage | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }

    if (message.trim().length > 0 && message.trim().length < 10) {
      setError('Please provide more details (at least 10 characters)');
      return;
    }

    if (!user) {
      setError('You must be logged in to send a message');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Get user profile information with fallback
      let userName = 'User';
      let userEmail = user.email || '';

      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', user.id)
          .single();

        if (!profileError && profile) {
          userName = profile.full_name || user.email?.split('@')[0] || 'User';
          userEmail = profile.email || user.email || '';
        } else {
          // Fallback to user email if profile fetch fails
          userName = user.email?.split('@')[0] || 'User';
          userEmail = user.email || '';
        }
      } catch (profileError) {
        // If profile fetch fails, use email as fallback
        console.warn('Profile fetch failed, using email fallback:', profileError);
        userName = user.email?.split('@')[0] || 'User';
        userEmail = user.email || '';
      }

      // Insert support message
      const { error: insertError } = await supabase
        .from('support_messages')
        .insert({
          user_id: user.id,
          user_name: userName,
          user_email: userEmail,
          message: message.trim(),
          status: 'unread',
          priority: 'medium'
        });

      if (insertError) {
        throw insertError;
      }

      setMessage('');
      setShowToast(true);
      
      // Hide toast after 2.2 seconds
      setTimeout(() => setShowToast(false), 2200);
    } catch (error) {
      console.error('Error sending support message:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSubmit(e as any);
    }
  };

  const updateCount = useCallback(() => {
    const val = message.trim();
    if (val.length > 0 && val.length < 10) {
      setError('Please provide more details (at least 10 characters)');
    } else {
      setError(null);
    }
  }, [message]);

  useEffect(() => {
    updateCount();
  }, [message, updateCount]);

  // Chat functionality functions
  const fetchUserMessages = useCallback(async () => {
    if (!user) return;
    
    setChatLoading(true);
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChatMessages(data || []);
      
      // Count unread messages (messages that haven't been replied to)
      const unread = data?.filter(msg => msg.status === 'unread' || msg.status === 'read').length || 0;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching user messages:', error);
    } finally {
      setChatLoading(false);
    }
  }, [user]);

  const openChat = () => {
    setShowChat(true);
    fetchUserMessages();
  };

  const closeChat = () => {
    setShowChat(false);
    setSelectedChat(null);
  };

  const selectChat = (chatMessage: SupportMessage) => {
    setSelectedChat(chatMessage);
  };

  const formatChatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      month: 'short',
      day: '2-digit'
    }).format(date);
  };

  const getStatusColor = (status: SupportMessage['status']) => {
    switch (status) {
      case 'unread':
        return 'rgba(255,200,60,.18)';
      case 'read':
        return 'rgba(59,130,246,.18)';
      case 'replied':
        return 'rgba(16,185,129,.18)';
      case 'closed':
        return 'rgba(107,114,128,.18)';
      default:
        return 'rgba(107,114,128,.18)';
    }
  };

  const getStatusText = (status: SupportMessage['status']) => {
    switch (status) {
      case 'unread':
        return 'Pending';
      case 'read':
        return 'Reviewed';
      case 'replied':
        return 'Replied';
      case 'closed':
        return 'Closed';
      default:
        return 'Unknown';
    }
  };

  // Load unread count on component mount
  useEffect(() => {
    if (user) {
      fetchUserMessages();
    }
  }, [user, fetchUserMessages]);

  // Handle ESC key to close chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showChat) {
        e.preventDefault();
        closeChat();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showChat]);

  return (
    <div className="support-page">
      <style>{`
        :root{
          --primary:#0ABDC6;
          --accent:#00E6B8;
          --deep:#0b2a35;
          --ink:#0f172a;
          --muted:#5b7a88;
          --bg:#F2FBFE;
          --card:#ffffff;
          --ring: rgba(10,189,198,.35);
          --shadow: 0 12px 30px rgba(10,30,40,.12);
          --radius:18px;
        }

        .support-page{
          max-width: 100%;
          margin: 0 auto 72px;
          padding: 0 16px;
          min-height: 100vh;
          background: var(--bg);
        }

        .support-hero{
          position: relative;
          margin: 16px 0 18px;
          padding: 24px 16px 28px 56px;
          color: #fff;
          border-radius: 24px;
          background:
            radial-gradient(120% 90% at 10% -10%, #b7f8ff 0%, transparent 55%),
            radial-gradient(120% 90% at 110% -10%, #c8fff1 0%, transparent 55%),
            linear-gradient(135deg, #6c5dd3, #36c2cf);
          box-shadow: var(--shadow);
          overflow: hidden;
        }

        .support-hero h1{
          margin: 0 0 6px;
          font-size: 1.4rem;
          font-weight: 900;
          letter-spacing: .2px;
          text-shadow: 0 2px 10px rgba(0,0,0,.25);
        }

        .support-hero .subtitle{
          margin: 0;
          opacity: .95;
          font-size: 0.9rem;
          line-height: 1.4;
        }

        .back-btn{
          position: absolute;
          left: 10px;
          top: 10px;
          width: 36px;
          height: 36px;
          display: grid;
          place-items: center;
          border: 0;
          border-radius: 50%;
          background: rgba(255,255,255,.25);
          box-shadow: inset 0 0 0 1px rgba(255,255,255,.65);
          cursor: pointer;
          color: #08383c;
          transition: transform 0.2s ease;
        }

        .back-btn:hover{
          transform: translateY(-1px);
        }

        .back-btn svg{
          width: 18px;
          height: 18px;
          fill: none;
          stroke: currentColor;
          stroke-width: 2.2;
        }

        .hero-bubbles{
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .hero-bubbles span{
          position: absolute;
          bottom: -14px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, #fff, rgba(255,255,255,.6));
          box-shadow: inset 0 0 8px rgba(255,255,255,.9), 0 6px 14px rgba(0,0,0,.08);
          animation: rise 10s linear infinite;
          opacity: .9;
        }

        .hero-bubbles span:nth-child(1){left: 12%}
        .hero-bubbles span:nth-child(2){left: 30%; animation-duration: 12s}
        .hero-bubbles span:nth-child(3){left: 55%; width: 12px; height: 12px}
        .hero-bubbles span:nth-child(4){left: 72%; animation-duration: 8s}
        .hero-bubbles span:nth-child(5){left: 88%; width: 8px; height: 8px}

        @keyframes rise{
          0%{ transform: translateY(0) scale(.9); opacity: 0 }
          10%{ opacity: .95 }
          100%{ transform: translateY(-220px) scale(1.15); opacity: 0 }
        }

        .support-card{
          background: #fff;
          border-radius: 22px;
          padding: 16px;
          box-shadow: var(--shadow);
          margin-bottom: 14px;
        }

        .tip-card{
          display: flex;
          gap: 12px;
          align-items: flex-start;
          padding: 14px;
          border-radius: 16px;
          background: linear-gradient(180deg, rgba(10,189,198,.08), rgba(10,189,198,.03));
          border: 1px solid rgba(10,189,198,.25);
        }

        .tip-icon{
          width: 44px;
          height: 44px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: linear-gradient(135deg, var(--primary), var(--accent));
          color: #fff;
          box-shadow: 0 8px 20px rgba(10,189,198,.35);
          flex: 0 0 auto;
        }

        .tip-icon svg{
          width: 24px;
          height: 24px;
          fill: none;
          stroke: #fff;
          stroke-width: 2;
        }

        .tip-card h2{
          margin: .2rem 0 4px;
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--deep);
        }

        .tip-card p{
          margin: 0;
          color: #1d3d48;
          opacity: .9;
          font-size: 0.9rem;
          line-height: 1.4;
        }

        .field-label{
          display: block;
          margin: 16px 2px 8px;
          font-weight: 800;
          color: #08383c;
          font-size: 0.95rem;
        }

        .textarea-wrap{
          position: relative;
        }

        textarea{
          width: 100%;
          resize: vertical;
          min-height: 140px;
          border-radius: 16px;
          border: 1px solid #dbe8ee;
          padding: 14px 14px 28px;
          font-size: 1rem;
          line-height: 1.5;
          outline: none;
          background: #fbfeff;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.6);
          font-family: inherit;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        textarea:focus{
          border-color: var(--primary);
          box-shadow: 0 0 0 4px rgba(10,189,198,.15);
        }

        textarea.error{
          border-color: #ffd29a;
        }

        .char-counter{
          position: absolute;
          right: 10px;
          bottom: 8px;
          font-size: .82rem;
          color: #6b8a96;
        }

        .send-wrap{
          margin-top: 14px;
          display: flex;
          justify-content: flex-start;
        }

        .send-btn{
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          border: 0;
          cursor: pointer;
          border-radius: 999px;
          padding: 14px 22px 14px 18px;
          color: #fff;
          font-weight: 900;
          letter-spacing: .25px;
          font-size: 1rem;
          background: linear-gradient(135deg, var(--primary), var(--accent));
          box-shadow: 0 12px 26px rgba(0,0,0,.16), 0 10px 24px var(--ring);
          transition: transform .12s ease, filter .2s ease, box-shadow .2s ease;
          overflow: hidden;
        }

        .send-btn:hover{
          transform: translateY(-1px);
          filter: saturate(1.05);
        }

        .send-btn:disabled{
          opacity: .6;
          cursor: not-allowed;
          filter: grayscale(.1);
        }

        .send-btn .plane svg{
          width: 16px;
          height: 16px;
          fill: #fff;
        }

        .send-btn.sending .plane{
          animation: fly 1.1s ease-in-out infinite;
        }

        @keyframes fly{
          0%{ transform: translate(0,0) rotate(0) }
          50%{ transform: translate(4px,-4px) rotate(10deg) }
          100%{ transform: translate(0,0) rotate(0) }
        }

        .contact-grid{
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
          margin-top: 14px;
        }

        .contact-item{
          background: #fff;
          border-radius: 16px;
          padding: 14px;
          display: flex;
          gap: 12px;
          align-items: flex-start;
          box-shadow: var(--shadow);
        }

        .contact-item .icon{
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          background: rgba(10,189,198,.1);
          color: var(--primary);
          box-shadow: inset 0 0 0 1px rgba(10,189,198,.25);
          flex: 0 0 auto;
        }

        .contact-item .icon svg{
          width: 20px;
          height: 20px;
          fill: none;
          stroke: currentColor;
          stroke-width: 2;
        }

        .contact-item h3{
          margin: .1rem 0 2px;
          font-size: .98rem;
          font-weight: 600;
          color: var(--deep);
        }

        .contact-item p{
          margin: 0;
          color: var(--muted);
          font-size: 0.9rem;
        }

        .contact-item a{
          color: #0a6d78;
          text-decoration: none;
        }

        .contact-item a:hover{
          text-decoration: underline;
        }

        .toast{
          position: fixed;
          left: 50%;
          bottom: 24px;
          transform: translateX(-50%) translateY(20px);
          display: flex;
          gap: 10px;
          align-items: center;
          background: #fff;
          color: #073238;
          border: 1px solid rgba(10,189,198,.3);
          padding: 12px 14px;
          border-radius: 14px;
          box-shadow: var(--shadow);
          opacity: 0;
          pointer-events: none;
          transition: all .25s ease;
          z-index: 1000;
        }

        .toast svg{
          width: 18px;
          height: 18px;
          fill: none;
          stroke: var(--primary);
          stroke-width: 2.4;
        }

        .toast.show{
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }

        .error-message{
          color: #dc2626;
          font-size: 0.85rem;
          margin-top: 4px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .shake{
          animation: shake 0.22s ease-in-out;
        }

        @keyframes shake{
          0%{ transform: translateX(0) }
          25%{ transform: translateX(-4px) }
          75%{ transform: translateX(4px) }
          100%{ transform: translateX(0) }
        }

        button:focus-visible{
          outline: 3px solid var(--accent);
          outline-offset: 2px;
        }

        @media (min-width: 640px) {
          .contact-grid{
            grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          }
        }

        /* Chat FAB and Widget Styles */
        .chat-fab{
          position:fixed; right:16px; bottom:calc(16px + env(safe-area-inset-bottom));
          z-index:60; width:56px; height:56px; border:0; border-radius:16px; cursor:pointer;
          display:grid; place-items:center; color:#073238;
          background:linear-gradient(135deg,var(--primary),var(--accent));
          box-shadow:0 14px 28px rgba(10,189,198,.35);
          transition: transform .12s ease, filter .2s ease;
        }
        .chat-fab:hover{
          transform: translateY(-1px);
          filter: saturate(1.05);
        }
        .chat-fab svg{width:24px;height:24px;fill:#fff}
        .chat-fab .fab-gloss{
          content:""; position:absolute; inset:0; border-radius:inherit; pointer-events:none;
          background:linear-gradient(180deg,rgba(255,255,255,.6),rgba(255,255,255,0) 55%);
          mix-blend-mode:screen; opacity:.85;
        }
        .badge{
          position:absolute; top:-6px; right:-6px; min-width:20px; height:20px; padding:0 6px;
          border-radius:999px; background:#ff4d4f; color:#fff; font-size:.75rem; font-weight:900;
          box-shadow:0 6px 14px rgba(255,77,79,.35); display:grid; place-items:center;
        }

        /* Chat window */
        .chat{
          position:fixed; right:16px; bottom:calc(82px + env(safe-area-inset-bottom));
          width:min(360px, 92vw); height:460px; border-radius:18px; overflow:hidden; z-index:59;
          background:var(--card); border:1px solid var(--line); box-shadow:var(--shadow);
          transform:translateY(16px) scale(.98); opacity:0; pointer-events:none;
          transition:transform .24s ease, opacity .24s ease;
        }
        .chat.show{ transform:translateY(0) scale(1); opacity:1; pointer-events:auto }

        /* Header */
        .chat__hdr{
          position:relative; padding:10px 10px 10px 14px; color:#fff;
          background:
            radial-gradient(120% 100% at 100% -20%, #c8fff1 0%, transparent 55%),
            radial-gradient(120% 100% at 0% 120%, #b7f8ff 0%, transparent 60%),
            linear-gradient(135deg, #6c5dd3, #36c2cf);
          display:flex; align-items:center; justify-content:space-between;
        }
        .chat-title{font-weight:900; display:flex; flex-direction:column}
        .chat-title small{font-weight:600; opacity:.9}
        .chat-dot{width:8px;height:8px;border-radius:50%;background:#8affc1;display:inline-block;box-shadow:0 0 12px #8affc1;margin-bottom:6px}
        .chat-close-btn{border:0;background:rgba(255,255,255,.2); border-radius:12px; width:36px; height:36px; display:grid; place-items:center; cursor:pointer}
        .chat-close-btn svg{width:18px;height:18px;fill:none;stroke:#fff;stroke-width:2}

        /* Messages list */
        .chat__list{
          height: calc(460px - 62px);
          padding:12px; overflow:auto; background:linear-gradient(#fbfeff,#f6fbfc);
        }
        .chat-message{
          display:flex; gap:10px; margin:8px 0; align-items:flex-start; padding:12px; border-radius:12px;
          background:#fff; border:1px solid var(--line); box-shadow:0 6px 16px rgba(10,30,40,.08);
        }
        .chat-message-content{flex:1}
        .chat-message-text{margin:0 0 8px; line-height:1.4; color:var(--ink)}
        .chat-message-meta{display:flex; justify-content:space-between; align-items:center; font-size:.72rem; color:var(--muted)}
        .chat-status-pill{
          padding:2px 8px; border-radius:999px; font-size:.7rem; font-weight:700;
          border:1px solid; display:inline-flex; align-items:center;
        }
        .chat-back-btn{
          background:rgba(255,255,255,.2); border:0; border-radius:8px; padding:6px;
          color:#fff; cursor:pointer; display:flex; align-items:center; gap:4px;
          font-size:.8rem; font-weight:600;
        }
        .chat-back-btn svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:2}

        /* Individual chat view */
        .individual-chat{
          height: calc(460px - 62px);
          padding:12px; overflow:auto; background:linear-gradient(#fbfeff,#f6fbfc);
        }
        .chat-bubble{
          max-width:85%; padding:10px 12px; border-radius:14px; line-height:1.35; font-size:.95rem;
          margin:8px 0; border:1px solid var(--line); background:#fff; color:var(--ink);
          box-shadow:0 6px 16px rgba(10,30,40,.08);
        }
        .chat-bubble.user{
          background:linear-gradient(135deg,var(--primary),var(--accent)); color:#fff; border-color:transparent;
          margin-left:auto; margin-right:0;
        }
        .chat-bubble.admin{
          background:#fff; color:var(--ink);
        }
        .chat-bubble-meta{display:block; font-size:.72rem; color:var(--muted); margin-top:4px; opacity:.8}
        .chat-bubble.user .chat-bubble-meta{color:rgba(255,255,255,.8)}

        @media (max-height:700px){
          .chat{height:400px}
          .chat__list, .individual-chat{height: calc(400px - 62px)}
        }
      `}</style>

      <div className="support-hero">
        <button 
          className="back-btn" 
          onClick={() => navigate('/profile')}
          aria-label="Go back"
        >
          <ArrowLeftIcon />
        </button>
        <h1>Help & Support</h1>
        <p className="subtitle">We're here to help with any questions about your cleanings, billing, or account.</p>
        <div className="hero-bubbles" aria-hidden="true">
          <span></span><span></span><span></span><span></span><span></span>
        </div>
      </div>

      <div className="support-card">
        <header className="tip-card">
          <div className="tip-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2a7 7 0 0 1 5 11.9V17a1 1 0 0 1-1 1h-8a1 1 0 0 1-1-1v-3.1A7 7 0 0 1 12 2Z"/>
              <path d="M9 20h6"/>
            </svg>
          </div>
          <div>
            <h2>How can we help you?</h2>
            <p>Describe your question or issue in detail and our team will respond as quickly as possible.</p>
          </div>
        </header>

        <form onSubmit={handleSubmit} id="supportForm" noValidate>
          <label htmlFor="message" className="field-label">Your Message</label>
          <div className="textarea-wrap">
            <textarea
              id="message"
              name="message"
              rows={6}
              maxLength={1000}
              placeholder="Please describe your question or issue in detail…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSubmitting}
              className={error && message.length > 0 && message.length < 10 ? 'error' : ''}
            />
            <div className="char-counter">
              <span>{message.length}</span>/1000
            </div>
          </div>

          {error && (
            <div className="error-message">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              {error}
            </div>
          )}

          <div className="send-wrap">
            <button 
              type="submit" 
              className={`send-btn ${isSubmitting ? 'sending' : ''}`}
              disabled={isSubmitting || !message.trim() || (message.length > 0 && message.length < 10)}
              aria-live="polite"
            >
              <span className="btn-text">
                {isSubmitting ? 'Sending…' : 'Send Message'}
              </span>
              <span className="plane" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M3 11l18-8-8 18-2-7-8-3z"/>
                </svg>
              </span>
            </button>
          </div>
        </form>
      </div>

      <div className="contact-grid">
        <article className="contact-item">
          <div className="icon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 6l8 6 8-6"/>
              <path d="M4 6v12h16V6"/>
            </svg>
          </div>
          <div>
            <h3>Email Support</h3>
            <p><a href="mailto:sparklencs@gmail.com">sparklencs@gmail.com</a></p>
          </div>
        </article>

        <article className="contact-item">
          <div className="icon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 2v4"/>
              <path d="M18 2v4"/>
              <rect x="3" y="4" width="18" height="18" rx="3"/>
              <path d="M3 10h18"/>
            </svg>
          </div>
          <div>
            <h3>Response Time</h3>
            <p>Usually within 24 hours</p>
          </div>
        </article>
      </div>

      <div className={`toast ${showToast ? 'show' : ''}`} role="status" aria-live="polite">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20 6l-11 11-5-5"/>
        </svg>
        <span>Message sent! We'll get back to you soon.</span>
      </div>

      {/* Chat FAB Button */}
      <button className="chat-fab" onClick={openChat} aria-label="Open support chat">
        <span className="fab-gloss" aria-hidden="true"></span>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M21 15a4 4 0 0 1-4 4H9l-6 3 2-4a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4h12a4 4 0 0 1 4 4v8Z"/>
        </svg>
        {unreadCount > 0 && (
          <span className="badge">{unreadCount}</span>
        )}
      </button>

      {/* Chat Widget */}
      <aside className={`chat ${showChat ? 'show' : ''}`} aria-hidden={!showChat} aria-label="Support chat">
        <header className="chat__hdr">
          <div className="chat-title">
            {selectedChat ? (
              <button className="chat-back-btn" onClick={() => setSelectedChat(null)}>
                <svg viewBox="0 0 24 24">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
                Back to messages
              </button>
            ) : (
              <>
                <span className="chat-dot"></span>
                Help & Support
                <small>Your message history</small>
              </>
            )}
          </div>
          <button className="chat-close-btn" onClick={closeChat} aria-label="Close chat">
            <svg viewBox="0 0 24 24">
              <path d="M6 6l12 12M18 6l-12 12"/>
            </svg>
          </button>
        </header>

        {!selectedChat ? (
          // Messages List View
          <div className="chat__list" role="log" aria-live="polite" aria-relevant="additions">
            {chatLoading ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)' }}>
                Loading your messages...
              </div>
            ) : chatMessages.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)' }}>
                No messages yet. Send your first message using the form above!
              </div>
            ) : (
              chatMessages.map((msg) => (
                <div 
                  key={msg.id} 
                  className="chat-message" 
                  onClick={() => selectChat(msg)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="chat-message-content">
                    <p className="chat-message-text">
                      {msg.message.length > 100 ? `${msg.message.substring(0, 100)}...` : msg.message}
                    </p>
                    <div className="chat-message-meta">
                      <span>{formatChatTime(msg.created_at)}</span>
                      <span 
                        className="chat-status-pill"
                        style={{ 
                          backgroundColor: getStatusColor(msg.status),
                          borderColor: getStatusColor(msg.status),
                          color: 'var(--ink)'
                        }}
                      >
                        {getStatusText(msg.status)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          // Individual Chat View
          <div className="individual-chat">
            <div className="chat-bubble user">
              {selectedChat.message}
              <span className="chat-bubble-meta">{formatChatTime(selectedChat.created_at)}</span>
            </div>
            
            {selectedChat.admin_notes && (
              <div className="chat-bubble admin">
                {selectedChat.admin_notes}
                <span className="chat-bubble-meta">Support Team</span>
              </div>
            )}
            
            {selectedChat.status === 'unread' || selectedChat.status === 'read' ? (
              <div style={{ 
                padding: '12px', 
                textAlign: 'center', 
                color: 'var(--muted)', 
                fontSize: '0.85rem',
                fontStyle: 'italic'
              }}>
                Your message is being reviewed by our support team.
              </div>
            ) : null}
          </div>
        )}
      </aside>
    </div>
  );
};

export default HelpSupportPage;
