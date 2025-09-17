import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/OptimizedAuthContext';
import { supabase } from '../../lib/supabase';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  ArrowLeftIcon, 
  UserIcon,
  EnvelopeIcon,
  CameraIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import PhoneNumberInput from '../../components/ui/PhoneNumberInput';

const personalInfoSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  phoneNumber: z.string().optional().refine((val) => {
    if (!val || val.trim() === '') return true; // Allow empty/optional
    
    // Check if it starts with a valid country code and has proper length
    const countryCodes = ['+7', '+375', '+380', '+998', '+994', '+995', '+374', '+373', '+996', '+992', '+993', '+971', '+966', '+965', '+974', '+973', '+968'];
    const hasValidPrefix = countryCodes.some(code => val.startsWith(code));
    if (!hasValidPrefix) return false;
    
    // Check length based on country code
    const digits = val.replace(/\D/g, '');
    if (val.startsWith('+7')) return digits.length === 11; // Russia/Kazakhstan
    if (val.startsWith('+375')) return digits.length === 12; // Belarus
    if (val.startsWith('+380')) return digits.length === 12; // Ukraine
    if (val.startsWith('+998')) return digits.length === 12; // Uzbekistan
    if (val.startsWith('+994')) return digits.length === 12; // Azerbaijan
    if (val.startsWith('+995')) return digits.length === 12; // Georgia
    if (val.startsWith('+374')) return digits.length === 11; // Armenia
    if (val.startsWith('+373')) return digits.length === 11; // Moldova
    if (val.startsWith('+996')) return digits.length === 12; // Kyrgyzstan
    if (val.startsWith('+992')) return digits.length === 12; // Tajikistan
    if (val.startsWith('+993')) return digits.length === 11; // Turkmenistan
    if (val.startsWith('+971')) return digits.length === 12; // UAE
    if (val.startsWith('+966')) return digits.length === 12; // Saudi Arabia
    if (val.startsWith('+965')) return digits.length === 11; // Kuwait
    if (val.startsWith('+974')) return digits.length === 11; // Qatar
    if (val.startsWith('+973')) return digits.length === 12; // Bahrain
    if (val.startsWith('+968')) return digits.length === 12; // Oman
    
    return false;
  }, { message: "Please enter a valid phone number with correct country format" }),
});

type PersonalInfoFormData = z.infer<typeof personalInfoSchema>;

const PersonalInfoPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, formState: { errors }, setValue, control } = useForm<PersonalInfoFormData>({
    resolver: zodResolver(personalInfoSchema),
  });

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        setProfile(data);
        setValue('fullName', data.full_name || '');
        setValue('phoneNumber', data.phone_number || '');
        // Add cache-busting for existing avatar to ensure it loads properly
        setAvatarPreview(data.avatar_url ? `${data.avatar_url}?t=${Date.now()}` : null);
      } else {
        // Set default values from user metadata
        setValue('fullName', user.user_metadata?.full_name || '');
        setValue('phoneNumber', user.phone || '');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    console.log('Starting avatar upload for user:', user.id);
    console.log('File details:', { name: file.name, type: file.type, size: file.size });

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage('Please select an image file.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage('Image size must be less than 5MB.');
      return;
    }

    setAvatarUploading(true);
    setMessage(null);

    try {
      // Delete old avatar if exists
      if (profile?.avatar_url) {
        try {
          const oldFileName = profile.avatar_url.split('/').pop();
          if (oldFileName) {
            const oldFilePath = `${user.id}/${oldFileName}`;
            await supabase.storage
              .from('avatars')
              .remove([oldFilePath]);
            console.log('Old avatar deleted:', oldFilePath);
          }
        } catch (deleteError) {
          console.log('Could not delete old avatar:', deleteError);
          // Continue with upload even if delete fails
        }
      }

      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      console.log('Uploading to path:', fileName);

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true // Changed to true to allow overwriting
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      console.log('Upload successful:', uploadData);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      console.log('Public URL generated:', urlData.publicUrl);

      // Add cache-busting parameter to ensure fresh image load
      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      // Update profile with avatar URL (without cache-busting for storage)
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          avatar_url: urlData.publicUrl, // Store clean URL in database
          full_name: profile?.full_name,
          phone_number: profile?.phone_number,
        });

      if (updateError) {
        console.error('Profile update error:', updateError);
        throw updateError;
      }

      console.log('Profile updated successfully');

      // Use cache-busted URL for immediate display
      setAvatarPreview(avatarUrl);
      setProfile({ ...profile, avatar_url: urlData.publicUrl });
      setMessage('Avatar updated successfully!');
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      
      // Provide more specific error messages based on error type
      let errorMessage = 'Error uploading avatar: ';
      
      if (error.statusCode === 403) {
        errorMessage += 'Access denied. This usually means the storage policies are not configured correctly. Please contact support.';
      } else if (error.statusCode === 400) {
        errorMessage += 'Invalid file format or size. Please ensure the file is an image under 5MB.';
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Please try again.';
      }
      
      setMessage(errorMessage);
      
      // Log detailed error information for debugging
      console.log('Detailed error info:', {
        statusCode: error.statusCode,
        error: error.error,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
    } finally {
      setAvatarUploading(false);
      // Reset file input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user || !profile?.avatar_url) return;

    setAvatarUploading(true);
    setMessage(null);

    try {
      // Remove avatar URL from profile
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          avatar_url: null,
          full_name: profile.full_name,
          phone_number: profile.phone_number,
        });

      if (error) throw error;

      setAvatarPreview(null);
      setProfile({ ...profile, avatar_url: null });
      setMessage('Avatar removed successfully!');
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('Error removing avatar:', error);
      setMessage('Error removing avatar. Please try again.');
    } finally {
      setAvatarUploading(false);
    }
  };

  const onSubmit = async (data: PersonalInfoFormData) => {
    if (!user) return;

    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: data.fullName,
          phone_number: data.phoneNumber,
          avatar_url: profile?.avatar_url, // Preserve existing avatar
        });

      if (error) throw error;

      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setMessage('Error updating profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white px-5 py-4 border-b border-gray-100 flex items-center gap-4">
        <button 
          onClick={() => navigate('/profile')}
          className="p-2 rounded-xl bg-gray-100 active:bg-gray-200 transition-all active:scale-95"
        >
          <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Personal Information</h1>
      </header>

      {/* Content */}
      <div className="p-5">
        {/* User Avatar Section */}
        <div className="bg-white rounded-2xl p-6 mb-6">
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-4">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Profile Avatar"
                  className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                  onError={(e) => {
                    console.log('Image failed to load:', avatarPreview);
                    // Fallback to default avatar on error
                    setAvatarPreview(null);
                  }}
                  onLoad={() => {
                    console.log('Image loaded successfully:', avatarPreview);
                  }}
                />
              ) : (
                <div className="w-20 h-20 bg-gradient-to-r from-primary to-primary-light rounded-full flex items-center justify-center">
                  <UserIcon className="w-10 h-10 text-white" />
                </div>
              )}
              
              {/* Upload/Camera Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg transition-colors disabled:opacity-50"
              >
                {avatarUploading ? (
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <CameraIcon className="w-4 h-4" />
                )}
              </button>
              
              {/* Remove Button (only show if avatar exists) */}
              {avatarPreview && (
                <button
                  onClick={handleRemoveAvatar}
                  disabled={avatarUploading}
                  className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg transition-colors disabled:opacity-50"
                >
                  <TrashIcon className="w-3 h-3" />
                </button>
              )}
            </div>
            
            <h2 className="text-lg font-bold text-gray-900">{profile?.full_name || user?.user_metadata?.full_name || 'User'}</h2>
            <p className="text-gray-600 text-sm">{user?.email}</p>
            
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Update Your Information</h3>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <input
                  id="fullName"
                  type="text"
                  {...register('fullName')}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-gray-900"
                  placeholder="Enter your full name"
                />
                <UserIcon className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
              </div>
              {errors.fullName && (
                <p className="mt-2 text-sm text-red-500 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  {errors.fullName.message}
                </p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-semibold text-gray-700 mb-2">
                Phone Number
              </label>
              <Controller
                name="phoneNumber"
                control={control}
                render={({ field }) => (
                  <PhoneNumberInput
                    value={field.value || ''}
                    onChange={field.onChange}
                    error={errors.phoneNumber?.message}
                  />
                )}
              />
            </div>

            {/* Email (Read-only) */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  readOnly
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-100 text-gray-600 cursor-not-allowed"
                />
                <EnvelopeIcon className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
              </div>
              <p className="mt-1 text-xs text-gray-500">Email cannot be changed here. Contact support if needed.</p>
            </div>

            {/* Success/Error Messages */}
            {message && (
              <div className={`rounded-xl p-3 ${
                message.includes('Error') ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'
              }`}>
                <p className={`text-sm flex items-center ${
                  message.includes('Error') ? 'text-red-600' : 'text-green-600'
                }`}>
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    {message.includes('Error') ? (
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    ) : (
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    )}
                  </svg>
                  {message}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-primary-light text-white font-semibold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating...
                </div>
              ) : (
                'Update Information'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PersonalInfoPage; 