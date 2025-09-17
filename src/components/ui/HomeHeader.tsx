import React from 'react';
import { useAuth } from '../../contexts/OptimizedAuthContext';
import { useSimpleTranslation } from '../../utils/i18n';
import { MapPinIcon, UserIcon } from '@heroicons/react/24/outline';

interface HomeHeaderProps {
  userStats: {
    totalBookings: number;
    totalAddresses: number;
  };
  onProfileClick: () => void;
}

const HomeHeader: React.FC<HomeHeaderProps> = ({ userStats, onProfileClick }) => {
  const { user, profile } = useAuth();
  const { t } = useSimpleTranslation();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getUserName = () => {
    return profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  };

  const getUserAvatar = () => {
    if (profile?.avatar_url) {
      return profile.avatar_url;
    }
    // Generate avatar based on user name
    const name = getUserName();
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0ABDC6&color=fff&size=120`;
  };

  const getPersonalizedMessage = () => {
    if (userStats.totalBookings > 0) {
      return 'Hope your last cleaning was perfect!';
    }
    return 'Welcome to SparklePro!';
  };

  return (
    <section className="home-hero">
      {/* Dynamic background */}
      <div className="hero-bg" aria-hidden="true">
        <div className="glow"></div>
        <div className="bubbles">
          <span></span><span></span><span></span><span></span><span></span>
          <span></span><span></span><span></span><span></span><span></span>
        </div>
      </div>

      <header className="hero-content">
        <div className="hero-row">
          <div className="user">
            <img className="avatar" src={getUserAvatar()} alt="User avatar" />
            <div className="user-meta">
              <h1 className="user-name">{getGreeting()}, {getUserName()}! 👋</h1>
              <div className="user-sub">
                <div className="location flex items-center gap-1 text-sm opacity-90">
                  <MapPinIcon className="w-3 h-3" />
                  <span>{t('home.location', 'Dubai, UAE')}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="hero-actions">
            <button className="btn btn--ghost" onClick={onProfileClick}>
              <UserIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="welcome-card">
          <div className="welcome-title">✨ {getPersonalizedMessage()}</div>
          <div className="welcome-text">
            {userStats.totalBookings > 0 
              ? `${userStats.totalBookings} cleaning${userStats.totalBookings > 1 ? 's' : ''} completed • ${userStats.totalAddresses} address${userStats.totalAddresses > 1 ? 'es' : ''} saved`
              : 'Your trusted cleaning service partner in Dubai. Book your first service today!'
            }
          </div>
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

        .home-hero{
          position:relative;
          overflow:hidden;
          border-radius: 0 0 30px 30px;
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
          margin-bottom: 16px;
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

        .hero-actions{ display:flex; gap:8px; flex:0 0 auto; }
        .btn{
          border:0; border-radius:12px; padding:10px 14px; font-weight:800; cursor:pointer;
          transition: transform .12s ease, filter .2s ease, box-shadow .2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .btn--ghost{
          background: rgba(255,255,255,.22); color:#093a3e;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,.55);
          width: 44px;
          height: 44px;
          padding: 0;
        }
        .btn--ghost:hover{ transform: translateY(-1px); }

        .welcome-card{
          background: rgba(255,255,255,.15);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,.2);
          border-radius: 16px;
          padding: 16px;
          position: relative;
          z-index: 5;
        }
        .welcome-title{
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 8px;
          color: #fff;
        }
        .welcome-text{
          font-size: 0.875rem;
          opacity: 0.9;
          line-height: 1.5;
          color: #fff;
        }

        @media (max-width: 720px){
          .hero-row{ flex-direction:column; align-items:flex-start; gap:14px; }
          .hero-actions{ width:100%; }
          .hero-actions .btn{ flex:1; }
        }
        button:focus-visible{ outline:3px solid #fff; outline-offset:2px; }
      `}</style>
    </section>
  );
};

export default HomeHeader;
