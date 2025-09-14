import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Button from '../../components/ui/Button';
import { ArrowLeftIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const HelpSupportPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      setError('Please enter a message');
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

      setIsSubmitted(true);
      setMessage('');
    } catch (error) {
      console.error('Error sending support message:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewMessage = () => {
    setIsSubmitted(false);
    setError(null);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/profile')}
              className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Help & Support</h1>
          </div>
        </div>

        {/* Success Message */}
        <div className="px-4 py-8">
          <div className="max-w-md mx-auto text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Message Sent!</h2>
            <p className="text-gray-600 mb-6">
              Thank you for contacting us. Our support team will review your message and get back to you as soon as possible.
            </p>
            <Button
              onClick={handleNewMessage}
              className="w-full"
            >
              Send Another Message
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/profile')}
            className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Help & Support</h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        <div className="max-w-2xl mx-auto">
          {/* Info Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">How can we help you?</h2>
            <p className="text-blue-800 text-sm leading-relaxed">
              We're here to assist you with any questions or issues you might have. 
              Please describe your concern in detail, and our support team will respond as quickly as possible.
            </p>
          </div>

          {/* Contact Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Your Message
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Please describe your question or issue in detail..."
                className="w-full h-32 px-4 py-3 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                disabled={isSubmitting}
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-500">
                  {message.length}/1000 characters
                </span>
                {error && (
                  <span className="text-xs text-red-600">{error}</span>
                )}
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !message.trim()}
              className="w-full flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  Send Message
                  <PaperAirplaneIcon className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          {/* Contact Info */}
          <div className="mt-8 bg-gray-50 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Other Ways to Reach Us</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Email Support</p>
                  <p className="text-sm text-gray-600">sparklencs@gmail.com</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Response Time</p>
                  <p className="text-sm text-gray-600">Usually within 24 hours</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpSupportPage;