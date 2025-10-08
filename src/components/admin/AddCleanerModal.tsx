import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cleanerService } from '../../services/cleanerService';
import { CreateCleanerData } from '../../types/cleaner';

const cleanerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  sex: z.string().optional(),
});

type CleanerFormData = z.infer<typeof cleanerSchema>;

interface AddCleanerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddCleanerModal: React.FC<AddCleanerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CleanerFormData>({
    resolver: zodResolver(cleanerSchema),
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: CleanerFormData) => {
    setIsLoading(true);
    try {
      let avatarUrl: string | undefined;

      // Upload avatar if provided
      if (avatarFile) {
        try {
          const tempId = `temp_${Date.now()}`;
          avatarUrl = await cleanerService.uploadCleanerAvatar(avatarFile, tempId);
        } catch (uploadError) {
          console.warn('Avatar upload failed, creating cleaner without avatar:', uploadError);
          // Continue without avatar if upload fails
          avatarUrl = undefined;
        }
      }

      // Create cleaner data
      const cleanerData: CreateCleanerData = {
        name: data.name,
        phone: data.phone || undefined,
        sex: (data.sex && ['male', 'female', 'other'].includes(data.sex)) 
          ? data.sex as 'male' | 'female' | 'other' 
          : undefined,
        avatar_url: avatarUrl,
      };

      await cleanerService.createCleaner(cleanerData);
      
      // Reset form
      reset();
      setAvatarFile(null);
      setAvatarPreview(null);
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating cleaner:', error);
      alert('Failed to create cleaner. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Bottom Sheet */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl transform transition-transform duration-300 ease-out translate-y-0 animate-slide-up max-h-[90vh] overflow-y-auto">
        {/* Handle */}
        <div className="w-10 h-1.5 bg-slate-300 rounded-full mx-auto mt-3 mb-2" />
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-black text-slate-800">Add New Cleaner</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors duration-200 focus:outline-none"
          >
            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Avatar Upload */}
            <div>
              <label className="block text-sm font-black text-slate-700 mb-2">
                Avatar (Optional)
              </label>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden border-2 border-slate-200">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-black file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-black text-slate-700 mb-2">
                Name *
              </label>
              <input
                {...register('name')}
                type="text"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-medium placeholder-slate-400"
                placeholder="Enter cleaner's name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 font-medium">{errors.name.message}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-black text-slate-700 mb-2">
                Phone Number
              </label>
              <input
                {...register('phone')}
                type="tel"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-medium placeholder-slate-400"
                placeholder="Enter phone number"
              />
            </div>

            {/* Sex */}
            <div>
              <label className="block text-sm font-black text-slate-700 mb-2">
                Gender
              </label>
              <select
                {...register('sex')}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-medium"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Submit Buttons */}
            <div className="flex space-x-3 pt-6 pb-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors duration-200 font-black text-sm focus:outline-none"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-200/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-black text-sm focus:outline-none"
              >
                {isLoading ? 'Adding...' : 'Add Cleaner'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
