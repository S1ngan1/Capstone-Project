import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { CustomPicker } from '../components/CustomPicker'
import { useNavigation } from '@react-navigation/native'
import { supabase } from '../lib/supabase'
import { useAuthContext } from '../context/AuthContext'
import { useDialog } from '../context/DialogContext'
const VIETNAM_LOCATIONS = [
  'Ho Chi Minh City',
  'Ha Noi',
  'Da Nang',
  'Hai Phong',
  'Can Tho',
  'An Giang',
  'Ba Ria - Vung Tau',
  'Bac Giang',
  'Bac Kan',
  'Bac Lieu',
  'Bac Ninh',
  'Ben Tre',
  'Binh Dinh',
  'Binh Duong',
  'Binh Phuoc',
  'Binh Thuan',
  'Ca Mau',
  'Cao Bang',
  'Dak Lak',
  'Dak Nong',
  'Dien Bien',
  'Dong Nai',
  'Dong Thap',
  'Gia Lai',
  'Ha Giang',
  'Ha Nam',
  'Ha Tinh',
  'Hai Duong',
  'Hau Giang',
  'Hoa Binh',
  'Hung Yen',
  'Khanh Hoa',
  'Kien Giang',
  'Kon Tum',
  'Lai Chau',
  'Lam Dong',
  'Lang Son',
  'Lao Cai',
  'Long An',
  'Nam Dinh',
  'Nghe An',
  'Ninh Binh',
  'Ninh Thuan',
  'Phu Tho',
  'Phu Yen',
  'Quang Binh',
  'Quang Nam',
  'Quang Ngai',
  'Quang Ninh',
  'Quang Tri',
  'Soc Trang',
  'Son La',
  'Tay Ninh',
  'Thai Binh',
  'Thai Nguyen',
  'Thanh Hoa',
  'Thua Thien Hue',
  'Tien Giang',
  'Tra Vinh',
  'Tuyen Quang',
  'Vinh Long',
  'Vinh Phuc',
  'Yen Bai'
]
const CreateFarm = () => {
  const navigation = useNavigation()
  const { session } = useAuthContext()
  const { showDialog } = useDialog()
  const [farmName, setFarmName] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('')
  // Fix 1: Properly type the selectedImage state
  const [selectedImage, setSelectedImage] = useState<ImagePicker.ImagePickerAsset | null>(null)
  const [loading, setLoading] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)
  useEffect(() => {
    requestPermissions()
  }, [])
  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      showDialog('Permission needed', 'Please grant permission to access your photos')
    }
  }
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      })
      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0])
      }
    } catch (error) {
      console.error('Error picking image:', error)
      showDialog('Error', 'Failed to pick image')
    }
  }
  // Fix 2: Properly type the imageUri parameter
  const uploadImageToSupabase = async (imageUri: string): Promise<string> => {
    try {
      setImageUploading(true)
      // Create form data for image upload
      const formData = new FormData()
      const fileName = `farm-${Date.now()}.jpg`
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: fileName,
      } as any) // Note: FormData typing can be tricky with React Native
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('farm-photos')
        .upload(`photos/${fileName}`, formData, {
          cacheControl: '3600',
          upsert: false,
        })
      if (error) {
        console.error('Upload error:', error)
        throw error
      }
      // Get public URL
      const { data: publicData } = supabase.storage
        .from('farm-photos')
        .getPublicUrl(`photos/${fileName}`)
      return publicData.publicUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      throw error
    } finally {
      setImageUploading(false)
    }
  }
  const createNotification = async (farmName: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: session?.user?.id,
          message: `Farm "${farmName}" created, waiting for approval`,
          type: 'farm_creation',
          created_at: new Date().toISOString(),
        })
      if (error) {
        console.error('Error creating notification:', error)
      }
    } catch (error) {
      console.error('Error in createNotification:', error)
    }
  }
  const handleCreateFarm = async () => {
    // Validation
    if (!farmName.trim()) {
      showDialog('Error', 'Please enter a farm name')
      return
    }
    if (!selectedLocation) {
      showDialog('Error', 'Please select a location')
      return
    }
    if (!selectedImage) {
      showDialog('Error', 'Please select an image for your farm')
      return
    }
    try {
      setLoading(true)
      // Fix 3: Use type assertion or null check for selectedImage.uri
      const imageUrl = await uploadImageToSupabase(selectedImage.uri)
      // Create farm request (pending approval)
      const { data, error } = await supabase
        .from('farm_requests') // You'll need to create this table
        .insert({
          user_id: session?.user?.id,
          farm_name: farmName.trim(),
          location: selectedLocation,
          farm_image: imageUrl,
          status: 'pending',
          created_at: new Date().toISOString(),
        })
      if (error) {
        console.error('Error creating farm request:', error)
        showDialog('Error', 'Failed to submit farm request')
        return
      }
      // Create notification
      await createNotification(farmName.trim())
      // Success alert
      showDialog(
        'Success!',
        'Your farm request has been submitted successfully. You will be notified once it\'s approved.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setFarmName('')
              setSelectedLocation('')
              setSelectedImage(null)
              // Navigate back
              navigation.goBack()
            }
          }
        ]
      )
    } catch (error) {
      console.error('Error in handleCreateFarm:', error)
      showDialog('Error', 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Farm</Text>
        <View style={styles.placeholder} />
      </View>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#e7fbe8ff', '#cdffcfff']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.gradientContainer}
        >
          {/* Farm Name Input */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>Farm Name *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter your farm name"
              value={farmName}
              onChangeText={setFarmName}
              maxLength={50}
            />
          </View>
          {/* Location Picker */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>Location *</Text>
            <View style={styles.pickerContainer}>
              <CustomPicker
                selectedValue={selectedLocation}
                onValueChange={setSelectedLocation}
                items={VIETNAM_LOCATIONS}
                placeholder="Select a location"
              />
            </View>
          </View>
          {/* Image Upload */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>Farm Image *</Text>
            <TouchableOpacity
              style={styles.imageUploadButton}
              onPress={pickImage}
              disabled={imageUploading}
            >
              {selectedImage ? (
                <Image source={{ uri: selectedImage.uri }} style={styles.selectedImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="camera-outline" size={48} color="#00A388" />
                  <Text style={styles.imagePlaceholderText}>Tap to select image</Text>
                </View>
              )}
              {imageUploading && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator size="small" color="#00A388" />
                </View>
              )}
            </TouchableOpacity>
          </View>
          {/* Create Button */}
          <TouchableOpacity
            style={[styles.createButton, loading && styles.createButtonDisabled]}
            onPress={handleCreateFarm}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="add-circle-outline" size={20} color="#fff" />
                <Text style={styles.createButtonText}>Create Farm Request</Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={styles.disclaimerText}>
            * Your farm request will be reviewed by administrators before approval
          </Text>
        </LinearGradient>
      </ScrollView>
    </View>
  )
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e7fbe8ff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  gradientContainer: {
    margin: 20,
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  inputSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  imageUploadButton: {
    backgroundColor: 'white',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
    position: 'relative',
  },
  selectedImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  imagePlaceholderText: {
    fontSize: 16,
    color: '#00A388',
    marginTop: 10,
    fontWeight: '500',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButton: {
    backgroundColor: '#00A388',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#00A388',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  createButtonDisabled: {
    backgroundColor: '#ccc',
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 15,
    fontStyle: 'italic',
  },
})
export default CreateFarm
