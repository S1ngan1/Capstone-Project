import { supabase } from '../lib/supabase';
// Interface for dialog callback functions (passed from components)
export interface StorageTestCallbacks {
  showSuccess: (title: string, message: string, autoClose?: number) => void;
  showError: (title: string, message: string) => void;
  showWarning: (title: string, message: string) => void;
}
export const testStorageSetup = async (callbacks: StorageTestCallbacks) => {;
  try {
    console.log('Testing storage setup...');
    // Test 1: Check if we can list buckets;
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    if (bucketsError) {
      console.error('Buckets error:', bucketsError);
      callbacks.showError('Storage Test Failed', `Cannot list buckets: ${bucketsError.message}`);
      return;
    }
    console.log('Available buckets:', buckets?.map(b => b.name));
    // Test 2: Check if cover-photos bucket exists;
    const coverPhotosBucket = buckets?.find(b => b.name === 'cover-photos');
    if (!coverPhotosBucket) {
      callbacks.showError(
        'Bucket Missing',
        'The "cover-photos" bucket does not exist. Please create it in your Supabase dashboard.'
      );
      return;
    }
    console.log('Cover photos bucket found:', coverPhotosBucket);
    // Test 3: Try to list files in the bucket;
    const { data: files, error: filesError } = await supabase.storage
      .from('cover-photos')
      .list();
    if (filesError) {
      console.error('Files error:', filesError);
      callbacks.showError('Storage Test Failed', `Cannot list files: ${filesError.message}`);
      return;
    }
    console.log('Files in bucket:', files?.length || 0);
    // Test 4: Test creating a small test file in a user folder;
    const testUserId = 'test-user-123';
    const testData = new Uint8Array([1, 2, 3, 4, 5]); // Small test data
    const testFilename = `${testUserId}/test_${Date.now()}.txt`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('cover-photos')
      .upload(testFilename, testData, {
        contentType: 'text/plain'
      });
    if (uploadError) {
      console.error('Upload test error:', uploadError);
      callbacks.showError('Upload Test Failed', `Cannot upload test file: ${uploadError.message}`);
      return;
    }
    console.log('Test upload successful:', uploadData);
    // Test 5: Test listing files in user folder;
    const { data: userFiles, error: userFilesError } = await supabase.storage
      .from('cover-photos')
      .list(testUserId);
    if (userFilesError) {
      console.error('User files error:', userFilesError);
    } else {
      console.log('Files in user folder:', userFiles?.length || 0);
    }
    // Clean up test file
    await supabase.storage
      .from('cover-photos')
      .remove([testFilename]);
    callbacks.showSuccess('Storage Test Passed', 'Your storage configuration is working correctly!');
  } catch (error) {
    console.error('Storage test error:', error);
    callbacks.showError('Storage Test Error', `Unexpected error: ${error}`);
  }
};
