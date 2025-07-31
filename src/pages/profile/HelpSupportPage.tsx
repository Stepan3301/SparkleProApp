import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  ArrowLeftIcon, 
  QuestionMarkCircleIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  PhoneIcon,
  EnvelopeIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const supportFormSchema = z.object({
  topic: z.string().min(3, { message: "Topic must be at least 3 characters long." }),
  message: z.string().min(10, { message: "Message must be at least 10 characters long." }),
});

type SupportFormData = z.infer<typeof supportFormSchema>;

const HelpSupportPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<SupportFormData>({
    resolver: zodResolver(supportFormSchema),
  });

  const onSubmit = async (data: SupportFormData) => {
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Support request submitted:', data);
      setSubmitSuccess(true);
      reset();
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error submitting support request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const topicSuggestions = [
    "Booking Issues",
    "Payment Problems", 
    "Service Quality",
    "Account Settings",
    "Technical Support",
    "Billing Questions",
    "Schedule Changes",
    "General Inquiry"
  ];

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
        <h1 className="text-xl font-bold text-gray-900">Help & Support</h1>
      </header>

      {/* Content */}
      <div className="p-5 space-y-6">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <QuestionMarkCircleIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">We're Here to Help</h2>
              <p className="text-cyan-100 text-sm">Get support when you need it most</p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {submitSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <CheckCircleIcon className="w-6 h-6 text-emerald-600" />
              <div>
                <h3 className="font-semibold text-emerald-900">Message Sent Successfully!</h3>
                <p className="text-sm text-emerald-700">We'll get back to you within 24 hours.</p>
              </div>
            </div>
          </div>
        )}

        {/* Contact Form */}
        <div className="bg-white rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <ChatBubbleLeftRightIcon className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Contact Support</h3>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Topic Field */}
            <div>
              <label htmlFor="topic" className="block text-sm font-semibold text-gray-700 mb-2">
                Topic
              </label>
              <div className="relative">
                <input
                  id="topic"
                  type="text"
                  {...register('topic')}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                  placeholder="What do you need help with?"
                />
                <DocumentTextIcon className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
              </div>
              {errors.topic && (
                <p className="mt-2 text-sm text-red-500 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  {errors.topic.message}
                </p>
              )}
            </div>

            {/* Topic Suggestions */}
            <div>
              <p className="text-sm text-gray-600 mb-3">Popular topics:</p>
              <div className="flex flex-wrap gap-2">
                {topicSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => {
                      const topicInput = document.getElementById('topic') as HTMLInputElement;
                      if (topicInput) {
                        topicInput.value = suggestion;
                        topicInput.dispatchEvent(new Event('input', { bubbles: true }));
                      }
                    }}
                    className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            {/* Message Field */}
            <div>
              <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                Message
              </label>
              <div className="relative">
                <textarea
                  id="message"
                  rows={6}
                  {...register('message')}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 resize-none"
                  placeholder="Please describe your issue or question in detail..."
                />
                <ChatBubbleLeftRightIcon className="w-5 h-5 text-gray-400 absolute left-4 top-4" />
              </div>
              {errors.message && (
                <p className="mt-2 text-sm text-red-500 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  {errors.message.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Sending...
                </>
              ) : (
                <>
                  <EnvelopeIcon className="w-5 h-5" />
                  Send Message
                </>
              )}
            </button>
          </form>
        </div>

        {/* Alternative Contact Methods */}
        <div className="bg-white rounded-2xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Other Ways to Reach Us</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <PhoneIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Phone Support</h4>
                <p className="text-sm text-gray-600">+971 4 XXX XXXX</p>
                <p className="text-xs text-gray-500">Available 9 AM - 6 PM, Sunday to Thursday</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <EnvelopeIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Email Support</h4>
                <p className="text-sm text-gray-600">support@sparklepro.ae</p>
                <p className="text-xs text-gray-500">We'll respond within 24 hours</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <ClockIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Response Time</h4>
                <p className="text-sm text-gray-600">Urgent issues: 2-4 hours</p>
                <p className="text-xs text-gray-500">General inquiries: 12-24 hours</p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-2xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Frequently Asked Questions</h3>
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-semibold text-gray-900 mb-1">How do I reschedule my cleaning?</h4>
              <p className="text-sm text-gray-600">You can reschedule your booking up to 4 hours before the scheduled time through the app or by contacting us.</p>
            </div>
            <div className="border-l-4 border-emerald-500 pl-4">
              <h4 className="font-semibold text-gray-900 mb-1">What if I'm not satisfied with the service?</h4>
              <p className="text-sm text-gray-600">We offer a 24-hour satisfaction guarantee. Contact us immediately if you're not happy with the cleaning.</p>
            </div>
            <div className="border-l-4 border-amber-500 pl-4">
              <h4 className="font-semibold text-gray-900 mb-1">How do I add a new address?</h4>
              <p className="text-sm text-gray-600">Go to Profile → Addresses → Add New Address, or add it during the booking process.</p>
            </div>
            <div className="border-l-4 border-purple-500 pl-4">
              <h4 className="font-semibold text-gray-900 mb-1">Can I change my payment method?</h4>
              <p className="text-sm text-gray-600">Yes, visit Profile → Payment Methods to add, remove, or update your payment cards.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpSupportPage;