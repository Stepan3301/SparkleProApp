import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import DirhamIcon from '../components/ui/DirhamIcon';
import Button from '../components/ui/Button';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface ServiceData {
  id: number;
  name: string;
  description: string;
  base_price: number;
  price_per_hour: number | null;
  is_active: boolean;
}

const ServicesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [services, setServices] = useState<ServiceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchServices();
    }
  }, [user]);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const getServiceImage = (serviceName: string) => {
    const imageMap: { [key: string]: string } = {
      'regular': '/regular-cleaning.jpg',
      'deep': '/deep-cleaning.JPG',
      'move': '/move-in-move-out.JPG',
      'office': '/office-cleaning.JPG',
      'villa': '/villa-deep-cleaning.png',
      'apartment': '/appartment-deep-cleaning.png',
      'window': '/window-cleaning.JPG',
      'kitchen': '/kitchen-deep-cleaning.png',
      'bathroom': '/bathroom-deep-cleaning.png',
      'facade': '/villa-facade-cleaning.png',
      'postconstruction': '/post-construction-cleaning.png',
      'construction': '/post-construction-cleaning.png',
      'wardrobe': '/wardrobe-cabinet-cleaning.png',
      'cabinet': '/wardrobe-cabinet-cleaning.png',
      'sofa': '/sofa-cleaning.png',
      'mattress': '/matress-cleaning.png',
      'curtains': '/curtains-cleaning.JPG'
    };
    
    const name = serviceName.toLowerCase();
    
    // Specific service name matching (most specific first)
    if (name.includes('full villa deep')) return '/villa-deep-cleaning.png';
    if (name.includes('full apartment deep')) return '/appartment-deep-cleaning.png';
    if (name.includes('villa facade')) return '/villa-facade-cleaning.png';
    if (name.includes('bathroom deep')) return '/bathroom-deep-cleaning.png';
    if (name.includes('kitchen deep')) return '/kitchen-deep-cleaning.png';
    if (name.includes('post-construction') || name.includes('postconstruction')) return '/post-construction-cleaning.png';
    if (name.includes('wardrobe') || name.includes('cabinet')) return '/wardrobe-cabinet-cleaning.png';
    
    // General keyword matching
    for (const [key, image] of Object.entries(imageMap)) {
      if (name.includes(key)) {
        return image;
      }
    }
    return '/regular-cleaning.jpg'; // Default image
  };

  const getServiceKey = (serviceName: string) => {
    if (serviceName.toLowerCase().includes('regular')) return 'regular';
    if (serviceName.toLowerCase().includes('deep')) return 'deep';
    if (serviceName.toLowerCase().includes('move')) return 'move';
    if (serviceName.toLowerCase().includes('office')) return 'office';
    return serviceName.toLowerCase().replace(/\s/g, '');
  };

  const getServiceCategory = (serviceName: string) => {
    if (serviceName.toLowerCase().includes('regular')) return 'Hourly Service';
    if (serviceName.toLowerCase().includes('deep') && !serviceName.toLowerCase().includes('villa') && !serviceName.toLowerCase().includes('apartment')) return 'Hourly Service';
    if (serviceName.toLowerCase().includes('villa') || serviceName.toLowerCase().includes('apartment') || serviceName.toLowerCase().includes('move') || serviceName.toLowerCase().includes('kitchen') || serviceName.toLowerCase().includes('bathroom')) return 'Fixed Price Service';
    if (serviceName.toLowerCase().includes('window')) return 'Per Panel Service';
    return 'Professional Service';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white px-5 py-4 border-b border-gray-100 flex items-center gap-4 sticky top-0 z-50">
        <Button
          variant="nav-back"
          shape="bubble"
          size="sm"
          onClick={() => navigate('/home')}
          className="!min-w-[44px] !w-11 !h-11 !p-0"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold text-gray-900">All Services</h1>
      </header>

      <div className="max-w-2xl mx-auto p-4 pb-32">
        {/* Services Grid */}
        <div className="grid grid-cols-1 gap-4">
          {services.map((service) => {
            const serviceKey = getServiceKey(service.name);
            const category = getServiceCategory(service.name);
            
            return (
              <div 
                key={service.id} 
                className="service-card bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer relative transition-all hover:shadow-md hover:scale-[1.02]"
                onClick={() => navigate(`/booking?service=${serviceKey}`)}
              >
                <div className="flex items-center gap-4">
                  {/* Service Image */}
                  <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-emerald-50 to-sky-50 border-2 border-dashed border-gray-300">
                    <img
                      src={getServiceImage(serviceKey)}
                      alt={service.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/regular-cleaning.jpg';
                      }}
                    />
                  </div>

                  {/* Service Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900 mb-1">{service.name}</h3>
                        <p className="text-sm text-sky-600 font-medium mb-2">{category}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-primary font-bold text-lg">
                          {service.price_per_hour ? (
                            <>
                              <span className="text-sm text-gray-600">From</span>
                              <DirhamIcon size="sm" />
                              <span>{service.price_per_hour}/hour</span>
                            </>
                          ) : (
                            <>
                              <DirhamIcon size="sm" />
                              <span>{service.base_price}</span>
                            </>
                          )}
                        </div>
                        {service.base_price && service.price_per_hour && (
                          <p className="text-xs text-gray-500 mt-1">
                            Base: {service.base_price} AED
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {service.description}
                    </p>
                  </div>

                  {/* Arrow */}
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                      <ArrowLeftIcon className="w-4 h-4 text-emerald-600 rotate-180" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Info */}
        <div className="mt-8 bg-white rounded-2xl p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Service Information</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <span><strong>Hourly Services:</strong> Flexible cleaning with professional cleaners</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-sky-500 rounded-full"></div>
              <span><strong>Fixed Price Services:</strong> Complete packages for specific needs</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span><strong>Materials:</strong> Option to use your own or our professional supplies</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicesPage; 