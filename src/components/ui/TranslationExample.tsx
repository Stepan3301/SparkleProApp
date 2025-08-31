import React from 'react';
import { useSimpleTranslation } from '../../utils/i18n';

/**
 * Translation Example Component
 * 
 * This component demonstrates how to use all the translation keys
 * from the complete Russian translation system.
 */
const TranslationExample: React.FC = () => {
  const { t, tPlural } = useSimpleTranslation();

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        🌍 Complete Translation System Demo
      </h1>

      {/* App Section */}
      <section className="bg-blue-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">📱 App Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <strong>App Name:</strong> {t('app.name', 'SparklePro')}
          </div>
          <div>
            <strong>Tagline:</strong> {t('app.tagline', 'Professional cleaning service')}
          </div>
        </div>
      </section>

      {/* Navigation Section */}
      <section className="bg-green-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">🧭 Navigation</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>Home: {t('navigation.home', 'Home')}</div>
          <div>Booking: {t('navigation.booking', 'Book')}</div>
          <div>Services: {t('navigation.services', 'Services')}</div>
          <div>History: {t('navigation.history', 'History')}</div>
          <div>Profile: {t('navigation.profile', 'Profile')}</div>
          <div>Back: {t('navigation.back', 'Back')}</div>
          <div>Next: {t('navigation.next', 'Next')}</div>
          <div>Save: {t('navigation.save', 'Save')}</div>
        </div>
      </section>

      {/* Home Section */}
      <section className="bg-yellow-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">🏠 Home Page</h2>
        <div className="space-y-3">
          <div>
            <strong>Welcome:</strong> {t('home.welcome', 'Welcome!')}
          </div>
          <div>
            <strong>Description:</strong> {t('home.welcomeDescription', 'Your trusted cleaning partner')}
          </div>
          <div>
            <strong>Location:</strong> {t('home.location', 'Dubai, UAE')}
          </div>
          <div>
            <strong>Quick Book:</strong> {t('home.quickBook', 'Quick Book')}
          </div>
          <div>
            <strong>With Cleaners:</strong> {tPlural('home.withCleaners', 2, 'with 2 cleaners')}
          </div>
          <div>
            <strong>Materials:</strong> {t('home.ownMaterials', 'own materials')}
          </div>
        </div>
      </section>

      {/* Booking Section */}
      <section className="bg-purple-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">📋 Booking Process</h2>
        <div className="space-y-4">
          <div>
            <strong>Title:</strong> {t('booking.title', 'Make Booking')}
          </div>
          
          <div>
            <strong>Steps:</strong>
            <ul className="ml-6 mt-2 space-y-1">
              <li>• {t('booking.steps.selectService', 'Select Service')}</li>
              <li>• {t('booking.steps.extraServices', 'Extra Services')}</li>
              <li>• {t('booking.steps.scheduleService', 'Schedule Service')}</li>
              <li>• {t('booking.steps.contactDetails', 'Contact Details')}</li>
            </ul>
          </div>

          <div>
            <strong>Services:</strong>
            <ul className="ml-6 mt-2 space-y-1">
              <li>• {t('booking.services.regular', 'Regular Cleaning')}</li>
              <li>• {t('booking.services.deep', 'Deep Cleaning')}</li>
              <li>• {t('booking.services.packages', 'Complete Packages')}</li>
              <li>• {t('booking.services.specialized', 'Specialized Services')}</li>
            </ul>
          </div>

          <div>
            <strong>Property Sizes:</strong>
            <ul className="ml-6 mt-2 space-y-1">
              <li>• {t('booking.propertySize.small', 'Small')}</li>
              <li>• {t('booking.propertySize.medium', 'Medium')}</li>
              <li>• {t('booking.propertySize.large', 'Large')}</li>
              <li>• {t('booking.propertySize.villa', 'Villa')}</li>
            </ul>
          </div>

          <div>
            <strong>Cleaners:</strong> {tPlural('booking.cleaners', 3, '3 Cleaners')}
          </div>
          <div>
            <strong>Hours:</strong> {tPlural('booking.hours', 4, '4 Hours')}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="bg-indigo-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">💼 Services</h2>
        <div className="space-y-3">
          <div>
            <strong>Title:</strong> {t('services.title', 'Our Services')}
          </div>
          <div>
            <strong>Hourly Service:</strong> {t('services.hourlyService', 'Hourly Service')}
          </div>
          <div>
            <strong>Fixed Price:</strong> {t('services.fixedPriceService', 'Fixed Price Service')}
          </div>
          <div>
            <strong>From Price:</strong> {t('services.fromPrice', 'From {{price}}/hour').replace('{{price}}', '50')}
          </div>
        </div>
      </section>

      {/* History Section */}
      <section className="bg-red-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">📊 Booking History</h2>
        <div className="space-y-3">
          <div>
            <strong>Title:</strong> {t('history.title', 'Booking History')}
          </div>
          <div>
            <strong>No Bookings:</strong> {t('history.noBookings', 'No bookings yet')}
          </div>
          <div>
            <strong>Status:</strong>
            <ul className="ml-6 mt-2 space-y-1">
              <li>• {t('history.status.pending', 'Pending')}</li>
              <li>• {t('history.status.confirmed', 'Confirmed')}</li>
              <li>• {t('history.status.completed', 'Completed')}</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Profile Section */}
      <section className="bg-pink-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">👤 Profile</h2>
        <div className="space-y-3">
          <div>
            <strong>Title:</strong> {t('profile.title', 'Profile')}
          </div>
          <div>
            <strong>Personal Info:</strong> {t('profile.personalInfo', 'Personal Info')}
          </div>
          <div>
            <strong>Addresses:</strong> {t('profile.addresses', 'Addresses')}
          </div>
          <div>
            <strong>Payment:</strong> {t('profile.payment', 'Payment')}
          </div>
          <div>
            <strong>Notifications:</strong> {t('profile.notifications', 'Notifications')}
          </div>
          <div>
            <strong>Language:</strong> {t('profile.language', 'Language')}
          </div>
        </div>
      </section>

      {/* Common Section */}
      <section className="bg-gray-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">⚡ Common Elements</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>Yes: {t('common.yes', 'Yes')}</div>
          <div>No: {t('common.no', 'No')}</div>
          <div>Error: {t('common.error', 'Error')}</div>
          <div>Success: {t('common.success', 'Success')}</div>
          <div>Required: {t('common.required', 'Required')}</div>
          <div>Optional: {t('common.optional', 'Optional')}</div>
          <div>Book Now: {t('common.bookNow', 'Book Now!')}</div>
          <div>Processing: {t('common.processing', 'Processing...')}</div>
        </div>
      </section>

      {/* Alerts Section */}
      <section className="bg-orange-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">🚨 Alerts & Messages</h2>
        <div className="space-y-3">
          <div>
            <strong>Card Error:</strong> {t('alerts.pleaseEnterValidCardNumber', 'Please enter a valid card number')}
          </div>
          <div>
            <strong>Login Required:</strong> {t('alerts.pleaseLogInFirst', 'Please log in first')}
          </div>
          <div>
            <strong>Service Selection:</strong> {t('alerts.pleaseSelectServiceCategory', 'Please select a service category')}
          </div>
        </div>
      </section>

      {/* Forms Section */}
      <section className="bg-teal-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">📝 Forms</h2>
        <div className="space-y-3">
          <div>
            <strong>Improvement:</strong> {t('forms.whatCanWeImprove', 'What can we improve?')}
          </div>
          <div>
            <strong>Feedback:</strong> {t('forms.whatDidCleanersDoWell', 'What did our cleaners do well?')}
          </div>
          <div>
            <strong>Submit:</strong> {t('forms.submitReview', 'Submit Review')}
          </div>
        </div>
      </section>

      {/* Countries Section */}
      <section className="bg-cyan-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">🌍 Countries</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>UAE: {t('countries.unitedArabEmirates', 'United Arab Emirates')}</div>
          <div>Russia: {t('countries.russia', 'Russia')}</div>
          <div>India: {t('countries.india', 'India')}</div>
          <div>Qatar: {t('countries.qatar', 'Qatar')}</div>
          <div>Saudi Arabia: {t('countries.saudiArabia', 'Saudi Arabia')}</div>
          <div>Turkey: {t('countries.turkey', 'Turkey')}</div>
        </div>
      </section>

      {/* Language Switcher Info */}
      <section className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">🎯 How to Use</h2>
        <div className="space-y-3 text-blue-100">
          <div>
            <strong>Basic Translation:</strong> t('key.path', 'fallback')
          </div>
          <div>
            <strong>Pluralization:</strong> tPlural('key', count, 'fallback')
          </div>
          <div>
            <strong>Current Language:</strong> {t('profile.language', 'Language')}: {t('navigation.language', 'Language')}
          </div>
          <div className="text-sm opacity-90">
            💡 Switch languages using the language switcher in the header or profile page!
          </div>
        </div>
      </section>
    </div>
  );
};

export default TranslationExample;
