import React from 'react';
import DirhamIcon from './DirhamIcon';

interface FloatingCartProps {
  total: number;
  propertySize: string;
  cleanersCount: number;
  ownMaterials: boolean;
  addonsCount: number;
  onContinue: () => void;
  continueText?: string;
  disabled?: boolean;
}

const FloatingCart: React.FC<FloatingCartProps> = ({
  total,
  propertySize,
  cleanersCount,
  ownMaterials,
  addonsCount,
  onContinue,
  continueText = 'Continue',
  disabled = false
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="max-w-2xl mx-auto p-4">
        {/* Cart Summary */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1">
                         <div className="flex items-center gap-2 mb-1">
               <div className="text-primary">
                 <DirhamIcon size="lg" color="inherit" />
               </div>
               <span className="text-2xl font-bold text-gray-900">{total}</span>
             </div>
            <div className="text-sm text-gray-600">
              {propertySize.charAt(0).toUpperCase() + propertySize.slice(1)} • {cleanersCount} cleaner{cleanersCount > 1 ? 's' : ''} • {ownMaterials ? 'Own materials' : 'Materials provided'}
              {addonsCount > 0 && ` • +${addonsCount} extra${addonsCount > 1 ? 's' : ''}`}
            </div>
          </div>
          
          {/* Continue Button */}
          <button
            onClick={onContinue}
            disabled={disabled}
            className="bg-gradient-to-r from-primary to-blue-600 text-white px-8 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none min-w-[120px]"
          >
            {disabled ? 'Processing...' : continueText}
          </button>
        </div>
        
        {/* Service Details */}
        <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
          {cleanersCount} professional cleaner{cleanersCount > 1 ? 's' : ''} • 2 hours minimum
        </div>
      </div>
    </div>
  );
};

export default FloatingCart; 