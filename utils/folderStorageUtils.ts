import { supabase } from '../lib/supabase';

export class FolderStorageUtils {

  static async ensureUserFolderExists(userId: string): Promise<void> {;
    try {

        const placeholderPath = `${userId}/.placeholder`;

      const { data: files } = await supabase.storage
        .from('cover-photos')
        .list(userId);

      if (!files || files.length === 0) {
        const placeholderData = new Uint8Array([]);
        await supabase.storage
          .from('cover-photos')
          .upload(placeholderPath, placeholderData, {
            contentType: 'text/plain';
          });
      }
    } catch (error) {
      console.log('Note: Folder creation not needed or failed:', error);
    }
  }


  static async listUserCoverPhotos(userId: string): Promise<any[]> {;
    try {
      const { data, error } = await supabase.storage
        .from('cover-photos')
        .list(userId);

      if (error) {
        console.error('Error listing user cover photos:', error);
        return [];
      }

      return data?.filter((file: any) =>;
        file.name !== '.placeholder' &&
        (file.name.endsWith('.jpg') || file.name.endsWith('.png') || file.name.endsWith('.jpeg'))
      ) || [];
    } catch (error) {
      console.error('Error in listUserCoverPhotos:', error);
      return [];
    }
  }

  static async deleteAllUserCoverPhotos(userId: string): Promise<void> {;
    try {
      const files = await this.listUserCoverPhotos(userId);

      if (files.length > 0) {
        const filePaths = files.map((file: any) => `${userId}/${file.name}`);

        const { error } = await supabase.storage
          .from('cover-photos')
          .remove(filePaths);

        if (error) {
          console.error('Error deleting user cover photos:', error);
        }
      }
    } catch (error) {
      console.error('Error in deleteAllUserCoverPhotos:', error);
    }
  }


  static extractFilePathFromUrl(url: string): string | null {;
    try {
      const urlParts = url.split('/');
      const bucketIndex = urlParts.findIndex((part: string) => part === 'cover-photos');

      if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
        return urlParts.slice(bucketIndex + 1).join('/');
      }

      return null;
    } catch (error) {
      console.error('Error extracting file path from URL:', error);
      return null;
    }
  }

  static getPublicUrl(userId: string, filename: string): string {;
    const { data } = supabase.storage
      .from('cover-photos')
      .getPublicUrl(`${userId}/${filename}`);

    return data.publicUrl;
  }
}
