import React, { useState, useEffect } from 'react';
import { Cleaner } from '../../types/cleaner';
import { cleanerService } from '../../services/cleanerService';
import { AddCleanerModal } from './AddCleanerModal';

export const StaffManagement: React.FC = () => {
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm] = useState('');

  const fetchCleaners = async () => {
    try {
      setIsLoading(true);
      const data = await cleanerService.getCleaners();
      setCleaners(data);
    } catch (error) {
      console.error('Error fetching cleaners:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCleaners();
  }, []);

  const filteredCleaners = cleaners.filter(cleaner =>
    cleaner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cleaner.phone?.includes(searchTerm) ||
    cleaner.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCleanerAdded = () => {
    fetchCleaners();
  };

  const handleToggleActive = async (cleaner: Cleaner) => {
    try {
      await cleanerService.updateCleaner(cleaner.id, {
        is_active: !cleaner.is_active
      });
      fetchCleaners();
    } catch (error) {
      console.error('Error updating cleaner:', error);
      alert('Failed to update cleaner status');
    }
  };

  const handleDeleteCleaner = async (cleaner: Cleaner) => {
    if (window.confirm(`Are you sure you want to delete ${cleaner.name}?`)) {
      try {
        await cleanerService.deleteCleaner(cleaner.id);
        fetchCleaners();
      } catch (error) {
        console.error('Error deleting cleaner:', error);
        alert('Failed to delete cleaner');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {/* Cleaners List */}
      {filteredCleaners.length === 0 ? (
        <div className="text-center py-8 text-slate-500 font-medium">
          {searchTerm ? 'No cleaners found matching your search.' : 'No cleaners added yet.'}
        </div>
      ) : (
        filteredCleaners.map((cleaner) => (
          <div key={cleaner.id} className="bg-white border border-slate-200 rounded-2xl p-3 shadow-lg shadow-slate-100/50">
            <div className="flex items-center justify-between gap-2.5 mb-2">
              <span className={`text-xs font-black px-2.5 py-1 rounded-full border ${
                cleaner.is_active
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  : 'text-red-700 bg-red-50 border-red-200'
              }`}>
                {cleaner.is_active ? 'Active' : 'Inactive'}
              </span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => handleToggleActive(cleaner)}
                  className={`text-xs font-black px-2.5 py-1.5 rounded-full border transition-colors duration-200 focus:outline-none ${
                    cleaner.is_active
                      ? 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 hover:shadow-sm focus:ring-orange-300'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:shadow-sm focus:ring-emerald-300'
                  }`}
                >
                  {cleaner.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => handleDeleteCleaner(cleaner)}
                  className="text-xs font-black px-2.5 py-1.5 rounded-full border bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:shadow-sm transition-colors duration-200 focus:outline-none"
                >
                  Delete
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="font-black text-sm text-slate-800">{cleaner.name}</div>
              <div className="flex gap-2 text-xs">
                <span className="text-slate-500 font-bold w-16 shrink-0">ID:</span>
                <span className="flex-1 text-slate-700 font-medium text-xs break-all">{cleaner.id}</span>
              </div>
              {cleaner.phone && (
                <div className="flex gap-2 text-xs">
                  <span className="text-slate-500 font-bold w-16 shrink-0">Phone:</span>
                  <span className="flex-1 text-slate-700 font-medium">{cleaner.phone}</span>
                </div>
              )}
              {cleaner.sex && (
                <div className="flex gap-2 text-xs">
                  <span className="text-slate-500 font-bold w-16 shrink-0">Gender:</span>
                  <span className="flex-1 text-slate-700 font-medium capitalize">{cleaner.sex}</span>
                </div>
              )}
            </div>
          </div>
        ))
      )}

      {/* Add Cleaner Modal */}
      <AddCleanerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleCleanerAdded}
      />
    </div>
  );
};
