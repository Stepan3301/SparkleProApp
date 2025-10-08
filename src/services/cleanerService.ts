import { supabase } from '../lib/supabase';
import { Cleaner, CreateCleanerData, UpdateCleanerData } from '../types/cleaner';

export const cleanerService = {
  // Get all cleaners
  async getCleaners(): Promise<Cleaner[]> {
    const { data, error } = await supabase
      .from('cleaners')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching cleaners:', error);
      throw error;
    }

    return data || [];
  },

  // Get active cleaners only
  async getActiveCleaners(): Promise<Cleaner[]> {
    const { data, error } = await supabase
      .from('cleaners')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching active cleaners:', error);
      throw error;
    }

    return data || [];
  },

  // Create a new cleaner
  async createCleaner(cleanerData: CreateCleanerData): Promise<Cleaner> {
    const { data, error } = await supabase
      .from('cleaners')
      .insert([cleanerData])
      .select()
      .single();

    if (error) {
      console.error('Error creating cleaner:', error);
      throw error;
    }

    return data;
  },

  // Update a cleaner
  async updateCleaner(id: string, cleanerData: UpdateCleanerData): Promise<Cleaner> {
    const { data, error } = await supabase
      .from('cleaners')
      .update(cleanerData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating cleaner:', error);
      throw error;
    }

    return data;
  },

  // Delete a cleaner (soft delete by setting is_active to false)
  async deleteCleaner(id: string): Promise<void> {
    const { error } = await supabase
      .from('cleaners')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('Error deleting cleaner:', error);
      throw error;
    }
  },

  // Get cleaner by ID
  async getCleanerById(id: string): Promise<Cleaner | null> {
    const { data, error } = await supabase
      .from('cleaners')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching cleaner:', error);
      return null;
    }

    return data;
  },

  // Upload cleaner avatar
  async uploadCleanerAvatar(file: File, cleanerId: string): Promise<string> {
    // Get current user ID for RLS compliance
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User must be authenticated to upload cleaner avatars');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `cleaner_${cleanerId}.${fileExt}`;
    // Use user's folder to comply with RLS policies
    const filePath = `${user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('Error uploading cleaner avatar:', uploadError);
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return data.publicUrl;
  }
};
