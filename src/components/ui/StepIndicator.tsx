import React from 'react';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, totalSteps }) => {
  const stepLabels = ['Service', 'Extras', 'Schedule', 'Contact'];

  return (
    <div className="mb-8">
      {/* Steps Progress */}
      <div className="flex justify-center items-center mb-4 relative px-4">
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isPending = stepNumber > currentStep;

          return (
            <React.Fragment key={stepNumber}>
              {/* Step Cloud */}
              <div className="relative">
                <div
                  className={`
                    relative w-16 h-16 flex items-center justify-center font-bold text-lg
                    transition-all duration-400 ease-out z-10
                    ${isCurrent ? 'transform scale-105 text-white' : ''}
                    ${isCompleted ? 'text-white' : ''}
                    ${isPending ? 'text-gray-600' : ''}
                  `}
                  style={{
                    clipPath: 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)',
                  }}
                >
                  {/* Cloud Background */}
                  <div
                    className={`
                      absolute inset-0 transition-all duration-400 ease-out
                      ${isCurrent ? 'shadow-lg shadow-primary/40 scale-110' : ''}
                      ${isCompleted ? 'shadow-md shadow-accent/30' : ''}
                      ${isPending ? 'shadow-sm shadow-gray-300/20' : ''}
                    `}
                    style={{
                      background: isCurrent 
                        ? 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)'
                        : isCompleted 
                        ? 'linear-gradient(135deg, #10B981 0%, #34D399 100%)'
                        : 'linear-gradient(135deg, #E5E7EB 0%, #9CA3AF 100%)',
                      clipPath: 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)',
                      borderRadius: '50% 20% 50% 20%',

                    }}
                  />
                  
                  {/* Cloud Decorative Bubble */}
                  <div
                    className={`
                      absolute -top-2 -right-2 w-5 h-5 rounded-full transition-all duration-400 ease-out opacity-70
                    `}
                    style={{
                      background: isCurrent 
                        ? 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)'
                        : isCompleted 
                        ? 'linear-gradient(135deg, #10B981 0%, #34D399 100%)'
                        : 'linear-gradient(135deg, #E5E7EB 0%, #9CA3AF 100%)',
                    }}
                  />
                  
                  {/* Step Number */}
                  <span className="relative z-20 font-extrabold" style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)' }}>
                    {stepNumber}
                  </span>
                </div>
              </div>

              {/* Connector Line */}
              {index < totalSteps - 1 && (
                <div className="flex-1 mx-3 relative">
                  <div
                    className={`
                      h-1 rounded-full transition-all duration-500 ease-out relative overflow-hidden
                      ${stepNumber < currentStep ? 'bg-gradient-to-r from-accent to-emerald-400 shadow-sm shadow-accent/30' : 'bg-gradient-to-r from-gray-200 to-gray-300'}
                    `}
                  >
                                         {/* Shimmer effect for active connectors */}
                     {stepNumber < currentStep && (
                       <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse" />
                     )}
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step Labels */}
      <div className="flex justify-between px-8">
        {stepLabels.map((label, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <div
              key={label}
              className={`
                text-xs font-semibold text-center uppercase tracking-wider transition-colors duration-300
                ${isCurrent ? 'text-primary' : ''}
                ${isCompleted ? 'text-accent' : ''}
                ${stepNumber > currentStep ? 'text-gray-500' : ''}
              `}
            >
              {label}
            </div>
          );
        })}
      </div>


    </div>
  );
};

export default StepIndicator; 