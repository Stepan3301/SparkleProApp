import React, { useState, useEffect } from 'react';
import { Cleaner } from '../../types/cleaner';
import { cleanerService } from '../../services/cleanerService';
import { supabase } from '../../lib/supabase';

interface AssignStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: number;
  currentAssignedCleaners?: string[];
  onSuccess: () => void;
}

export const AssignStaffModal: React.FC<AssignStaffModalProps> = ({
  isOpen,
  onClose,
  bookingId,
  currentAssignedCleaners = [],
  onSuccess,
}) => {
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [selectedCleaners, setSelectedCleaners] = useState<string[]>(currentAssignedCleaners);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCleaners();
      setSelectedCleaners(currentAssignedCleaners);
    }
  }, [isOpen, currentAssignedCleaners]);

  const fetchCleaners = async () => {
    try {
      setIsLoading(true);
      const data = await cleanerService.getActiveCleaners();
      setCleaners(data);
    } catch (error) {
      console.error('Error fetching cleaners:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCleanerToggle = (cleanerId: string) => {
    setSelectedCleaners(prev => {
      if (prev.includes(cleanerId)) {
        return prev.filter(id => id !== cleanerId);
      } else {
        return [...prev, cleanerId];
      }
    });
  };

  const handleSave = async () => {
    console.log('💾 AssignStaffModal handleSave: Starting staff assignment...');
    console.log('💾 AssignStaffModal handleSave: Booking ID:', bookingId);
    console.log('💾 AssignStaffModal handleSave: Selected cleaners:', selectedCleaners);
    
    try {
      setIsSaving(true);
      
      // Update the booking with assigned cleaners
      console.log('📡 AssignStaffModal handleSave: Updating bookings table...');
      const { error } = await supabase
        .from('bookings')
        .update({ assigned_cleaners: selectedCleaners })
        .eq('id', bookingId);

      if (error) {
        console.error('❌ AssignStaffModal handleSave: Error updating booking:', error);
        alert('Failed to assign staff. Please try again.');
        return;
      }

      console.log('✅ AssignStaffModal handleSave: Booking updated successfully in database');
      console.log('🎉 AssignStaffModal handleSave: Calling onSuccess callback...');
      onSuccess();
      console.log('🚪 AssignStaffModal handleSave: Closing modal...');
      onClose();
    } catch (error) {
      console.error('❌ AssignStaffModal handleSave: Error assigning staff:', error);
      alert('Failed to assign staff. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Assign Staff</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:text-gray-800 transition-colors focus:outline-none"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Select cleaners to assign to this booking. You can select multiple cleaners.
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {cleaners.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No active cleaners available.
                </div>
              ) : (
                cleaners.map((cleaner) => (
                  <div
                    key={cleaner.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedCleaners.includes(cleaner.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleCleanerToggle(cleaner.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                        {cleaner.avatar_url ? (
                          <img
                            src={cleaner.avatar_url}
                            alt={cleaner.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-gray-900">{cleaner.name}</h3>
                          <div className="flex items-center space-x-2">
                            {cleaner.phone && (
                              <span className="text-sm text-gray-500">{cleaner.phone}</span>
                            )}
                            {selectedCleaners.includes(cleaner.id) && (
                              <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>
                        {cleaner.sex && (
                          <p className="text-sm text-gray-500 capitalize">{cleaner.sex}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          <div className="mt-6">
            <div className="text-sm text-gray-600 mb-4">
              <strong>Selected:</strong> {selectedCleaners.length} cleaner{selectedCleaners.length !== 1 ? 's' : ''}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:text-gray-900 transition-colors focus:outline-none"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save Assignment'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
