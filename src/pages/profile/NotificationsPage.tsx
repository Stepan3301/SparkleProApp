import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  BellIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  type: 'push' | 'email' | 'sms';
}

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: 'booking_confirmation',
      title: 'Booking Confirmations',
      description: 'Get notified when your booking is confirmed',
      icon: <CheckCircleIcon className="w-5 h-5" />,
      enabled: true,
      type: 'push'
    },
    {
      id: 'service_reminders',
      title: 'Service Reminders',
      description: 'Reminders before your scheduled cleaning',
      icon: <ClockIcon className="w-5 h-5" />,
      enabled: true,
      type: 'push'
    },
    {
      id: 'service_updates',
      title: 'Service Updates',
      description: 'Updates about your ongoing cleaning service',
      icon: <BellIcon className="w-5 h-5" />,
      enabled: true,
      type: 'push'
    },
    {
      id: 'promotions',
      title: 'Promotions & Offers',
      description: 'Special deals and discounts on our services',
      icon: <BellIcon className="w-5 h-5" />,
      enabled: false,
      type: 'email'
    },
    {
      id: 'service_completion',
      title: 'Service Completion',
      description: 'Notifications when your cleaning is completed',
      icon: <CheckCircleIcon className="w-5 h-5" />,
      enabled: true,
      type: 'push'
    },
  ]);

  const toggleSetting = (id: string) => {
    setSettings(settings.map(setting => 
      setting.id === id ? { ...setting, enabled: !setting.enabled } : setting
    ));
  };

  const getNotificationTypeInfo = (type: 'push' | 'email' | 'sms') => {
    switch (type) {
      case 'push':
        return { icon: <DevicePhoneMobileIcon className="w-4 h-4" />, label: 'Push', color: 'text-blue-600' };
      case 'email':
        return { icon: <EnvelopeIcon className="w-4 h-4" />, label: 'Email', color: 'text-green-600' };
      case 'sms':
        return { icon: <DevicePhoneMobileIcon className="w-4 h-4" />, label: 'SMS', color: 'text-purple-600' };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white px-5 py-4 border-b border-gray-100 flex items-center gap-4">
        <button 
          onClick={() => navigate('/profile')}
          className="p-2 rounded-xl bg-gray-100 active:bg-gray-200 transition-all active:scale-95"
        >
          <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
      </header>

      {/* Content */}
      <div className="p-5">
        {/* Info Card */}
        <div className="bg-gradient-to-r from-primary to-primary-light rounded-2xl p-6 mb-6 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
              <BellIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Stay Updated</h3>
              <p className="text-primary-50 text-sm">Customize how you want to receive notifications</p>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-2xl p-4 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 px-2">Notification Preferences</h3>
          <div className="space-y-2">
            {settings.map((setting) => {
              const typeInfo = getNotificationTypeInfo(setting.type);
              return (
                <NotificationToggle
                  key={setting.id}
                  setting={setting}
                  typeInfo={typeInfo}
                  onToggle={() => toggleSetting(setting.id)}
                />
              );
            })}
          </div>
        </div>

        {/* Notification Types Info */}
        <div className="bg-white rounded-2xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Notification Types</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <DevicePhoneMobileIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Push Notifications</h4>
                <p className="text-sm text-gray-600">Instant notifications on your device</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <EnvelopeIcon className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Email Notifications</h4>
                <p className="text-sm text-gray-600">Updates sent to your email address</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Notification Toggle Component
interface NotificationToggleProps {
  setting: NotificationSetting;
  typeInfo: { icon: React.ReactNode; label: string; color: string };
  onToggle: () => void;
}

const NotificationToggle: React.FC<NotificationToggleProps> = ({ setting, typeInfo, onToggle }) => (
  <div className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-all">
    <div className="flex items-center gap-3 flex-1">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
        setting.enabled ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
      }`}>
        {setting.icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-semibold text-gray-900">{setting.title}</h4>
          <div className={`flex items-center gap-1 ${typeInfo.color}`}>
            {typeInfo.icon}
            <span className="text-xs font-medium">{typeInfo.label}</span>
          </div>
        </div>
        <p className="text-sm text-gray-600">{setting.description}</p>
      </div>
    </div>
    <button
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        setting.enabled ? 'bg-primary' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          setting.enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);

export default NotificationsPage; 