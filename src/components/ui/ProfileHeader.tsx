import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface ProfileHeaderProps {
  onEditProfile: () => void;
  onNewBooking: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ onEditProfile, onNewBooking }) => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalCleanings: 0,
    hoursSaved: 0,
    rating: 5.0
  });
  const [loading, setLoading] = useState(true);
  const [animatedStats, setAnimatedStats] = useState({
    totalCleanings: 0,
    hoursSaved: 0,
    rating: 0
  });

  useEffect(() => {
    if (user) {
      fetchUserStats();
    }
  }, [user]);

  // Animation effect for stats
  useEffect(() => {
    if (!loading && stats.totalCleanings > 0) {
      const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
      const duration = 1200;
      let start: number | null = null;

      const animate = (timestamp: number) => {
        if (!start) start = timestamp;
        const progress = Math.min(1, (timestamp - start) / duration);
        const easedProgress = easeOut(progress);

        setAnimatedStats({
          totalCleanings: Math.round(easedProgress * stats.totalCleanings),
          hoursSaved: Math.round(easedProgress * stats.hoursSaved),
          rating: Math.round(easedProgress * stats.rating * 10) / 10
        });

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }
  }, [loading, stats]);

  const fetchUserStats = async () => {
    if (!user) return;

    try {
      // Fetch completed bookings to calculate stats
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('duration_hours, status, created_at')
        .eq('customer_id', user.id)
        .eq('status', 'completed');

      if (error) {
        console.error('Error fetching bookings:', error);
        return;
      }

      const totalCleanings = bookings?.length || 0;
      const hoursSaved = bookings?.reduce((total, booking) => total + (booking.duration_hours || 0), 0) || 0;

      setStats({
        totalCleanings,
        hoursSaved,
        rating: 5.0 // Default rating, could be calculated from reviews
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserName = () => {
    return profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  };

  const getUserEmail = () => {
    return user?.email || 'No email';
  };

  const formatMemberSince = () => {
    if (!profile?.member_since) {
      return 'Active member since 2024';
    }

    try {
      const date = new Date(profile.member_since);
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      
      return `Active member since ${month} ${year}`;
    } catch (error) {
      console.error('Error formatting member date:', error);
      return 'Active member since 2024';
    }
  };

  const getUserAvatar = () => {
    if (profile?.avatar_url) {
      return profile.avatar_url;
    }
    // Generate avatar based on user name
    const name = getUserName();
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0ABDC6&color=fff&size=120`;
  };

  return (
    <section className="profile-hero">
      {/* Dynamic background */}
      <div className="hero-bg" aria-hidden="true">
        <div className="glow"></div>
        <div className="bubbles">
          <span></span><span></span><span></span><span></span><span></span>
          <span></span><span></span><span></span><span></span><span></span>
        </div>
      </div>

      <header className="hero-content">
        {/* Back Button */}
        <div className="flex justify-start mb-4 relative z-10">
          <button
            onClick={() => navigate('/home')}
            className="w-10 h-10 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        <div className="hero-row">
          <div className="user">
            <img className="avatar" src={getUserAvatar()} alt="User avatar" />
            <div className="user-meta">
              <h1 className="user-name">{getUserName()}</h1>
              <div className="user-sub">
                <span className="pill pill--mint">{formatMemberSince()}</span>
                <span className="email">{getUserEmail()}</span>
              </div>
            </div>
          </div>

          <div className="hero-actions">
            <button className="btn btn--ghost" onClick={onEditProfile}>
              Edit Profile
            </button>
            <button className="btn btn--primary" onClick={onNewBooking}>
              New Booking
            </button>
          </div>
        </div>

        <div className="hero-stats">
          <article className="stat">
            <div className="stat-top">
              <svg viewBox="0 0 24 24" className="ico" aria-hidden="true">
                <path d="M3 6h18M3 12h18M3 18h18"/>
              </svg>
              <span className="label">Total Cleanings</span>
            </div>
            <div className="value" data-target={stats.totalCleanings}>
              {loading ? '0' : animatedStats.totalCleanings}
            </div>
            <p className="hint">Completed visits</p>
          </article>

          <article className="stat">
            <div className="stat-top">
              <svg viewBox="0 0 24 24" className="ico" aria-hidden="true">
                <path d="M12 6v6l4 2"/>
              </svg>
              <span className="label">Hours Saved</span>
            </div>
            <div className="value" data-target={stats.hoursSaved}>
              {loading ? '0' : animatedStats.hoursSaved}
            </div>
            <p className="hint">Compared to DIY cleaning</p>
          </article>

          <article className="stat">
            <div className="stat-top">
              <svg viewBox="0 0 24 24" className="ico" aria-hidden="true">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.9L18.18 22 12 18.6 5.82 22 7 14.17l-5-4.9 6.91-1.01z"/>
              </svg>
              <span className="label">Rating</span>
            </div>
            <div className="value" data-target={stats.rating}>
              {loading ? '0' : animatedStats.rating}
            </div>
            <p className="hint">Average from your pros</p>
          </article>
        </div>
      </header>

      <style>{`
        :root{
          --primary:#0ABDC6;
          --accent:#00E6B8;
          --deep:#0b2a35;
          --ink:#0f172a;
          --bg:#F2FBFE;
          --card:#ffffff;
          --muted:#5b7a88;
          --ring: rgba(10,189,198,.35);
          --radius:22px;
          --shadow: 0 12px 30px rgba(10,30,40,.12);
        }

        .profile-hero{
          position:relative;
          overflow:hidden;
          border-radius: 0 0 28px 28px;
          box-shadow: inset 0 -1px 0 rgba(255,255,255,.6);
        }

        .hero-bg{
          position:absolute; inset:0;
          background: radial-gradient(140% 100% at 10% -10%, #b7f8ff 0%, transparent 55%),
                      radial-gradient(140% 100% at 110% -20%, #c8fff1 0%, transparent 55%),
                      linear-gradient(135deg, #6c5dd3, #36c2cf);
          animation: hue 14s ease-in-out infinite alternate;
        }
        @keyframes hue{
          0%{ filter:hue-rotate(0deg) saturate(1.05); transform: translateY(0); }
          100%{ filter:hue-rotate(-12deg) saturate(1.15); transform: translateY(-2px); }
        }

        .glow{
          position:absolute; inset:-40% -10% auto -10%; height:70%;
          background: radial-gradient(closest-side, rgba(255,255,255,.55), rgba(255,255,255,0));
          mix-blend-mode: screen; pointer-events:none;
        }

        .bubbles{ position:absolute; inset:0; pointer-events:none; }
        .bubbles span{
          position:absolute; bottom:-20px; width:12px; height:12px; border-radius:50%;
          background: radial-gradient(circle at 30% 30%, #fff, rgba(255,255,255,.65));
          box-shadow: inset 0 0 10px rgba(255,255,255,.9),
                      0 6px 20px rgba(0,0,0,.08);
          animation: rise 10s linear infinite;
          opacity:.9;
        }
        .bubbles span:nth-child(odd){ width:9px; height:9px; animation-duration:8s; opacity:.8;}
        .bubbles span:nth-child(3n){ width:14px; height:14px; animation-duration:12s; }
        .bubbles span:nth-child(1){left:8%} .bubbles span:nth-child(2){left:22%}
        .bubbles span:nth-child(3){left:38%} .bubbles span:nth-child(4){left:53%}
        .bubbles span:nth-child(5){left:66%} .bubbles span:nth-child(6){left:74%}
        .bubbles span:nth-child(7){left:83%} .bubbles span:nth-child(8){left:91%}
        .bubbles span:nth-child(9){left:30%} .bubbles span:nth-child(10){left:58%}
        @keyframes rise{
          0%{ transform: translateY(0) scale(.9); opacity:0 }
          10%{ opacity:.9 }
          100%{ transform: translateY(-240px) scale(1.2); opacity:0 }
        }

        .hero-content{
          position:relative;
          padding: 28px 18px 18px;
          color:#fff;
        }

        .hero-row{
          display:flex; align-items:center; justify-content:space-between; gap:16px;
        }

        .user{ display:flex; align-items:center; gap:14px; min-width:0; }
        .avatar{
          width:56px; height:56px; border-radius:50%;
          border:3px solid rgba(255,255,255,.7);
          box-shadow: 0 6px 16px rgba(0,0,0,.18);
        }
        .user-meta{ min-width:0; }
        .user-name{
          margin:0; font-size:1.35rem; font-weight:800; letter-spacing:.2px; text-shadow:0 2px 12px rgba(0,0,0,.25);
        }
        .user-sub{ display:flex; flex-wrap:wrap; gap:8px; align-items:center; margin-top:6px; }
        .pill{
          display:inline-flex; align-items:center; gap:6px;
          padding:6px 10px; border-radius:999px;
          background:rgba(255,255,255,.18); color:#08383c; font-weight:700; font-size:.78rem;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,.45), 0 1px 8px rgba(0,0,0,.12);
          backdrop-filter: blur(6px);
        }
        .pill--mint{ background: linear-gradient(90deg, rgba(255,255,255,.6), rgba(255,255,255,.2)); }
        .email{ font-size:.8rem; opacity:.9; text-shadow:0 1px 8px rgba(0,0,0,.15); }

        .hero-actions{ display:flex; gap:8px; flex:0 0 auto; }
        .btn{
          border:0; border-radius:12px; padding:10px 14px; font-weight:800; cursor:pointer;
          transition: transform .12s ease, filter .2s ease, box-shadow .2s ease;
        }
        .btn--ghost{
          background: rgba(255,255,255,.22); color:#093a3e;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,.55);
        }
        .btn--ghost:hover{ transform: translateY(-1px); }
        .btn--primary{
          color:white; background: linear-gradient(135deg, var(--primary), var(--accent));
          box-shadow: 0 8px 24px rgba(0,0,0,.18), 0 8px 20px var(--ring);
        }
        .btn--primary:hover{ filter:saturate(1.05); transform: translateY(-1px); }

        .hero-stats{
          margin-top:16px;
          display:grid; grid-template-columns: repeat(3, minmax(0,1fr));
          gap:12px;
        }
        .stat{
          background: rgba(255,255,255,.86);
          border-radius: 16px;
          color: var(--deep);
          padding:12px;
          box-shadow: var(--shadow);
        }
        .stat-top{ display:flex; align-items:center; gap:8px; color:#2c4a54; font-weight:700; }
        .ico{ width:18px; height:18px; fill:none; stroke: var(--primary); stroke-width:2.2; }
        .label{ font-size:.85rem; }
        .value{
          font-size:1.4rem; font-weight:900; letter-spacing:.2px; margin-top:6px;
          color:#072d32;
        }
        .hint{ margin:4px 0 0; color:#5f7c8a; font-size:.78rem; }

        @media (max-width: 720px){
          .hero-row{ flex-direction:column; align-items:flex-start; gap:14px; }
          .hero-actions{ width:100%; }
          .hero-actions .btn{ flex:1; }
          .hero-stats{ grid-template-columns: repeat(2, minmax(0,1fr)); }
        }
        @media (max-width: 380px){
          .hero-stats{ grid-template-columns: 1fr; }
        }
        button:focus-visible{ outline:3px solid #fff; outline-offset:2px; }
      `}</style>
    </section>
  );
};

export default ProfileHeader;
