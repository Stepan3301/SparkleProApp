import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DirhamIcon from './DirhamIcon';

interface ServiceDetailModalProps {
  service: {
    id: number;
    name: string;
    description: string;
    price_per_hour?: number | null;
    base_price?: number | null;
  } | null;
  serviceImage: string;
  serviceKey: string;
  isOpen: boolean;
  onClose: () => void;
}

const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({
  service,
  serviceImage,
  serviceKey,
  isOpen,
  onClose
}) => {
  const navigate = useNavigate();

  // Handle escape key press
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleBookNow = () => {
    onClose();
    navigate(`/booking?service=${serviceKey}`);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!service) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleBackdropClick}
      />

      {/* Modal */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="bg-white rounded-t-3xl shadow-2xl max-h-[85vh] overflow-hidden">
          {/* Handle bar */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(85vh-60px)]">
            {/* Service Image */}
            <div className="relative">
              <div className="w-full h-64 overflow-hidden">
                <img
                  src={serviceImage}
                  alt={service.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.src = '/regular-cleaning.jpg';
                  }}
                />
              </div>
              
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white/90 transition-colors"
              >
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Service Details */}
            <div className="p-6">
              {/* Service Name */}
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                {service.name}
              </h2>

              {/* Price */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl font-bold text-emerald-600">From</span>
                                 <div className="flex items-center gap-1">
                   <div className="text-emerald-600">
                     <DirhamIcon size="lg" color="inherit" />
                   </div>
                   <span className="text-2xl font-bold text-emerald-600">
                     {service.price_per_hour || service.base_price}
                   </span>
                 </div>
                <span className="text-lg text-emerald-600 font-semibold">
                  {service.price_per_hour ? '/hour' : ''}
                </span>
              </div>

              {/* Service Description */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Service Description</h3>
                <p className="text-gray-600 leading-relaxed">
                  {service.description}
                </p>
              </div>

              {/* Features (you can customize this based on service type) */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">What's Included</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                    <span className="text-gray-600">Professional cleaning equipment</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                    <span className="text-gray-600">Eco-friendly cleaning products</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                    <span className="text-gray-600">Trained and insured cleaners</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                    <span className="text-gray-600">Quality guarantee</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="border-t border-gray-100 p-6 bg-gray-50">
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 px-6 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleBookNow}
                className="flex-2 py-3 px-8 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all transform hover:scale-105 shadow-lg"
              >
                Book Now!
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ServiceDetailModal; 