import React, { useState } from 'react';
import { XMarkIcon, CalendarIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import Button from '../ui/Button';
import EnhancedDateTimePicker from './EnhancedDateTimePicker';
import { Booking } from '../../types/booking';

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onConfirm: (newDate: string, newTime: string) => Promise<void>;
}

const RescheduleModal: React.FC<RescheduleModalProps> = ({
  isOpen,
  onClose,
  booking,
  onConfirm
}) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  if (!isOpen || !booking) return null;

  const handleConfirm = async () => {
    if (!selectedDate || !selectedTime) {
      alert('Please select both date and time');
      return;
    }

    setIsConfirming(true);
    try {
      await onConfirm(selectedDate, selectedTime);
      // Reset form
      setSelectedDate('');
      setSelectedTime('');
      onClose();
    } catch (error) {
      console.error('Error rescheduling booking:', error);
      alert('Failed to reschedule booking. Please try again.');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleBack = () => {
    setSelectedDate('');
    setSelectedTime('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white relative overflow-hidden flex-shrink-0 rounded-t-3xl" style={{ height: '120px' }}>
          {/* Decorative background */}
          <div className="absolute inset-0 bg-white opacity-10">
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-white opacity-20 transform translate-x-12 -translate-y-12"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 rounded-full bg-white opacity-20 transform -translate-x-8 translate-y-8"></div>
          </div>
          
          {/* Close button */}
          <button
            onClick={handleBack}
            className="absolute top-4 right-4 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors z-20"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
          
          {/* Title */}
          <div className="absolute inset-x-0 top-8 z-10 px-6">
            <h2 className="text-xl font-bold text-center leading-tight flex items-center justify-center gap-2">
              <CalendarIcon className="w-6 h-6" />
              Reschedule Booking
            </h2>
            <p className="text-blue-100 text-sm text-center mt-1">Booking #{booking.id}</p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Choose New Date & Time</h3>
            <p className="text-gray-600 text-sm">
              Current: {new Date(booking.service_date).toLocaleDateString('en-AE', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
              })} at {booking.service_time}
            </p>
          </div>
          
          <EnhancedDateTimePicker
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            onDateChange={setSelectedDate}
            onTimeChange={setSelectedTime}
          />
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-6 border-t border-gray-100">
          <div className="flex gap-3">
            <Button
              variant="secondary"
              shape="bubble"
              size="md"
              onClick={handleBack}
              leftIcon={<ArrowLeftIcon className="w-4 h-4" />}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              variant="primary"
              shape="bubble"
              size="md"
              onClick={handleConfirm}
              disabled={!selectedDate || !selectedTime || isConfirming}
              leftIcon={<CalendarIcon className="w-4 h-4" />}
              className="flex-1"
            >
              {isConfirming ? 'Confirming...' : 'Confirm'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RescheduleModal;
