import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import DirhamIcon from '../ui/DirhamIcon';

interface ServiceInclusion {
  id: number;
  inclusion_text: string;
  display_order: number;
}

interface ServiceInclusionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: () => void;
  serviceId: number;
  serviceName: string;
  servicePrice: number;
  serviceImage?: string;
}

const ServiceInclusionsModal: React.FC<ServiceInclusionsModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  serviceId,
  serviceName,
  servicePrice,
  serviceImage
}) => {
  const [inclusions, setInclusions] = useState<ServiceInclusion[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchInclusions = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('service_inclusions')
        .select('*')
        .eq('service_id', serviceId)
        .order('display_order');

      if (error) throw error;
      setInclusions(data || []);
    } catch (error) {
      console.error('Error fetching service inclusions:', error);
    } finally {
      setLoading(false);
    }
  }, [serviceId]);

  useEffect(() => {
    if (isOpen && serviceId) {
      fetchInclusions();
    }
  }, [isOpen, serviceId, fetchInclusions]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="relative">
          {serviceImage && (
            <div className="h-48 bg-gradient-to-br from-emerald-500 to-teal-600 relative overflow-hidden">
              <img
                src={serviceImage}
                alt={serviceName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback gradient if image fails to load
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>
          )}
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Service Details */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">{serviceName}</h2>
            <div className="flex items-center gap-2">
              <DirhamIcon size="sm" />
              <span className="text-2xl font-bold text-emerald-600">{servicePrice}</span>
            </div>
          </div>

          {/* What's Included Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">What's included</h3>
            
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="animate-pulse flex items-start gap-3">
                    <div className="w-2 h-2 bg-gray-300 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="h-4 bg-gray-300 rounded w-full"></div>
                  </div>
                ))}
              </div>
            ) : inclusions.length > 0 ? (
              <div className="space-y-4">
                {inclusions.map((inclusion) => (
                  <div key={inclusion.id} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {inclusion.inclusion_text}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm italic">
                Service details will be provided upon booking.
              </p>
            )}
          </div>

          {/* Steam Cleaning Notice */}
          {serviceName.toLowerCase().includes('deep cleaning') && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="text-amber-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-amber-800 text-sm mb-1">Additional Services</h4>
                  <p className="text-amber-700 text-xs">
                    Steam Cleaning/Grout Cleaning can be provided at an additional charge.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={() => {
              if (onSelect) {
                onSelect();
              } else {
                onClose();
              }
            }}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold py-3 rounded-xl hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2"
          >
            Choose This Package
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceInclusionsModal;
