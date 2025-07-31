import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  ShieldCheckIcon,
  LockClosedIcon,
  EyeIcon,
  UserIcon,
  DocumentTextIcon,
  CubeIcon
} from '@heroicons/react/24/outline';

const PrivacySecurityPage: React.FC = () => {
  const navigate = useNavigate();

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
        <h1 className="text-xl font-bold text-gray-900">Privacy & Security</h1>
      </header>

      {/* Content */}
      <div className="p-5 space-y-6">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <ShieldCheckIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Your Privacy Matters</h2>
              <p className="text-purple-100 text-sm">We protect your data with the highest standards</p>
            </div>
          </div>
        </div>

        {/* Data Protection Section */}
        <div className="bg-white rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <LockClosedIcon className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Data Protection</h3>
          </div>
          <div className="space-y-3 text-gray-700 leading-relaxed">
            <p>
              At SparklePro, we take your privacy seriously. Your personal information is protected using 
              industry-standard encryption and security measures. We collect only the information necessary 
              to provide our cleaning services.
            </p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>All payment information is encrypted and stored securely</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>Personal data is never shared with third parties without consent</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>You can request data deletion at any time</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Information We Collect */}
        <div className="bg-white rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Information We Collect</h3>
          </div>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Personal Information</h4>
              <p className="text-gray-700 text-sm leading-relaxed">
                Name, email address, phone number, and service addresses to facilitate bookings and communication.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Service Information</h4>
              <p className="text-gray-700 text-sm leading-relaxed">
                Booking history, service preferences, and feedback to improve our services and provide personalized recommendations.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Payment Data</h4>
              <p className="text-gray-700 text-sm leading-relaxed">
                Billing information processed securely through certified payment processors. We do not store complete payment details.
              </p>
            </div>
          </div>
        </div>

        {/* How We Use Your Data */}
        <div className="bg-white rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
              <EyeIcon className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">How We Use Your Data</h3>
          </div>
          <div className="space-y-3 text-gray-700 leading-relaxed">
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CubeIcon className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h5 className="font-medium text-gray-900">Service Delivery</h5>
                  <p className="text-sm text-gray-600">Scheduling appointments, managing bookings, and coordinating cleaning services</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <DocumentTextIcon className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h5 className="font-medium text-gray-900">Communication</h5>
                  <p className="text-sm text-gray-600">Sending booking confirmations, reminders, and customer support</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <ShieldCheckIcon className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h5 className="font-medium text-gray-900">Service Improvement</h5>
                  <p className="text-sm text-gray-600">Analyzing usage patterns to enhance our services and user experience</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Your Rights */}
        <div className="bg-white rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-xl flex items-center justify-center">
              <DocumentTextIcon className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Your Rights</h3>
          </div>
          <div className="space-y-3 text-gray-700 leading-relaxed">
            <p className="mb-4">You have the following rights regarding your personal data:</p>
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center gap-3 p-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-sm">Access and review your personal information</span>
              </div>
              <div className="flex items-center gap-3 p-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-sm">Request corrections to inaccurate data</span>
              </div>
              <div className="flex items-center gap-3 p-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-sm">Delete your account and associated data</span>
              </div>
              <div className="flex items-center gap-3 p-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-sm">Opt-out of marketing communications</span>
              </div>
              <div className="flex items-center gap-3 p-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-sm">Export your data in a portable format</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact for Privacy Concerns */}
        <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3">Privacy Concerns?</h3>
          <p className="text-gray-700 text-sm leading-relaxed mb-4">
            If you have any questions about our privacy practices or want to exercise your rights, 
            please contact our privacy team through the Help & Support page or email us directly.
          </p>
          <div className="text-xs text-gray-600">
            <p><strong>Last updated:</strong> {new Date().toLocaleDateString()}</p>
            <p><strong>Effective:</strong> This policy applies to all SparklePro users</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacySecurityPage;