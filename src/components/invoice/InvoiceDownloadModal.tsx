import React from 'react';

interface InvoiceDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
  bookingNumber: string;
  isGenerating: boolean;
}

const InvoiceDownloadModal: React.FC<InvoiceDownloadModalProps> = ({
  isOpen,
  onClose,
  onDownload,
  bookingNumber,
  isGenerating
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 transform transition-all duration-300 scale-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 text-center border-b border-gray-100">
            {/* PDF Icon */}
            <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7h-4V3" />
              </svg>
            </div>
            
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Download Invoice
            </h3>
            <p className="text-sm text-gray-600">
              Generate and download a PDF invoice for booking <span className="font-semibold text-emerald-600">#{bookingNumber}</span>
            </p>
          </div>
          
          {/* Content */}
          <div className="p-6">
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-emerald-900 mb-1">
                    Professional Invoice
                  </h4>
                  <p className="text-xs text-emerald-700 leading-relaxed">
                    Your invoice will include all service details, pricing breakdown, and company information in a professional PDF format.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={isGenerating}
                className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Back
              </button>
              <button
                onClick={onDownload}
                disabled={isGenerating}
                className="flex-1 px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default InvoiceDownloadModal;
