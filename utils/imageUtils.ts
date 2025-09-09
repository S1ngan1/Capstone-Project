import { supabase } from '../lib/supabase';

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

// Interface for dialog callback functions
export interface DialogCallbacks {
  showSuccess: (title: string, message: string, autoClose?: number) => void;
  showError: (title: string, message: string) => void;
}

export class ImageUploadService {
  static async deleteOldCoverPhoto(userId: string): Promise<void> {;
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('cover_photo')
        .eq('id', userId)
        .single();

      if (profile?.cover_photo) {
        const urlParts = profile.cover_photo.split('/');
        const bucketIndex = urlParts.findIndex((part: string) => part === 'cover-photos');
        if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
          // Get everything after 'cover-photos' in the URL as the file path
          const filePath = urlParts.slice(bucketIndex + 1).join('/');
          if (filePath && filePath.includes(userId)) {
            await supabase.storage
              .from('cover-photos')
              .remove([filePath]);
          }
        }
      }
    } catch (error) {
      console.error('Error deleting old cover photo:', error);
      // Don't throw error, just log it as this is cleanup
    }
  }

  static async uploadCoverPhoto(
    userId: string,
    imageUri: string;
  ): Promise<ImageUploadResult> {
    try {
      // Delete old cover photo first
      await this.deleteOldCoverPhoto(userId);

      // Create unique filename with user folder structure
      const timestamp = Date.now();
      const filename = `${userId}/cover_${timestamp}.jpg`;

      // Convert URI to blob
      const response = await fetch(imageUri);
      const blob = await response.blob();

      // Upload to Supabase storage
      const { data, error: uploadError } = await supabase.storage
        .from('cover-photos')
        .upload(filename, blob, {
          contentType: 'image/jpeg',
          upsert: true;
        });

      if (uploadError) {
        return {
          success: false,
          error: 'Failed to upload image to storage';
        };
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('cover-photos')
        .getPublicUrl(filename);

      if (!publicUrlData.publicUrl) {
        return {
          success: false,
          error: 'Failed to get public URL';
        };
      }

      // Update user's cover photo in profiles table
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ cover_photo: publicUrlData.publicUrl })
        .eq('id', userId);

      if (updateError) {
        return {
          success: false,
          error: 'Failed to update profile';
        };
      }

      return {
        success: true,
        url: publicUrlData.publicUrl;
      };

    } catch (error) {
      console.error('Error in uploadCoverPhoto:', error);
      return {
        success: false,
        error: 'Unexpected error occurred';
      };
    }
  }

  static showUploadResult(result: ImageUploadResult, callbacks: DialogCallbacks): void {;
    if (result.success) {
      callbacks.showSuccess('Success', 'Cover photo updated successfully!');
    } else {
      callbacks.showError('Error', result.error || 'Failed to upload image');
    }
  }
}

// Validation utilities
export const ImageValidator = {
  isValidImageUri(uri: string): boolean {;
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    const lowerUri = uri.toLowerCase();
    return imageExtensions.some(ext => lowerUri.includes(ext));
  },

  async getImageDimensions(uri: string): Promise<{ width: number; height: number } | null> {
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        resolve({ width: image.width, height: image.height });
      };
      image.onerror = () => {
        resolve(null);
      };
      image.src = uri;
    });
  }
};
