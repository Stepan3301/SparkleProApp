import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import LanguageSwitcher from '../components/ui/LanguageSwitcher';
import LoadingScreen from '../components/ui/LoadingScreen';
import PWAInstallPrompt from '../components/ui/PWAInstallPrompt';
import EnableNotificationsCard from '../components/EnableNotificationsCard';
import { useSimpleTranslation } from '../utils/i18n';
import { 
  UserIcon, 
  MapPinIcon, 
  CreditCardIcon, 
  BellIcon, 
  ShieldCheckIcon,
  QuestionMarkCircleIcon,
  ArrowRightOnRectangleIcon,
  ChevronRightIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { t } = useSimpleTranslation();
  const [stats, setStats] = useState({ bookings: 0, addresses: 0, rating: 5.0 });
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserStats();
    }
  }, [user]);

  // Refresh stats when component becomes visible (user navigates back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        fetchUserStats();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  const fetchUserStats = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch profile and stats in parallel for better performance
      const [bookingsResult, addressesResult, profileResult] = await Promise.all([
        supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('customer_id', user.id),
        supabase
          .from('addresses')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('profiles')
          .select('member_since, full_name, phone_number, avatar_url')
          .eq('id', user.id)
          .single()
      ]);

      const { count: bookingsCount, error: bookingsError } = bookingsResult;
      const { count: addressesCount, error: addressesError } = addressesResult;
      const { data: profileData, error: profileError } = profileResult;

      if (bookingsError) {
        console.error('Error fetching bookings count:', bookingsError);
        throw bookingsError;
      }

      if (addressesError) {
        console.error('Error fetching addresses count:', addressesError);
        throw addressesError;
      }

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError);
        // Don't throw profile error, just log it
      }

      // Update stats with real data
      setStats({
        bookings: bookingsCount || 0,
        addresses: addressesCount || 0,
        rating: 5.0 // This could be calculated from reviews if you have a reviews system
      });

      // Update profile data
      setProfile(profileData);

    } catch (error) {
      console.error('Error fetching user stats:', error);
      setError('Failed to load stats');
      // Keep previous stats on error, just stop loading
    } finally {
      setLoading(false);
      // Only set initial loading to false after the first load
      if (initialLoading) {
        setInitialLoading(false);
      }
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getUserName = () => {
    // Priority: database profile full_name > user metadata > email
    return profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  };

  const getUserInitials = () => {
    const name = getUserName();
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatMemberSince = () => {
    if (!profile?.member_since) {
      // Fallback to user creation date if available, otherwise use 2024
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

  const mainMenuItems = [
    {
      icon: <UserIcon className="w-5 h-5" />,
      title: "Personal Info",
      description: "Update profile",
      onClick: () => navigate('/profile/personal-info'),
      gradient: "from-blue-500 to-blue-600"
    },
    {
      icon: <MapPinIcon className="w-5 h-5" />,
      title: "Addresses",
      description: "Manage locations",
      onClick: () => navigate('/profile/addresses'),
      gradient: "from-emerald-500 to-emerald-600"
    },
    {
      icon: <CreditCardIcon className="w-5 h-5" />,
      title: "Payment",
      description: "Cards & billing",
      onClick: () => {}, // Disabled - no navigation
      gradient: "from-gray-400 to-gray-500", // Greyed out
      badge: "Coming Soon",
      disabled: true // Add disabled flag
    },
    {
      icon: <BellIcon className="w-5 h-5" />,
      title: "Notifications",
      description: "Preferences",
      onClick: () => navigate('/profile/notifications'),
      gradient: "from-red-500 to-red-600"
    }
  ];

  const fullWidthItems = [
    {
      icon: <ShieldCheckIcon className="w-5 h-5" />,
      title: "Privacy & Security",
      description: "Account security settings",
      onClick: () => navigate('/profile/privacy-security'),
      gradient: "from-purple-500 to-purple-600"
    },
    {
      icon: <QuestionMarkCircleIcon className="w-5 h-5" />,
      title: "Help & Support", 
      description: "Get help and contact us",
      onClick: () => navigate('/profile/help-support'),
      gradient: "from-cyan-500 to-blue-500"
    }
  ];

  return (
    <>
      {/* Loading Screen */}
      <LoadingScreen 
        isLoading={initialLoading} 
        onLoadingComplete={() => {}}
        minDuration={1000}
        smartLoading={true}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <style>{`
        .shimmer {
          position: absolute;
          top: -50%;
          right: -20%;
          width: 100%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
          animation: shimmer 6s infinite;
        }

        @keyframes shimmer {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .avatar-shine {
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(45deg, transparent, rgba(255,255,255,0.3), transparent);
          animation: avatarShine 3s infinite;
        }

        @keyframes avatarShine {
          0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
          100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
        }

        .menu-item-hover {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.1), transparent);
          transition: left 0.5s;
        }

        .menu-item:hover .menu-item-hover {
          left: 100%;
        }

        .shine-effect {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s;
        }

        .menu-item:hover .shine-effect {
          left: 100%;
        }

        .pulse-dot {
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      `}</style>

             {/* Enhanced Header */}
       <header className="bg-gradient-to-r from-indigo-600 to-purple-600 pb-10 pt-5 px-5 relative overflow-hidden">
         <div className="shimmer"></div>
         
         {/* Back Button */}
         <div className="flex justify-start mb-4 relative z-10">
           <button
             onClick={() => navigate('/home')}
             className="w-10 h-10 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-all duration-200"
           >
             <ArrowLeftIcon className="w-5 h-5" />
           </button>
         </div>
         
         {/* Profile Header */}
         <div className="flex items-center justify-between relative z-10 mb-6">
           <div className="flex-1">
             <h1 className="text-2xl font-bold text-white mb-1 drop-shadow-lg">{getUserName()}</h1>
             <p className="text-indigo-100 text-sm mb-2">{user?.email}</p>
             <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl px-3 py-1 w-fit">
               <div className="w-2 h-2 bg-emerald-400 rounded-full pulse-dot"></div>
               <span className="text-xs text-white">{formatMemberSince()}</span>
             </div>
           </div>
                     <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-2xl flex items-center justify-center text-white text-lg font-bold relative overflow-hidden shadow-lg shadow-emerald-400/30 ml-4">
            <div className="avatar-shine"></div>
            {profile?.avatar_url ? (
              <img
                src={`${profile.avatar_url}?t=${Date.now()}`}
                alt="Profile Avatar"
                className="w-full h-full object-cover rounded-2xl relative z-10"
                onError={(e) => {
                  // Fallback to initials if image fails to load
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                  const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                  if (nextElement) {
                    nextElement.style.display = 'flex';
                  }
                }}
              />
            ) : null}
            <span 
              className="relative z-10 w-full h-full flex items-center justify-center" 
              style={{ display: profile?.avatar_url ? 'none' : 'flex' }}
            >
              {getUserInitials()}
            </span>
          </div>
         </div>

        {/* Stats Row */}
        <div 
          className="flex justify-around relative z-10 cursor-pointer" 
          onClick={() => fetchUserStats()}
          title="Tap to refresh stats"
        >
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-1 drop-shadow-lg min-h-[2rem] flex items-center justify-center">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : error ? (
                <span className="text-red-300 text-lg">--</span>
              ) : (
                stats.bookings
              )}
            </div>
            <div className="text-xs text-indigo-200">
              {stats.bookings === 1 ? 'Booking' : 'Bookings'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-1 drop-shadow-lg min-h-[2rem] flex items-center justify-center">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : error ? (
                <span className="text-red-300 text-lg">--</span>
              ) : (
                stats.addresses
              )}
            </div>
            <div className="text-xs text-indigo-200">
              {stats.addresses === 1 ? 'Address' : 'Addresses'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-1 drop-shadow-lg min-h-[2rem] flex items-center justify-center">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : error ? (
                <span className="text-red-300 text-lg">--</span>
              ) : (
                stats.rating.toFixed(1)
              )}
            </div>
            <div className="text-xs text-indigo-200">Rating</div>
          </div>
        </div>
      </header>

      {/* PWA Install Prompt - Only shows for browser users */}
      <div className="px-5 -mt-2 mb-4">
        <PWAInstallPrompt />
      </div>

      {/* Content */}
      <div className="px-5 -mt-5 relative z-20">
        {/* Main Menu Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {mainMenuItems.map((item, index) => (
            <div
              key={item.title}
              onClick={item.disabled ? undefined : item.onClick}
              className={`menu-item bg-white rounded-2xl p-5 transition-all duration-300 shadow-md border border-gray-100 relative overflow-hidden ${
                item.disabled 
                  ? 'cursor-not-allowed opacity-60 grayscale' 
                  : 'cursor-pointer hover:transform hover:-translate-y-1 hover:shadow-xl'
              }`}
            >
              <div className="menu-item-hover"></div>
              
              <div className={`w-10 h-10 bg-gradient-to-r ${item.gradient} rounded-xl flex items-center justify-center text-white mb-3 relative z-10`}>
                {item.icon}
              </div>
              
              <div className="relative z-10">
                <h3 className={`font-semibold text-sm mb-1 ${
                  item.disabled ? 'text-gray-500' : 'text-gray-900'
                }`}>{item.title}</h3>
                <p className={`text-xs ${
                  item.disabled ? 'text-gray-400' : 'text-gray-600'
                }`}>{item.description}</p>
              </div>

              {/* Badge */}
              {item.badge && (
                <div className={`absolute top-2 right-2 text-xs font-semibold px-2 py-1 rounded-lg shadow-md ${
                  item.disabled 
                    ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-gray-700' 
                    : 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900'
                }`}>
                  {item.badge}
                </div>
              )}


            </div>
          ))}
        </div>

        {/* Notification Permission Request */}
        <div className="mb-5">
          <EnableNotificationsCard 
            variant="card"
            showTestButton={true}
            onSuccess={() => console.log('Notifications enabled from profile!')}
            onDecline={() => console.log('User declined notifications from profile')}
          />
        </div>

        {/* Full Width Items */}
        <div className="space-y-3 mb-8">
          {fullWidthItems.map((item) => (
            <div
              key={item.title}
              onClick={item.onClick}
              className="menu-item bg-white rounded-2xl p-4 cursor-pointer transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-xl shadow-md border border-gray-100 flex items-center gap-4 relative overflow-hidden"
            >
              <div className="menu-item-hover"></div>
              
              <div className={`w-11 h-11 bg-gradient-to-r ${item.gradient} rounded-xl flex items-center justify-center text-white relative z-10`}>
                {item.icon}
              </div>
              
              <div className="flex-1 relative z-10">
                <h3 className="font-semibold text-gray-900 text-sm mb-1">{item.title}</h3>
                <p className="text-xs text-gray-600">{item.description}</p>
              </div>
              
              <ChevronRightIcon className="w-4 h-4 text-gray-400 relative z-10" />
            </div>
          ))}
        </div>

        {/* Language Settings */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            {t('profile.language', 'Language')}
          </h3>
          <LanguageSwitcher variant="profile" showText={true} />
        </div>

        {/* Logout Section */}
        <div className="border-t border-gray-200 pt-5 mb-5">
          <button
            onClick={handleSignOut}
            className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold py-4 px-4 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3 relative overflow-hidden"
          >
            <div className="shine-effect"></div>
            <ArrowRightOnRectangleIcon className="w-5 h-5 relative z-10" />
                            <span className="relative z-10">Log Out</span>
          </button>
        </div>

        {/* App Version */}
        <div className="text-center pb-5">
          <p className="text-xs text-gray-500">SparklePro v1.0.0</p>
        </div>
      </div>
    </div>
    </>
  );
};

export default ProfilePage; 